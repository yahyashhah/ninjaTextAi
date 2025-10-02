// app/api/admin/organizations/[id]/admins/route.ts
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

// GET - Get organization admins
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = !!user.publicMetadata?.admin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const organizationId = params.id;

    // Get organization with admins
    const organization = await prismadb.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: {
            role: 'admin'
          },
          include: {
            user: {
              select: {
                clerkUserId: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Safely map members to admins with proper null checks
    const admins = organization.members
      .filter(member => member.user !== null) // Filter out members with null users
      .map(member => ({
        id: member.id,
        userId: member.userId,
        clerkUserId: member.user!.clerkUserId,
        firstName: member.user!.firstName,
        lastName: member.user!.lastName,
        email: member.user!.email,
        role: member.role,
        assignedAt: member.createdAt
      }));

    return NextResponse.json({ admins });

  } catch (error: any) {
    console.error('Error fetching organization admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization admins' },
      { status: 500 }
    );
  }
}

// POST - Add admin to organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = !!user.publicMetadata?.admin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const organizationId = params.id;
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find organization
    const organization = await prismadb.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Find user by email
    const targetUser = await prismadb.user.findFirst({
      where: { email: email.toLowerCase() }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prismadb.organizationMember.findFirst({
      where: {
        organizationId,
        userId: targetUser.clerkUserId
      }
    });

    if (existingMember) {
      // Update role to admin
      await prismadb.organizationMember.update({
        where: { id: existingMember.id },
        data: { role: 'admin' }
      });
    } else {
      // Add as admin member
      await prismadb.organizationMember.create({
        data: {
          organizationId,
          userId: targetUser.clerkUserId,
          role: 'admin'
        }
      });

      // Update member count
      await prismadb.organization.update({
        where: { id: organizationId },
        data: {
          memberCount: { increment: 1 }
        }
      });
    }

    // Add user to organization in Clerk
    try {
      await clerkClient.organizations.createOrganizationMembership({
        organizationId: organization.clerkOrgId,
        userId: targetUser.clerkUserId,
        role: 'org:admin'
      });
    } catch (error: any) {
      console.error('Error adding user to organization in Clerk:', error);
      // Continue anyway since we've updated our database
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} added as admin to organization`
    });

  } catch (error: any) {
    console.error('Error adding admin to organization:', error);
    return NextResponse.json(
      { error: 'Failed to add admin to organization' },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = !!user.publicMetadata?.admin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const organizationId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find organization
    const organization = await prismadb.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Find member
    const member = await prismadb.organizationMember.findFirst({
      where: {
        organizationId,
        userId: userId
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 404 });
    }

    // Remove from organization
    await prismadb.organizationMember.delete({
      where: { id: member.id }
    });

    // Update member count
    await prismadb.organization.update({
      where: { id: organizationId },
      data: {
        memberCount: { decrement: 1 }
      }
    });

    // Remove from organization in Clerk
    try {
      await clerkClient.organizations.deleteOrganizationMembership({
        organizationId: organization.clerkOrgId,
        userId: userId
      });
    } catch (error: any) {
      console.error('Error removing user from organization in Clerk:', error);
      // Continue anyway since we've updated our database
    }

    return NextResponse.json({
      success: true,
      message: 'User removed from organization'
    });

  } catch (error: any) {
    console.error('Error removing admin from organization:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin from organization' },
      { status: 500 }
    );
  }
}