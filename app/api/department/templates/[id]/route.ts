import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    
    console.log('🗑️ DELETE Template Request:', { userId, templateId });
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 });
    }

    // Get template to check organization
    const template = await prismadb.departmentTemplate.findUnique({
      where: { id: templateId }
    });

    console.log('📋 Template Found:', template);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user is admin in this organization using MongoDB ObjectID
    const userMembership = await prismadb.organizationMember.findFirst({
      where: {
        userId: userId,
        organizationId: template.organizationId, // This is MongoDB ObjectID
        role: 'admin'
      }
    });

    console.log('👤 User Membership Check for Delete:', {
      userId,
      organizationId: template.organizationId,
      hasAdminMembership: !!userMembership,
      role: userMembership?.role
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied. Department admin required.' },
        { status: 403 }
      );
    }

    await prismadb.departmentTemplate.delete({
      where: { id: templateId }
    });

    console.log('✅ Template deleted successfully');
    
    return NextResponse.json({ message: 'Template deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete template.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update template status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    const templateId = params.id;

    console.log('✏️ UPDATE Template Request:', { userId, templateId, isActive });

    // Get template
    const template = await prismadb.departmentTemplate.findUnique({
      where: { id: templateId }
    });

    console.log('📋 Template Found:', template);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user is admin in this organization using MongoDB ObjectID
    const userMembership = await prismadb.organizationMember.findFirst({
      where: {
        userId: userId,
        organizationId: template.organizationId, // This is MongoDB ObjectID
        role: 'admin'
      }
    });

    console.log('👤 User Membership Check for Update:', {
      userId,
      organizationId: template.organizationId,
      hasAdminMembership: !!userMembership,
      role: userMembership?.role
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied. Department admin required.' },
        { status: 403 }
      );
    }

    const updatedTemplate = await prismadb.departmentTemplate.update({
      where: { id: templateId },
      data: {
        isActive: isActive !== undefined ? isActive : template.isActive
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

    console.log('✅ Template updated successfully');
    
    return NextResponse.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    });

  } catch (error) {
    console.error('❌ Error updating template:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}