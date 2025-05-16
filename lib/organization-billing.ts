// lib/organization-billing.ts
import { auth } from "@clerk/nextjs/server";
import prismadb from "./prismadb";

export const getOrgSubscription = async (orgId: string) => {
  return await prismadb.organizationSubscription.findUnique({
    where: { clerkOrgId: orgId }
  });
};

export const checkOrgSubscription = async (orgId: string) => {
  const subscription = await getOrgSubscription(orgId);
  
  if (!subscription) return false;
  
  // Check if subscription is still active
  return subscription.stripeCurrentPeriodEnd && 
    subscription.stripeCurrentPeriodEnd.getTime() > Date.now();
};

export const getOrgMemberCount = async (orgId: string) => {
  // This uses Clerk's API to get member count
  const response = await fetch(
    `https://api.clerk.com/v1/organizations/${orgId}/memberships`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`
      }
    }
  );
  
  const data = await response.json();
  return data.length;
};