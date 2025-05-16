// api/stripe/org/route.ts
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";
import Stripe from "stripe";

interface RequestData {
  orgId: string;
  extraSeats?: number; // Optional for future seat additions
}

const settingsUrl = absoluteUrl("/organization/billing");

const BASE_PRODUCT_ID = process.env.STRIPE_BASE_PRODUCT_ID;
const SEAT_PRODUCT_ID = process.env.STRIPE_EXTRA_SEAT_PRODUCT_ID;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();
    const { orgId, extraSeats = 0 }: RequestData = await req.json();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    const isAdmin = await isOrgAdmin(orgId, userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const existingSub = await prismadb.organizationSubscription.findUnique({
      where: { clerkOrgId: orgId }
    });

    // Handle existing subscription (billing portal)
    if (existingSub?.stripeCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existingSub.stripeCustomerId,
        return_url: settingsUrl,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // Ensure products exist
    if (!BASE_PRODUCT_ID || !SEAT_PRODUCT_ID) {
      throw new Error("Stripe products not configured");
    }

    // Get or create active prices
    const [basePrice, seatPrice] = await Promise.all([
      stripe.prices.list({
        product: BASE_PRODUCT_ID,
        active: true,
        limit: 1
      }).then(res => res.data[0] || stripe.prices.create({
        currency: 'usd',
        product: BASE_PRODUCT_ID,
        unit_amount: 8000,
        recurring: { interval: 'month' },
        metadata: { type: 'base_plan' }
      })),
      
      extraSeats > 0 ? (
        stripe.prices.list({
          product: SEAT_PRODUCT_ID,
          active: true,
          limit: 1
        }).then(res => res.data[0] || stripe.prices.create({
          currency: 'usd',
          product: SEAT_PRODUCT_ID,
          unit_amount: 1500,
          recurring: { interval: 'month' },
          metadata: { type: 'extra_seat' }
        }))
      ) : null
    ]);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price: basePrice.id,
      quantity: 1
    }];

    if (extraSeats > 0 && seatPrice) {
      line_items.push({
        price: seatPrice.id,
        quantity: extraSeats
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      success_url: `${settingsUrl}?success=true`,
      cancel_url: `${settingsUrl}?canceled=true`,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: user.emailAddresses[0].emailAddress,
      line_items,
      metadata: {
        type: 'organization',
        clerkOrgId: orgId,
        adminUserId: userId
      },
      subscription_data: {
        description: `Organization plan for ${orgId}`,
        metadata: { type: 'org_subscription' }
      }
    });
    console.log("Checkout session created:", checkoutSession.id);

    if (!checkoutSession.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_ORG_CHECKOUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}