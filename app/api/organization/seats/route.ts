import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";
import Stripe from "stripe";

async function getActiveBasePrice() {
  const baseProductId = process.env.STRIPE_BASE_PRODUCT_ID;
  if (!baseProductId) throw new Error("STRIPE_BASE_PRODUCT_ID not configured");

  const prices = await stripe.prices.list({
    product: baseProductId,
    active: true,
    limit: 1
  });

  return prices.data[0] || await stripe.prices.create({
    currency: 'usd',
    product: baseProductId,
    unit_amount: 8000, // $80
    recurring: { interval: 'month' },
    metadata: { type: 'base_plan' }
  });
}

async function getActiveSeatPrice() {
  const seatProductId = process.env.STRIPE_EXTRA_SEAT_PRODUCT_ID;
  if (!seatProductId) throw new Error("STRIPE_EXTRA_SEAT_PRODUCT_ID not configured");

  const prices = await stripe.prices.list({
    product: seatProductId,
    active: true,
    limit: 1
  });

  return prices.data[0] || await stripe.prices.create({
    currency: 'usd',
    product: seatProductId,
    unit_amount: 1500, // $15
    recurring: { interval: 'month' },
    metadata: { type: 'extra_seat' }
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const { orgId, extraSeats } = await req.json();

    if (!userId || !orgId || extraSeats === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const isAdmin = await isOrgAdmin(orgId, userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const orgSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId }
    });

    if (!orgSub?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(orgSub.stripeSubscriptionId);

    // Get active prices
    const [basePrice, seatPrice] = await Promise.all([
      getActiveBasePrice(),
      getActiveSeatPrice()
    ]);

    // Prepare subscription update
    const updateParams: Stripe.SubscriptionUpdateParams = {
      proration_behavior: 'create_prorations',
      items: [
        // Update base plan to use active price
        {
          id: subscription.items.data[0].id,
          price: basePrice.id
        }
      ]
    };

    // Remove existing seat items
    subscription.items.data.slice(1).forEach(item => {
      updateParams.items!.push({
        id: item.id,
        deleted: true
      });
    });

    // Add new seats if needed
    if (extraSeats > 0) {
      updateParams.items!.push({
        price: seatPrice.id,
        quantity: extraSeats
      });
    }

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(
      orgSub.stripeSubscriptionId,
      updateParams
    );

    // Update database
    const updatedSub = await prismadb.organizationSubscription.update({
      where: { clerkOrgId: orgId },
      data: {
        extraSeats,
        totalSeats: 5 + extraSeats,
        stripeCurrentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
      }
    });

    return NextResponse.json(updatedSub);
    
  } catch (error: any) {
    console.error("[SEATS_MANAGEMENT_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update seats" },
      { status: 500 }
    );
  }
}