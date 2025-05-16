import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    
    if (!orgId) {
      return new NextResponse("Organization ID required", { status: 400 });
    }

    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subscription = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId },
      include: {
        members: true
      }
    });

    if (!subscription) {
      return NextResponse.json({
        active: false,
        members: 0,
        seats: 0
      });
    }

    const currentDate = new Date();
    const isActive = subscription.stripeCurrentPeriodEnd
      ? new Date(subscription.stripeCurrentPeriodEnd) > currentDate
      : false;

    return NextResponse.json({
      active: isActive,
      members: subscription.members.length,
      seats: subscription.totalSeats,
      periodEnd: subscription.stripeCurrentPeriodEnd
    });
  } catch (error) {
    console.error("[ORG_SUBSCRIPTION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}