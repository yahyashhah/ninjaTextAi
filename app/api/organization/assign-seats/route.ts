import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    const { orgId, memberIds }: { orgId: string; memberIds: string[] } = await req.json();

    if (!clerkUserId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isOrgAdmin(orgId, clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (!orgSub) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    if (memberIds.length > orgSub.totalSeats) {
      return NextResponse.json(
        { error: "Not enough seats available" },
        { status: 400 }
      );
    }

    const allMembers = await prismadb.organizationMember.findMany({
      where: { organizationId: orgId }
    });

    await prismadb.$transaction([
      ...allMembers
        .filter(member => !memberIds.includes(member.userId))
        .map(member =>
          prismadb.user.updateMany({
            where: {
              clerkUserId: member.userId,
              proAccessGrantedBy: orgId
            },
            data: {
              isPro: false,
              proAccessGrantedBy: null
            }
          })
        ),

      ...memberIds.map(userId =>
        prismadb.user.upsert({
          where: { clerkUserId: userId },
          create: {
            clerkUserId: userId,
            isPro: true,
            proAccessGrantedBy: orgId
          },
          update: {
            isPro: true,
            proAccessGrantedBy: orgId
          }
        })
      )
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SEAT_ASSIGNMENT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}