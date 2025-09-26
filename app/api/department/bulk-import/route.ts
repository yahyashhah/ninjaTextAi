import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import * as csv from 'csv-parse/sync';

interface UserWithMemberships {
  id: string;
  emailAddresses: { emailAddress: string }[];
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Parse CSV
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Get organization from database
    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Process each record
    for (let index = 0; index < records.length; index++) {
      const record = records[index] as { [key: string]: string };
      try {
        const email = record.email || record.Email || record.EMAIL;
        const firstName = record.firstName || record.firstname || record['First Name'] || record['first name'] || '';
        const lastName = record.lastName || record.lastname || record['Last Name'] || record['last name'] || '';
        const role = (record.role || record.Role || 'member').toLowerCase();
        
        if (!email) {
          results.errors.push(`Row ${index + 2}: Email is required`);
          results.failed++;
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.errors.push(`Row ${index + 2}: Invalid email format`);
          results.failed++;
          continue;
        }

        // Check if user already exists in Clerk
        let clerkUser;
        try {
          const users = await clerkClient.users.getUserList({ emailAddress: [email] });
          clerkUser = users.data[0];
        } catch (error) {
          console.error(`Error finding user ${email}:`, error);
          results.errors.push(`Row ${index + 2}: Error checking user existence`);
          results.failed++;
          continue;
        }

        // Create user if they don't exist
        if (!clerkUser) {
          try {
            clerkUser = await clerkClient.users.createUser({
              emailAddress: [email],
              firstName: firstName,
              lastName: lastName,
              skipPasswordChecks: true,
            });
          } catch (error) {
            console.error(`Error creating user ${email}:`, error);
            results.errors.push(`Row ${index + 2}: Error creating user`);
            results.failed++;
            continue;
          }
        }

        // Invite user to organization
        try {
          await clerkClient.organizations.createOrganizationMembership({
            organizationId: orgId,
            userId: clerkUser.id,
            role: role === 'admin' ? 'org:admin' : 'org:member'
          });
        } catch (error: any) {
          // If user is already a member, continue
          if (error.errors?.[0]?.code === 'duplicate_record') {
            console.log(`User ${email} is already a member`);
          } else {
            throw error;
          }
        }

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

        results.success++;
      } catch (error: any) {
        console.error(`Error processing row ${index + 2}:`, error);
        results.errors.push(`Row ${index + 2}: ${error.message || 'Unknown error'}`);
        results.failed++;
      }
    }

    // Log the activity
    await prismadb.departmentActivityLog.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        activityType: 'BULK_IMPORT',
        description: `Bulk import completed: ${results.success} success, ${results.failed} failed`,
        metadata: JSON.stringify(results)
      }
    });

    // FIXED: Don't use spread operator with conflicting property names
    return NextResponse.json({
      success: true, // Overall operation success
      importedCount: results.success,
      failedCount: results.failed,
      totalProcessed: results.success + results.failed,
      errors: results.errors,
      message: `Bulk import completed: ${results.success} successful, ${results.failed} failed`
    });

  } catch (error) {
    console.error('Error processing bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}