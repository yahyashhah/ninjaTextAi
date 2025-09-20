import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

interface ClerkOrganizationMembership {
  organization: {
    id: string;
    name: string;
    membersCount?: number;
  };
  role: string;
}

export async function POST(request: NextRequest) {
  console.log('=== Report Submission API Called ===');
  
  try {
    const body = await request.json();
    const { 
      narrative, 
      nibrsData, 
      accuracyScore, 
      reportType = 'incident',
      title,
      clerkOrgId,
      clerkUserId // Get user ID from request body
    } = body;

    console.log('👤 User submitting report:', clerkUserId);

    console.log('📋 Received report data:', {
      hasNibrsData: !!nibrsData,
      hasNarrative: !!narrative,
      accuracyScore,
      reportType,
      title,
      clerkOrgId,
      clerkUserId
    });

    if (!nibrsData || !narrative) {
      console.log('❌ Missing required data: NIBRS data or narrative');
      return NextResponse.json(
        { error: 'NIBRS data and narrative are required' },
        { status: 400 }
      );
    }

    if (!clerkUserId) {
      console.log('❌ Missing required data: User ID');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use provided orgId
    const targetOrgId = clerkOrgId;

    console.log('🏢 Target Organization ID:', targetOrgId);

    if (!targetOrgId) {
      console.log('❌ No organization ID found');
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get or create organization in database
    console.log('🔍 Looking for organization in database...');
    let organization = await prismadb.organization.findUnique({
      where: { clerkOrgId: targetOrgId }
    });

    if (!organization) {
      console.log('🏢 Organization not found in DB, creating new one...');
      try {
        const clerkOrg = await clerkClient.organizations.getOrganization({ 
          organizationId: targetOrgId 
        });
        
        console.log('📋 Clerk organization data:', {
          name: clerkOrg.name,
          membersCount: clerkOrg.membersCount
        });

        organization = await prismadb.organization.create({
          data: {
            clerkOrgId: targetOrgId,
            name: clerkOrg.name,
            type: 'law_enforcement',
            memberCount: clerkOrg.membersCount || 1
          }
        });

        console.log('✅ Organization created successfully:', organization.id);
        
        // Sync members after creating organization
        console.log('🔄 Syncing members for new organization...');
        try {
          const syncResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/department/sync-members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orgId: targetOrgId })
          });
          console.log('✅ Members sync result:', await syncResponse.json());
        } catch (syncError) {
          console.error('❌ Error syncing members:', syncError);
        }

      } catch (error) {
        console.error('❌ Error creating organization:', error);
        return NextResponse.json(
          { error: 'Failed to create organization' },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Organization found:', organization.id);
    }

    // Create the department report
    console.log('📝 Creating department report...');
    const report = await prismadb.departmentReport.create({
      data: {
        organizationId: organization.id,
        clerkUserId: clerkUserId,
        reportType: reportType,
        title: title || `Report - ${new Date().toLocaleDateString()}`,
        content: narrative,
        nibrsData: JSON.stringify(nibrsData),
        accuracyScore: accuracyScore || 100,
        status: accuracyScore && accuracyScore < 80 ? 'pending_review' : 'submitted',
        submittedAt: new Date(),
        flagged: accuracyScore && accuracyScore < 80
      }
    });

    console.log('✅ Report created successfully:', {
      reportId: report.id,
      accuracyScore: report.accuracyScore,
      status: report.status,
      flagged: report.flagged
    });

    // If low accuracy, create review queue item
    if (accuracyScore && accuracyScore < 80) {
      console.log('⚠️ Low accuracy report detected, creating review queue item...');
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 48); // 48-hour SLA

      const reviewItem = await prismadb.reviewQueueItem.create({
        data: {
          organizationId: organization.id,
          reportId: report.id,
          accuracyScore: accuracyScore,
          status: 'pending',
          priority: accuracyScore < 60 ? 'high' : accuracyScore < 70 ? 'normal' : 'low',
          dueDate: dueDate
        }
      });

      console.log('✅ Review queue item created:', reviewItem.id);

      // Update organization low accuracy count
      await prismadb.organization.update({
        where: { id: organization.id },
        data: {
          lowAccuracyCount: {
            increment: 1
          }
        }
      });

      console.log('📈 Updated organization low accuracy count');
    }

    // Update organization report count
    await prismadb.organization.update({
      where: { id: organization.id },
      data: {
        reportCount: {
          increment: 1
        }
      }
    });

    console.log('📈 Updated organization report count');

    // Log the activity
    const activityLog = await prismadb.departmentActivityLog.create({
      data: {
        organizationId: organization.id,
        userId: clerkUserId,
        activityType: 'REPORT_SUBMITTED',
        description: `Report submitted with ${accuracyScore}% accuracy`,
        metadata: JSON.stringify({
          reportId: report.id,
          accuracyScore: accuracyScore,
          requiresReview: accuracyScore && accuracyScore < 80
        })
      }
    });

    console.log('📋 Activity log created:', activityLog.id);

    // Verify the data was actually saved
    console.log('🔍 Verifying data persistence...');
    
    const savedReport = await prismadb.departmentReport.findUnique({
  where: { id: report.id }
});

// Get organization separately if needed
const savedOrganization = await prismadb.organization.findUnique({
  where: { id: organization.id }
});

    console.log('✅ Report verification:', {
      found: !!savedReport,
      organizationId: savedReport?.organizationId,
      organizationName: savedOrganization?.name
    });

    const reviewItemsCount = await prismadb.reviewQueueItem.count({
      where: { reportId: report.id }
    });

    console.log('✅ Review queue items for report:', reviewItemsCount);

    const orgStats = await prismadb.organization.findUnique({
      where: { id: organization.id },
      select: {
        reportCount: true,
        lowAccuracyCount: true
      }
    });

    console.log('✅ Organization stats after submission:', orgStats);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      requiresReview: accuracyScore && accuracyScore < 80,
      organizationId: organization.id,
      organizationName: organization.name
    });

  } catch (error) {
    console.error('❌ Error submitting report:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}