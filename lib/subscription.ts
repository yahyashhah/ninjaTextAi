import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

const DAYS_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = auth();
  if (!userId) {
    return false;
  }
  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId: userId,
    },
    select: {
      stripeCustomerId: true,
      stripeCurrentPeroidEnd: true,
      stripePriceId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!userSubscription) {
    return false;
  }

  const isValid =
    userSubscription.stripePriceId &&
    userSubscription.stripeCurrentPeroidEnd?.getTime()! + DAYS_IN_MS >
      Date.now();

  return !!isValid;
};
