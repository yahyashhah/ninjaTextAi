// app/api/department/admin/auth-logs/export/route.ts
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { Parser } from 'json2csv';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
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

    // Get all authentication logs
    const logs = await prismadb.userActivity.findMany({
      where: {
        userId: { in: userIds },
        activity: {
          in: ['login', 'logout', 'session_created', 'session_ended']
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format data for CSV
    const csvData = logs.map(log => ({
      Date: log.createdAt.toISOString(),
      User: `${log.user.firstName} ${log.user.lastName}`,
      Email: log.user.email,
      'Activity Type': log.activity === 'login' || log.activity === 'session_created' ? 'Sign In' : 'Sign Out',
      'Session ID': log.metadata ? JSON.parse(log.metadata).sessionId || '' : ''
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Return as file download
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="auth-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Type': 'text/csv',
      },
    });

  } catch (error: any) {
    console.error('Error exporting auth logs:', error);
    return NextResponse.json(
      { error: 'Failed to export authentication logs' },
      { status: 500 }
    );
  }
}