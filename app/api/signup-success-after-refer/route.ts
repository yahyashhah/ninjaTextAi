import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refId } = body;

    const referralLink = await prismadb.userReferralLinks.findUnique({
      where: {
        userId: refId,
      },
    });

    if (referralLink) {
      await prismadb.userReferralLinks.update({
        where: {userId: refId},
        data: {
            discount: true
        }
      })
    }

    return NextResponse.json( "completed" , { status: 200 });
  } catch (error) {
    console.log("[GENERATE_REFERRAL_LINK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
