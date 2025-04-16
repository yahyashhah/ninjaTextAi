import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refId, userId } = body;

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }
    
    if (!refId) {
      return NextResponse.json({ message: "No referral provided, skipping" }, { status: 200 });
    }    

    // Store with userId = current user, refId = the referrer
    await prismadb.userReferralLinks.upsert({
      where: { userId: refId }, // unique constraint on current user
      update: {
        refId: userId, // referrer
        discount: true,
      },
      create: {
        userId: refId, // current user
        refId: userId, // referrer
        discount: true,
      },
    });

    return NextResponse.json({ message: "Referral stored successfully" }, { status: 200 });
  } catch (error) {
    console.log("[GENERATE_REFERRAL_LINK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";