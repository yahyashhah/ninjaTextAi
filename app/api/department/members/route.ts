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

    // Get organization from database
    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get members with user details
    const members = await prismadb.organizationMember.findMany({
      where: { organizationId: organization.id },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      members: members,
      totalCount: members.length
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser() as unknown as UserWithMemberships;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, email, role } = await request.json();
    
    if (!orgId || !email) {
      return NextResponse.json(
        { error: 'Organization ID and email are required' },
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

    // Get organization from database
    const organization = await prismadb.organization.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user exists in Clerk
    const users = await clerkClient.users.getUserList({ emailAddress: [email] });
    let clerkUser = users.data[0];

    // Create user if they don't exist
    if (!clerkUser) {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        skipPasswordChecks: true,
      });
    }

    // Invite user to organization in Clerk
    await clerkClient.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId: clerkUser.id,
      role: role === 'admin' ? 'org:admin' : 'org:member'
    });

    // Add to database
    await prismadb.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: clerkUser.id
        }
      },
      update: {
        role: role === 'admin' ? 'admin' : 'member'
      },
      create: {
        organizationId: organization.id,
        userId: clerkUser.id,
        role: role === 'admin' ? 'admin' : 'member'
      }
    });

    return NextResponse.json({ success: true, message: 'Member invited successfully' });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser() as unknown as UserWithMemberships;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const userId = searchParams.get('userId');
    
    if (!orgId || !userId) {
      return NextResponse.json(
        { error: 'Organization ID and User ID are required' },
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

    // Remove from Clerk organization
    try {
      await clerkClient.organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: userId
      });
    } catch (error) {
      console.error('Error removing from Clerk:', error);
      // Continue with database removal even if Clerk removal fails
    }

    // Remove from database
    const organization = await prismadb.organization.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (organization) {
      await prismadb.organizationMember.deleteMany({
        where: {
          organizationId: organization.id,
          userId: userId
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}