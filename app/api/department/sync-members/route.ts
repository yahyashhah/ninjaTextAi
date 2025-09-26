import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const { orgId } = await request.json();
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get organization from Prisma
    const organization = await prismadb.organization.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get members from Clerk
    const clerkMembers = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    let successCount = 0;
    let errorCount = 0;

    // Sync each member
    for (const clerkMember of clerkMembers.data) {
      try {
        // Check if publicUserData exists
        if (!clerkMember.publicUserData) {
          console.log(`⚠️ Skipping member without publicUserData: ${clerkMember.id}`);
          errorCount++;
          continue;
        }

        const { userId, identifier, firstName, lastName, imageUrl } = clerkMember.publicUserData;

        // Find or create user
        let user = await prismadb.user.findUnique({
          where: { clerkUserId: userId }
        });

        if (!user) {
          user = await prismadb.user.create({
            data: {
              clerkUserId: userId,
              email: identifier,
              firstName: firstName || '',
              lastName: lastName || '',
              profileImageUrl: imageUrl || '',
            }
          });
        }

        // Create organization membership
        await prismadb.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: userId
            }
          },
          update: {
            role: clerkMember.role === 'org:admin' ? 'admin' : 'member'
          },
          create: {
            organizationId: organization.id,
            userId: userId,
            role: clerkMember.role === 'org:admin' ? 'admin' : 'member'
          }
        });

        successCount++;
      } catch (error) {
        console.error(`Error syncing member ${clerkMember.publicUserData?.userId || 'unknown'}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: successCount,
      errors: errorCount,
      total: clerkMembers.data.length
    });
  } catch (error) {
    console.error('Error syncing members:', error);
    return NextResponse.json({ error: 'Failed to sync members' }, { status: 500 });
  }
}