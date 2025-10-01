import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
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

    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId },
      include: {
        reports: {
          include: {
            reviewQueueItems: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        reviewQueue: {
          where: {
            status: {
              in: ['pending', 'in_review']
            }
          },
          include: {
            report: {
              select: {
                id: true,
                title: true,
                accuracyScore: true,
                status: true
              }
            }
          }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        members: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            reports: true,
            reviewQueue: {
              where: {
                status: {
                  in: ['pending', 'in_review']
                }
              }
            },
            members: true,
            activityLogs: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // For MongoDB, we need to manually count some things
    const flaggedReportsCount = await prismadb.departmentReport.count({
      where: {
        organizationId: organization.id,
        flagged: true
      }
    });

    const membersWithUsers = organization.members.filter(member => member.user !== null);

    return NextResponse.json({
      organization: {
        ...organization,
        members: membersWithUsers
      },
      dataConsistency: {
        reportsMatchCount: organization._count.reports === organization.reportCount,
        lowAccuracyMatch: flaggedReportsCount === organization.lowAccuracyCount,
        reviewQueueCount: organization._count.reviewQueue,
        memberCount: membersWithUsers.length
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
}