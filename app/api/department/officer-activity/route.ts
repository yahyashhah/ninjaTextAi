// app/api/department/officer-activity/route.ts (FULLY FIXED)
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { ensureOrganizationExists } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Starting officer activity API request');
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const range = searchParams.get('range') || 'month';
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log(`🔍 DEBUG: Request params - orgId: ${orgId}, range: ${range}, user: ${user.id}`);

    // Check admin permissions
    let isOrgAdmin = false;
    try {
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id,
      });
      
      const orgMembership = memberships.data.find(
        (membership: any) => membership.organization.id === orgId
      );
      
      isOrgAdmin = orgMembership?.role === 'admin' || orgMembership?.role === 'org:admin';
      console.log(`🔐 DEBUG: Admin check - isOrgAdmin: ${isOrgAdmin}, role: ${orgMembership?.role}`);
    } catch (error) {
      console.error('❌ DEBUG: Error checking admin status:', error);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await ensureOrganizationExists(orgId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log(`✅ DEBUG: Organization found - ID: ${organization.id}, Name: ${organization.name}`);

    // FIX: Calculate proper date range
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
        // FIX: Use start of current month, not relative to current date
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    console.log(`📅 DEBUG: Date range - Start: ${startDate.toISOString()}, End: ${now.toISOString()}, Range: ${range}`);

    // FIX: Get ALL reports in the date range first
    console.log(`📋 DEBUG: Fetching ALL reports in date range...`);
    const reports = await prismadb.departmentReport.findMany({
      where: {
        organizationId: organization.id,
        OR: [
          {
            submittedAt: {
              gte: startDate,
              lte: now
            }
          },
          {
            // FIX: Include reports based on createdAt if submittedAt is null or in draft
            AND: [
              { 
                OR: [
                  { submittedAt: null },
                  { status: 'draft' }
                ]
              },
              {
                createdAt: {
                  gte: startDate,
                  lte: now
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        clerkUserId: true,
        accuracyScore: true,
        submittedAt: true,
        createdAt: true,
        status: true,
        reportType: true
      }
    });

    console.log(`📋 DEBUG: Found ${reports.length} reports in date range`);
    
    // FIX: Get organization members to match with reports
    const organizationMembers = await prismadb.organizationMember.findMany({
      where: {
        organizationId: organization.id
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
    });

    console.log(`👥 DEBUG: Found ${organizationMembers.length} organization members`);

    // FIX: Create a map of all clerkUserIds that have reports
    const officerStatsMap = new Map();

    reports.forEach(report => {
      const userId = report.clerkUserId;
      if (!officerStatsMap.has(userId)) {
        officerStatsMap.set(userId, {
          reportCount: 0,
          totalAccuracy: 0,
          lastActivity: null,
          clerkUserId: userId
        });
      }
      
      const stats = officerStatsMap.get(userId);
      stats.reportCount++;
      if (report.accuracyScore) {
        stats.totalAccuracy += report.accuracyScore;
      }
      
      const activityDate = report.submittedAt || report.createdAt;
      if (activityDate && (!stats.lastActivity || activityDate > stats.lastActivity)) {
        stats.lastActivity = activityDate;
      }
    });

    console.log(`📊 DEBUG: Officer stats calculated for ${officerStatsMap.size} officers with reports`);

    // FIX: Build officer data from BOTH organization members AND report authors
    const officersFromReports = Array.from(officerStatsMap.values()).map(stats => {
      // Try to find user info from organization members
      const member = organizationMembers.find(m => m.user?.clerkUserId === stats.clerkUserId);
      
      return {
        userId: stats.clerkUserId,
        firstName: member?.user?.firstName || 'Unknown',
        lastName: member?.user?.lastName || 'Officer',
        email: member?.user?.email || '',
        reportCount: stats.reportCount,
        averageAccuracy: stats.reportCount > 0 
          ? Math.round((stats.totalAccuracy / stats.reportCount) * 100) / 100
          : 0,
        lastActivity: stats.lastActivity ? stats.lastActivity.toISOString() : null,
        performance: stats.reportCount === 0 ? 'No Activity' : 
                    (stats.totalAccuracy / stats.reportCount) < 85 ? 'Needs Improvement' : 'Good'
      };
    });

    // FIX: Also include organization members who have no reports
    const officersFromMembers = organizationMembers
      .filter(member => member.user && !officerStatsMap.has(member.user.clerkUserId))
      .map(member => ({
        userId: member.user!.clerkUserId,
        firstName: member.user!.firstName || 'Unknown',
        lastName: member.user!.lastName || 'Officer',
        email: member.user!.email || '',
        reportCount: 0,
        averageAccuracy: 0,
        lastActivity: null,
        performance: 'No Activity' as const
      }));

    // Combine both lists
    const allOfficers = [...officersFromReports, ...officersFromMembers];
    const validOfficers = allOfficers.sort((a, b) => b.reportCount - a.reportCount);

    console.log(`👥 DEBUG: Final officers - With reports: ${officersFromReports.length}, No reports: ${officersFromMembers.length}`);

    const activeOfficers = validOfficers.filter(o => o.reportCount > 0);
    const totalReports = validOfficers.reduce((sum, officer) => sum + officer.reportCount, 0);
    const totalAccuracy = activeOfficers.reduce((sum, officer) => sum + officer.averageAccuracy, 0);
    const avgAccuracy = activeOfficers.length > 0 ? Math.round(totalAccuracy / activeOfficers.length) : 0;

    const summary = {
      totalOfficers: validOfficers.length,
      activeOfficers: activeOfficers.length,
      totalReports: totalReports,
      averageAccuracy: avgAccuracy,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        range: range
      }
    };

    console.log(`📈 DEBUG: Final summary - Total Officers: ${summary.totalOfficers}, Active: ${summary.activeOfficers}, Total Reports: ${summary.totalReports}`);
    console.log(`✅ DEBUG: Returning ${validOfficers.length} officers`);

    return NextResponse.json({ 
      officers: validOfficers,
      summary
    });
  } catch (error) {
    console.error('❌ DEBUG: Error fetching officer activity:', error);
    return NextResponse.json({ error: 'Failed to fetch officer activity' }, { status: 500 });
  }
}