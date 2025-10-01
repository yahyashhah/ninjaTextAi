import { clerkClient } from "@clerk/nextjs/server";
import prismadb from "./prismadb";

export async function ensureOrganizationExists(clerkOrgId: string) {
  let organization = await prismadb.organization.findFirst({
    where: { clerkOrgId }
  });

  if (!organization) {
    // Get organization details from Clerk
    const clerkOrg = await clerkClient.organizations.getOrganization({ 
      organizationId: clerkOrgId 
    });

    organization = await prismadb.organization.create({
      data: {
        clerkOrgId: clerkOrgId,
        name: clerkOrg.name,
        type: 'law_enforcement',
        memberCount: clerkOrg.membersCount || 0,
        reportCount: 0,
        lowAccuracyCount: 0
      }
    });

    // Sync members
    await syncOrganizationMembers(clerkOrgId, organization.id);
  }

  return organization;
}

export async function syncOrganizationMembers(clerkOrgId: string, prismaOrgId: string) {
  try {
    console.log(`🔄 Syncing members for organization ${clerkOrgId}...`);
    
    // Get members from Clerk
    const clerkMembers = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
    });

    console.log(`📋 Found ${clerkMembers.data.length} members in Clerk`);

    let successCount = 0;
    let errorCount = 0;

    // Sync each member to Prisma
    for (const clerkMember of clerkMembers.data) {
      try {
        // Check if publicUserData exists
        if (!clerkMember.publicUserData) {
          console.log(`⚠️ Skipping member without publicUserData: ${clerkMember.id}`);
          errorCount++;
          continue;
        }

        const { userId, identifier, firstName, lastName, imageUrl } = clerkMember.publicUserData;

        // Find or create user - handle potential errors
        let user = await prismadb.user.findUnique({
          where: { clerkUserId: userId }
        });

        if (!user) {
          try {
            user = await prismadb.user.create({
              data: {
                clerkUserId: userId,
                email: identifier,
                firstName: firstName || '',
                lastName: lastName || '',
                profileImageUrl: imageUrl || '',
              }
            });
            console.log(`✅ Created user: ${user.clerkUserId}`);
          } catch (userError) {
            console.error(`❌ Error creating user ${userId}:`, userError);
            // Continue with organization member creation even if user creation fails
          }
        }

        // Create organization membership - this will work even if user is null due to optional relation
        await prismadb.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: prismaOrgId,
              userId: userId
            }
          },
          update: {
            role: clerkMember.role === 'org:admin' ? 'admin' : 'member'
          },
          create: {
            organizationId: prismaOrgId,
            userId: userId,
            role: clerkMember.role === 'org:admin' ? 'admin' : 'member'
          }
        });

        successCount++;
        console.log(`✅ Synced member: ${userId}`);

      } catch (memberError) {
        console.error(`❌ Error syncing member ${clerkMember.publicUserData?.userId || 'unknown'}:`, memberError);
        errorCount++;
      }
    }

    console.log(`✅ Successfully synced ${successCount} members, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Error syncing organization members:', error);
    throw error;
  }
}

export async function createReviewQueueItemIfNeeded(report: any, organizationId: string) {
  if (report.accuracyScore && report.accuracyScore < 80) {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 48); // 48-hour SLA

    const reviewItem = await prismadb.reviewQueueItem.create({
      data: {
        organizationId: organizationId,
        reportId: report.id,
        accuracyScore: report.accuracyScore,
        status: 'pending',
        priority: report.accuracyScore < 60 ? 'high' : report.accuracyScore < 70 ? 'normal' : 'low',
        dueDate: dueDate
      }
    });

    // Update organization low accuracy count
    await prismadb.organization.update({
      where: { id: organizationId },
      data: {
        lowAccuracyCount: {
          increment: 1
        }
      }
    });

    return reviewItem;
  }
  return null;
}

export async function getUserOrganizationWithFallback(userId: string) {
  try {
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId: userId,
    });
    
    if (memberships.data.length > 0) {
      const clerkOrg = memberships.data[0].organization;
      return await ensureOrganizationExists(clerkOrg.id);
    }
    return null;
  } catch (error) {
    console.error("Error fetching user organization:", error);
    return null;
  }
}