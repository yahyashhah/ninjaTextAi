// app/api/admin/organizations/route.ts
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, location, type } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Create organization in Clerk
    let clerkOrg;
    try {
      clerkOrg = await clerkClient.organizations.createOrganization({
        name,
        createdBy: user.id
      });
    } catch (error: any) {
      console.error('Error creating organization in Clerk:', error);
      return NextResponse.json(
        { error: 'Failed to create organization in authentication system' },
        { status: 500 }
      );
    }

    // Create organization in database
    try {
      const organization = await prismadb.organization.create({
        data: {
          clerkOrgId: clerkOrg.id,
          name,
          description: description || '',
          location: location || '',
          type: type || 'law_enforcement',
          memberCount: 1 // Include the creator
        }
      });

      // Add creator as admin member
      await prismadb.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'admin'
        }
      });

      // Create user if they don't exist
      const existingUser = await prismadb.user.findUnique({
        where: { clerkUserId: user.id }
      });

      if (!existingUser) {
        await prismadb.user.create({
          data: {
            clerkUserId: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            profileImageUrl: user.imageUrl || '',
            isAdmin: true
          }
        });
      }

      return NextResponse.json({
        success: true,
        organization: {
          id: organization.id,
          clerkOrgId: organization.clerkOrgId,
          name: organization.name,
          description: organization.description,
          location: organization.location,
          type: organization.type,
          memberCount: organization.memberCount
        }
      });

    } catch (error: any) {
      console.error('Error creating organization in database:', error);
      
      // Rollback: Delete the organization from Clerk if database creation failed
      try {
        await clerkClient.organizations.deleteOrganization(clerkOrg.id);
      } catch (deleteError) {
        console.error('Error rolling back organization creation:', deleteError);
      }
      
      return NextResponse.json(
        { error: 'Failed to create organization in database' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get organizations with pagination
    const [organizations, totalCount] = await Promise.all([
      prismadb.organization.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              members: true,
              reports: true
            }
          }
        }
      }),
      prismadb.organization.count()
    ]);

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}