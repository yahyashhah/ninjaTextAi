import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportTypes } = await req.json();

    console.log('🔍 Department Template Filter API Called:', {
      userId,
      reportTypes
    });

    // Validate that reportTypes exists and is an array
    if (!reportTypes || !Array.isArray(reportTypes)) {
      return NextResponse.json(
        { message: 'reportTypes must be an array' }, 
        { status: 400 }
      );
    }

    // Get user's first organization membership
    const userMembership = await prismadb.organizationMember.findFirst({
      where: {
        userId: userId
      },
      include: {
        organization: true
      }
    });

    console.log('👤 User Membership:', {
      hasMembership: !!userMembership,
      organizationId: userMembership?.organizationId,
      clerkOrgId: userMembership?.organization?.clerkOrgId,
      organizationName: userMembership?.organization?.name
    });

    if (!userMembership) {
      return NextResponse.json(
        { message: 'User not in any organization' }, 
        { status: 400 }
      );
    }

    // Filter department templates using MongoDB ObjectID
    const templates = await prismadb.departmentTemplate.findMany({
      where: { 
        organizationId: userMembership.organizationId, // Use MongoDB ObjectID
        isActive: true,
        reportTypes: {
          hasSome: reportTypes
        }
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

    console.log('📋 Templates Found:', {
      count: templates.length,
      organizationId: userMembership.organizationId
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching templates:", error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}