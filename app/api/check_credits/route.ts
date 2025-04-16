// /app/api/debug/check-credits/route.ts
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();

  if (!user || !user.id) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const userId = user.id;

  // 1. Get current user's API limit record
  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: {
      userId,
    },
  });

  if (!userApiLimit) {
    return NextResponse.json({ error: "User record not found" }, { status: 404 });
  }

  const ownCredits = userApiLimit.credits ?? 0;

  // 2. If the current user has a referrer, fetch their credits too
  let referrerCredits = null;
  if (userApiLimit.refId) {
    const referrer = await prismadb.userApiLimit.findUnique({
      where: {
        userId: userApiLimit.refId,
      },
    });

    referrerCredits = referrer?.credits ?? 0;
  }

  return NextResponse.json({
    userId,
    credits: ownCredits,
    referrerCredits,
  });
}
