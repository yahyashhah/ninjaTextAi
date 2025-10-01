import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { ensureOrganizationExists } from '@/lib/organization-utils';

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
    const status = searchParams.get('status') || '';
    const reportType = searchParams.get('type') || '';
    
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

    // Build where clause
    const whereClause: any = {
      organizationId: organization.id
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (reportType && reportType !== 'all') {
      whereClause.reportType = reportType;
    }

    // Get reports with pagination - FIXED: Make user relation optional
    const [reports, totalCount] = await Promise.all([
      prismadb.departmentReport.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          reviewQueueItems: {
            where: {
              status: {
                in: ['pending', 'in_review']
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prismadb.departmentReport.count({
        where: whereClause
      })
    ]);

    // Transform reports to handle missing user data
    const transformedReports = reports.map(report => ({
      ...report,
      user: report.user || {
        firstName: 'Unknown',
        lastName: 'User',
        email: 'unknown@example.com'
      }
    }));

    // Get available filters
    const statusTypes = await prismadb.departmentReport.groupBy({
      by: ['status'],
      where: {
        organizationId: organization.id
      },
      _count: {
        status: true
      }
    });

    const reportTypes = await prismadb.departmentReport.groupBy({
      by: ['reportType'],
      where: {
        organizationId: organization.id
      },
      _count: {
        reportType: true
      }
    });

    return NextResponse.json({
      reports: transformedReports, // Use transformed reports
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        statusTypes: statusTypes.map(type => type.status),
        reportTypes: reportTypes.map(type => type.reportType)
      },
      summary: {
        totalReports: totalCount,
        needsReview: await prismadb.departmentReport.count({
          where: {
            organizationId: organization.id,
            accuracyScore: {
              lt: 85
            },
            status: 'submitted'
          }
        })
      }
    });
  } catch (error) {
    console.error('Error fetching department reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department reports' },
      { status: 500 }
    );
  }
}