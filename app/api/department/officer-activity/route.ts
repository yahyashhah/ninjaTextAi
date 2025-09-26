import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

interface UserWithMemberships {
  id: string;
  emailAddresses: { emailAddress: string }[];
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser() as unknown as UserWithMemberships;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const range = searchParams.get('range') || 'month';
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin of this organization using proper Clerk API
    let isOrgAdmin = false;
    try {
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id,
      });
      
      const orgMembership = memberships.data.find(
        (membership: any) => membership.organization.id === orgId
      );
      
      isOrgAdmin = orgMembership?.role === 'admin' || orgMembership?.role === 'org:admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get organization by clerkOrgId
    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get officer activity stats - use organization.id (internal ID) for relationships
    const officerStats = await prismadb.departmentReport.groupBy({
      by: ['clerkUserId'],
      where: {
        organizationId: organization.id,
        submittedAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        accuracyScore: true
      }
    });

    // Get user details for each officer
    const officers = await Promise.all(
      officerStats.map(async (stat) => {
        const user = await prismadb.user.findUnique({
          where: { clerkUserId: stat.clerkUserId }
        });

        return {
          userId: stat.clerkUserId,
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User',
          email: user?.email || '',
          reportCount: stat._count.id,
          averageAccuracy: stat._avg.accuracyScore || 0,
          lastActivity: new Date().toISOString()
        };
      })
    );

    return NextResponse.json({ officers });
  } catch (error) {
    console.error('Error fetching officer activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch officer activity' },
      { status: 500 }
    );
  }
}