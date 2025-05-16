import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import {  } from "@/lib/clerk-utils";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    const { orgId, userId: memberId } = await req.json();

    if (!clerkUserId || !orgId || !memberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await (clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Revoke pro access only if it was granted by this org
    await prismadb.user.updateMany({
      where: { 
        clerkUserId: memberId,
        proAccessGrantedBy: orgId
      },
      data: { 
        isPro: false,
        proAccessGrantedBy: null 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REVOKE_ACCESS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}