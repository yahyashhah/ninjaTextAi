import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }

    const referralLink = await prismadb.userReferralLinks.findUnique({
      where: {
        userId,
      },
    });

    if (referralLink) {
      return NextResponse.json({ refId: referralLink.refId }, { status: 200 });
    }

    const newLink = await prismadb.userReferralLinks.create({
      data: {
        userId,
        refId: userId,
      },
    });
    return NextResponse.json({ refId: newLink.refId }, { status: 200 });
  } catch (error) {
    console.log("[GENERATE_REFERRAL_LINK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
