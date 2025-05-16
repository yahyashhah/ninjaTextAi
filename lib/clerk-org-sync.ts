import { clerkClient } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

// Define the shape of the membership data returned by Clerk
interface ClerkMembership {
  public_user_data: {
    user_id: string;
  };
  role: string;
}

export async function syncOrganizationMembers(orgId: string) {
  try {
    // Get the list of members from Clerk
    const memberships = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId
    });

    // Ensure that memberships is an array
    if (!Array.isArray(memberships)) {
      console.error("Memberships data is not an array", memberships);
      return;
    }

    // Sync each membership to your database
    await Promise.all(memberships.map(async (membership) => {
      const userId = membership.public_user_data?.user_id || '';
      if (!userId) {
        console.warn(`Skipping member with no userId for organization ${orgId}`);
        return;
      }

      await prismadb.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: userId
          }
        },
        update: {
          role: membership.role || '', // Default to empty string if role is undefined
        },
        create: {
          organizationId: orgId,
          userId: userId,
          role: membership.role || '', // Default to empty string if role is undefined
        }
      });
    }));

    console.log(`Synced ${memberships.length} members for organization ${orgId}`);
  } catch (error) {
    console.error("Error syncing organization members:", error);
  }
}