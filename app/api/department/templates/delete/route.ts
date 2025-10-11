import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 });
    }

    // Get template to check organization
    const template = await prismadb.departmentTemplate.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user is admin in this organization
    let isOrgAdmin = false;
    try {
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId: userId,
      });
      
      const orgMembership = memberships.data.find(
        (membership: any) => membership.organization.id === template.organizationId
      );
      
      isOrgAdmin = orgMembership?.role === 'admin' || orgMembership?.role === 'org:admin';
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!isOrgAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Department admin required.' },
        { status: 403 }
      );
    }

    await prismadb.departmentTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Template deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template.' }, { status: 500 });
  }
}