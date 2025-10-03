// lib/api-limits.ts
import { MAX_COUNTS_FREE } from "@/constants/db-constants";
import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

export const increaseAPiLimit = async () => {
  const { userId, orgId } = auth();

  if (!userId) {
    return;
  }

  // Don't count against limits if part of a subscribed org
  if (orgId) {
    const orgSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (
      orgSub &&
      orgSub.stripeCurrentPeriodEnd &&
      orgSub.stripeCurrentPeriodEnd > new Date()
    ) {
      return;
    }
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId },
  });

  if (userApiLimit) {
    await prismadb.userApiLimit.update({
      where: { userId },
      data: { count: userApiLimit.count + 1 },
    });
  } else {
    await prismadb.userApiLimit.create({
      data: { userId, count: 1 },
    });
  }
};

export const checkApiLimit = async () => {
  const { userId, orgId } = auth();

  if (!userId) return false;

  // Check organization subscription first
  if (orgId) {
    const orgSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (
      orgSub &&
      orgSub.stripeCurrentPeriodEnd &&
      orgSub.stripeCurrentPeriodEnd > new Date()
    ) {
      return true; // Unlimited for org members
    }
  }

  // Fall back to individual limits
  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId }
  });

  return !userApiLimit;
  // return !userApiLimit || userApiLimit.count < MAX_COUNTS_FREE;
};

export const getApiLimit = async () => {
  const { userId, orgId } = auth();

  if (!userId) return;

  // If part of a subscribed org, return unlimited
  if (orgId) {
    const orgSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (
      orgSub &&
      orgSub.stripeCurrentPeriodEnd &&
      orgSub.stripeCurrentPeriodEnd > new Date()
    ) {
      return Infinity;
    }
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId }
  });

  return userApiLimit?.count || 0;
};