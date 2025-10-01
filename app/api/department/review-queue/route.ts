import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { ensureOrganizationExists } from '@/lib/organization-utils';

interface UserWithMemberships {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddresses: { emailAddress: string }[];
}

// Configurable threshold - change this to 85 as requested
const REVIEW_THRESHOLD = 85;

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser() as unknown as UserWithMemberships;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status') || 'pending';
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin of this organization
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

    // Use shared utility to ensure organization exists
    const organization = await ensureOrganizationExists(orgId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get review queue items with filtering - using the new 85 threshold
    const whereClause: any = {
      organizationId: organization.id,
      accuracyScore: {
        lt: REVIEW_THRESHOLD // Now using 85 instead of 80
      }
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const reviewQueue = await prismadb.reviewQueueItem.findMany({
      where: whereClause,
      include: {
        report: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ]
    });

    // Filter out items with null users for safety
    const validReviewQueue = reviewQueue.filter(item => item.report?.user !== null);

    // Calculate queue statistics using the same threshold
    const totalItems = await prismadb.reviewQueueItem.count({
      where: {
        organizationId: organization.id,
        accuracyScore: {
          lt: REVIEW_THRESHOLD
        }
      }
    });

    const pendingItems = await prismadb.reviewQueueItem.count({
      where: {
        organizationId: organization.id,
        status: 'pending',
        accuracyScore: {
          lt: REVIEW_THRESHOLD
        }
      }
    });

    const overdueItems = await prismadb.reviewQueueItem.count({
      where: {
        organizationId: organization.id,
        dueDate: {
          lt: new Date()
        },
        status: {
          in: ['pending', 'in_review']
        },
        accuracyScore: {
          lt: REVIEW_THRESHOLD
        }
      }
    });

    const resolutionData = await prismadb.reviewQueueItem.aggregate({
      where: {
        organizationId: organization.id,
        status: 'resolved',
        resolvedAt: {
          not: null
        },
        accuracyScore: {
          lt: REVIEW_THRESHOLD
        }
      },
      _avg: {
        accuracyScore: true
      }
    });

    return NextResponse.json({
      items: validReviewQueue,
      stats: {
        totalItems,
        pendingItems,
        overdueItems,
        avgAccuracy: resolutionData._avg?.accuracyScore || 0,
        threshold: REVIEW_THRESHOLD
      }
    });
  } catch (error) {
    console.error('Error fetching review queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser() as unknown as UserWithMemberships;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, action, notes, assignedTo } = await request.json();
    
    if (!itemId || !action) {
      return NextResponse.json(
        { error: 'Item ID and action are required' },
        { status: 400 }
      );
    }

    // Get the review item
    const reviewItem = await prismadb.reviewQueueItem.findUnique({
      where: { id: itemId },
      include: {
        report: true,
        organization: true
      }
    });

    if (!reviewItem) {
      return NextResponse.json(
        { error: 'Review item not found' },
        { status: 404 }
      );
    }

    // Check if user is admin of this organization
    let isOrgAdmin = false;
    try {
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id,
      });
      
      const orgMembership = memberships.data.find(
        (membership: any) => membership.organization.id === reviewItem.organization.clerkOrgId
      );
      
      isOrgAdmin = orgMembership?.role === 'admin' || orgMembership?.role === 'org:admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let updateData: any = {};
    let reportUpdateData: any = {};

    switch (action) {
      case 'assign':
        updateData = {
          assignedTo: assignedTo || user.id,
          status: 'in_review',
          assignedAt: new Date()
        };
        break;
      
      case 'approve':
        updateData = {
          status: 'resolved',
          resolution: 'approved',
          resolutionNotes: notes,
          resolvedAt: new Date()
        };
        reportUpdateData = {
          status: 'approved',
          reviewedAt: new Date(),
          accuracyScore: Math.max(reviewItem.report.accuracyScore || 0, REVIEW_THRESHOLD)
        };
        break;
      
      case 'return':
        updateData = {
          status: 'resolved',
          resolution: 'returned',
          resolutionNotes: notes,
          resolvedAt: new Date()
        };
        reportUpdateData = {
          status: 'returned',
          reviewedAt: new Date(),
          flagged: true,
          flagReason: notes || 'Returned for correction'
        };
        break;
      
      case 'edit':
        updateData = {
          status: 'resolved',
          resolution: 'edited',
          resolutionNotes: notes,
          resolvedAt: new Date()
        };
        reportUpdateData = {
          status: 'approved',
          reviewedAt: new Date(),
          accuracyScore: 95
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update review item
    const updatedItem = await prismadb.reviewQueueItem.update({
      where: { id: itemId },
      data: updateData
    });

    // Update report if needed
    if (Object.keys(reportUpdateData).length > 0) {
      await prismadb.departmentReport.update({
        where: { id: reviewItem.reportId },
        data: reportUpdateData
      });
    }

    // Log the activity
    await prismadb.departmentActivityLog.create({
      data: {
        organizationId: reviewItem.organizationId,
        userId: user.id,
        activityType: 'REVIEW_ACTION',
        description: `Review item ${itemId} ${action} by ${user.firstName || ''} ${user.lastName || ''}`,
        metadata: JSON.stringify({
          action,
          notes,
          previousStatus: reviewItem.status,
          newStatus: updateData.status,
          reportId: reviewItem.reportId
        })
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating review item:', error);
    return NextResponse.json(
      { error: 'Failed to update review item' },
      { status: 500 }
    );
  }
}