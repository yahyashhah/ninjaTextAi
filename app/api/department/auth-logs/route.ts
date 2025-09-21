// app/api/department/admin/auth-logs/route.ts
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const activityType = searchParams.get('type') || '';
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check organization membership and admin role
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId: user.id,
    });
    
    const orgMembership = memberships.data.find(
      (membership: any) => membership.organization.id === orgId
    );
    
    const isOrgAdmin = orgMembership?.role === 'admin' || orgMembership?.role === 'org:admin';
    
    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden - Not organization admin' }, { status: 403 });
    }

    // Get organization from database
    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all user IDs in this organization
    const orgMembers = await prismadb.organizationMember.findMany({
      where: { organizationId: organization.id },
      select: { userId: true }
    });

    const userIds = orgMembers.map(member => member.userId);

    // Build where clause for filtering - only authentication activities
    const whereClause: any = {
  userId: { in: userIds },
  activity: {
    in: ['login', 'logout', 'session_created', 'session_ended', 'org_member_added', 'org_member_removed', 'org_role_changed']
  }
};

    if (activityType && activityType !== 'all') {
      whereClause.activity = activityType;
    }

    // Get authentication logs with pagination
    const [logs, totalCount] = await Promise.all([
      prismadb.userActivity.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              clerkUserId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prismadb.userActivity.count({
        where: whereClause
      })
    ]);

    // Get available activity types for filtering
    const activityTypes = await prismadb.userActivity.groupBy({
      by: ['activity'],
      where: {
        userId: { in: userIds },
        activity: {
          in: ['login', 'logout', 'session_created', 'session_ended']
        }
      },
      _count: {
        activity: true
      }
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        activityTypes: activityTypes.map(type => type.activity)
      }
    });

  } catch (error: any) {
    console.error('Error fetching department auth logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authentication logs' },
      { status: 500 }
    );
  }
}