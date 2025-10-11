import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

// GET - Fetch department templates
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clerkOrgId = searchParams.get('orgId'); // This is Clerk org ID

    console.log('🔍 GET Templates Request:', { userId, clerkOrgId });

    if (!clerkOrgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // First, find the organization by Clerk org ID to get the MongoDB ObjectID
    const organization = await prismadb.organization.findUnique({
      where: {
        clerkOrgId: clerkOrgId
      }
    });

    console.log('🏢 Organization Found:', {
      hasOrganization: !!organization,
      clerkOrgId: clerkOrgId,
      organizationId: organization?.id,
      organizationName: organization?.name
    });

    if (!organization) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    // Now check if user belongs to this organization using MongoDB ObjectID
    const userMembership = await prismadb.organizationMember.findFirst({
      where: {
        userId: userId,
        organizationId: organization.id // Use MongoDB ObjectID
      }
    });

    console.log('👤 User Membership Check:', {
      hasMembership: !!userMembership,
      userId: userId,
      organizationId: organization.id,
      role: userMembership?.role
    });

    if (!userMembership) {
      return NextResponse.json({ 
        error: 'Access denied - User not found in this organization',
        debug: {
          userId,
          clerkOrgId,
          organizationId: organization.id
        }
      }, { status: 403 });
    }

    // Get templates by MongoDB ObjectID
    const templates = await prismadb.departmentTemplate.findMany({
      where: {
        organizationId: organization.id // Use MongoDB ObjectID
      },
      include: {
        creator: {
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

    console.log('📋 Templates fetched:', {
      clerkOrgId: clerkOrgId,
      organizationId: organization.id,
      templateCount: templates.length
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('❌ Error fetching department templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// POST - Create new department template
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      templateName,
      instructions,
      examples,
      reportTypes,
      strictMode,
      organizationId // This is Clerk org ID from frontend
    } = body;

    // Validate required fields
    if (!templateName || !instructions || !reportTypes || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, find the organization by Clerk org ID
    const organization = await prismadb.organization.findUnique({
      where: {
        clerkOrgId: organizationId
      }
    });

    console.log('🏢 Organization for Create:', {
      hasOrganization: !!organization,
      clerkOrgId: organizationId,
      organizationId: organization?.id
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is admin in this organization using MongoDB ObjectID
    const userMembership = await prismadb.organizationMember.findFirst({
      where: {
        userId: userId,
        organizationId: organization.id, // Use MongoDB ObjectID
        role: 'admin'
      }
    });

    console.log('👤 User Membership Check for Create:', {
      userId,
      organizationId: organization.id,
      hasAdminMembership: !!userMembership,
      role: userMembership?.role
    });

    if (!userMembership) {
      return NextResponse.json({ 
        error: 'Forbidden - Department admin access required' 
      }, { status: 403 });
    }

    // Create the template with MongoDB ObjectID
    const template = await prismadb.departmentTemplate.create({
      data: {
        organizationId: organization.id, // Use MongoDB ObjectID
        templateName,
        instructions,
        examples: examples || '',
        reportTypes,
        requiredFields: [], // EMPTY ARRAY - No required fields
        fieldDefinitions: {}, // EMPTY OBJECT - No field definitions
        strictMode: strictMode !== false,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Template created successfully:', template.id);
    
    return NextResponse.json({
      message: 'Template created successfully',
      template
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating department template:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}