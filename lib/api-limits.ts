import { MAX_COUNTS_FREE } from "@/constants/db-constants";
import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

export const increaseAPiLimit = async () => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: {
      userId,
    },
  });

  if (userApiLimit) {
    await prismadb.userApiLimit.update({
      where: { userId: userId },
      data: { count: userApiLimit.count + 1 },
    });
  } else {
    await prismadb.userApiLimit.create({
      data: { userId: userId, count: 1 },
    });
  }
};

export const checkApiLimit = async () => {
  const { userId } = auth();
  if (!userId) {
    return;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });
  if (!userApiLimit || userApiLimit.count < MAX_COUNTS_FREE) {
    return true;
  } else {
    return false;
  }
};

export const getApiLimit = async () => {
  const { userId } = auth();

  if (!userId) return;

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });
  if (!userApiLimit) return 0;
  return userApiLimit.count;
};
