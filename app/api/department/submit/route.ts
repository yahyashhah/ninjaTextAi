import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { ensureOrganizationExists, createReviewQueueItemIfNeeded } from '@/lib/organization-utils';

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
      clerkUserId
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

    // Use the shared utility to ensure organization exists
    const organization = await ensureOrganizationExists(targetOrgId);

    if (!organization) {
      console.log('❌ Failed to create/find organization');
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    console.log('✅ Organization ready:', organization.id);

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

    // Create review queue item if needed using shared utility
    if (accuracyScore && accuracyScore < 80) {
      console.log('⚠️ Low accuracy report detected, creating review queue item...');
      await createReviewQueueItemIfNeeded(report, organization.id);
      console.log('✅ Review queue item created');
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