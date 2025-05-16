// lib/get-server-org-id.ts
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

export const getServerOrgId = async (): Promise<string | null> => {
  try {
    // Get user authentication
    const { userId } = auth();
    if (!userId) {
      console.warn('No user ID found in session');
      return null;
    }

    // Get organization memberships with error handling
    let memberships;
    try {
      const response = await clerkClient.users.getOrganizationMembershipList({ userId });
      memberships = response.data;
    } catch (error) {
      console.error('Failed to fetch organization memberships:', error);
      return null;
    }

    // Handle cases where user has no memberships
    if (!memberships || memberships.length === 0) {
      console.warn(`User ${userId} has no organization memberships`);
      return null;
    }

    // Return the first organization ID (you can modify this logic as needed)
    return memberships[0].organization.id;

  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in getServerOrgId:', error);
    return null;
  }
};