import { auth } from "@clerk/nextjs/server";
import prismadb from "./prismadb";

const DAYS_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = auth();
  if (!userId) return false;

  const user = await prismadb.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      subscription: true,
      organizationMemberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  // 1. Check personal subscription
  const userSubEnd = user?.subscription?.stripeCurrentPeriodEnd;
  if (
    user?.subscription?.stripePriceId &&
    userSubEnd instanceof Date &&
    userSubEnd.getTime() + DAYS_IN_MS > Date.now()
  ) {
    return true;
  }

  // 2. Check if organization granted pro access
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
};