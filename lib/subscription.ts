// lib/subscription.ts
import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

const DAYS_IN_MS = 86_400_000;

// 1. DECLARE OVERLOADS - Different ways to call the function
export function checkSubscription(): Promise<boolean>;
export function checkSubscription(userId: string): Promise<boolean>;

// 2. IMPLEMENTATION - The actual function that handles both cases
export async function checkSubscription(userId?: string): Promise<boolean> {
  let actualUserId = userId;
  
  // If no userId provided (first overload), get it from auth
  if (!actualUserId) {
    const authResult = auth();
    actualUserId = authResult.userId || '';
  }
  
  if (!actualUserId) return false;

  // Check if userId is a valid ObjectID format to prevent MongoDB errors
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(actualUserId);
  
  if (!isObjectId) {
    console.warn("Invalid user ID format in checkSubscription:", actualUserId);
    return false;
  }

  // Your existing subscription logic...
  const user = await prismadb.user.findUnique({
    where: { clerkUserId: actualUserId },
    include: {
      subscription: true,
      organizationMemberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  const userSubEnd = user?.subscription?.stripeCurrentPeriodEnd;
  if (
    user?.subscription?.stripePriceId &&
    userSubEnd instanceof Date &&
    userSubEnd.getTime() + DAYS_IN_MS > Date.now()
  ) {
    return true;
  }

  if (user?.isPro && user?.proAccessGrantedBy) {
    const orgSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: user.proAccessGrantedBy },
    });

    const orgSubEnd = orgSub?.stripeCurrentPeriodEnd;
    if (
      orgSubEnd instanceof Date &&
      orgSubEnd.getTime() > Date.now()
    ) {
      return true;
    }
  }

  return false;
}