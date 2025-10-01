import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { ensureOrganizationExists } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Department Admin API Called ===');
    const user = await currentUser();
    if (!user) {
      console.log('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 User:', user.id, user.emailAddresses[0]?.emailAddress);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      console.log('❌ Bad Request: No orgId provided');
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log('🏢 Organization ID:', orgId);

    // Check organization membership
    let isOrgAdmin = false;
    try {
      console.log('🔍 Checking organization membership...');
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id,
      });
      
      const orgMembership = memberships.data.find(
        (membership: any) => membership.organization.id === orgId
      );
      
      isOrgAdmin = orgMembership?.role === 'admin' || orgMembership?.role === 'org:admin';
      
      console.log('📋 Membership check result:', {
        hasMembership: !!orgMembership,
        role: orgMembership?.role,
        isOrgAdmin
      });
      
    } catch (membershipError) {
      console.error('❌ Error checking organization membership:', membershipError);
      return NextResponse.json(
        { error: 'Failed to verify organization membership' },
        { status: 500 }
      );
    }

    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden - Not organization admin' }, { status: 403 });
    }

    // Use the shared utility to ensure organization exists
    const organization = await ensureOrganizationExists(orgId);
    
    if (!organization) {
      console.log('❌ Organization is still null after all operations');
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Get member count
    const memberCount = await prismadb.organizationMember.count({
      where: { organizationId: organization.id }
    });

    // Get report count
    const reportCount = await prismadb.departmentReport.count({
      where: { organizationId: organization.id }
    });

    // Get review queue count
    const reviewQueueCount = await prismadb.reviewQueueItem.count({
      where: {
        organizationId: organization.id,
        status: {
          in: ['pending', 'in_review']
        }
      }
    });

    // Get review queue items
    const reviewQueue = await prismadb.reviewQueueItem.findMany({
      where: {
        organizationId: organization.id,
        status: {
          in: ['pending', 'in_review']
        }
      },
      include: {
        report: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 50
    });

    // Get recent activity
    console.log('📋 Fetching recent activity...');
    const recentActivity = await prismadb.departmentActivityLog.findMany({
      where: {
        organizationId: organization.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate overdue items
    const overdueItems = reviewQueue.filter(item => 
      item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'resolved'
    ).length;

    // Calculate average accuracy from reports
    const accuracyData = await prismadb.departmentReport.aggregate({
      where: {
        organizationId: organization.id,
        accuracyScore: {
          not: undefined
        }
      },
      _avg: {
        accuracyScore: true
      }
    });

    const stats = {
      totalMembers: memberCount,
      totalReports: reportCount,
      lowAccuracyCount: organization.lowAccuracyCount || 0,
      reviewQueueCount: reviewQueueCount,
      overdueItems,
      averageAccuracy: accuracyData._avg?.accuracyScore || 87.5,
      slaLowAccuracy: 92.5,
      secondReviewRate: 15.3
    };

    // Mock KPI data for now
    const kpis = {
      officerActivityCoverage: 85.2,
      exportSuccessRate: 98.7,
      userManagementSuccess: 99.1,
      reviewSlaCompliance: 88.4,
      backlogAge: 12.5,
      secondReviewRate: 15.3
    };

    return NextResponse.json({
      stats,
      reviewQueue: reviewQueue,
      recentActivity,
      kpis
    });

  } catch (error: any) {
    console.error('❌ Error fetching department admin data:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2023') {
      console.log('❌ P2023 Error: Invalid ObjectID format');
      return NextResponse.json(
        { error: 'Database query error - invalid data format' },
        { status: 500 }
      );
    }

    if (error.code === 'P2002') {
      console.log('❌ P2002 Error: Unique constraint violation');
      return NextResponse.json(
        { error: 'Database error - duplicate entry' },
        { status: 500 }
      );
    }
    
    console.log('❌ Unknown error type:', typeof error, error);
    return NextResponse.json(
      { error: 'Failed to fetch department data' },
      { status: 500 }
    );
  }
}

// Sync function
async function syncOrganizationMembers(clerkOrgId: string, prismaOrgId: string) {
  try {
    console.log(`🔄 Syncing members for organization ${clerkOrgId}...`);
    
    // Get members from Clerk
    const clerkMembers = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
    });

    console.log(`📋 Found ${clerkMembers.data.length} members in Clerk`);

    // Sync each member to Prisma
    for (const clerkMember of clerkMembers.data) {
      try {
        // Check if publicUserData exists
        if (!clerkMember.publicUserData) {
          console.log(`⚠️ Skipping member without publicUserData: ${clerkMember.id}`);
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
          console.log(`✅ Created user: ${user.clerkUserId}`);
        }

        // Create organization membership
        await prismadb.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: prismaOrgId,
              userId: userId
            }
          },
          update: {
            role: clerkMember.role === 'org:admin' ? 'admin' : 'member'
          },
          create: {
            organizationId: prismaOrgId,
            userId: userId,
            role: clerkMember.role === 'org:admin' ? 'admin' : 'member'
          }
        });

        console.log(`✅ Synced member: ${userId}`);

      } catch (memberError) {
        console.error(`❌ Error syncing member ${clerkMember.publicUserData?.userId || 'unknown'}:`, memberError);
      }
    }

    console.log(`✅ Successfully synced ${clerkMembers.data.length} members`);
    
  } catch (error) {
    console.error('❌ Error syncing organization members:', error);
    throw error;
  }
}