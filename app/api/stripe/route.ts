import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";
import Stripe from "stripe";

const chatUrl = absoluteUrl("/chat").toString(); // Ensure it's a string
const manage_subscriptions = absoluteUrl("/manage_subscriptions").toString(); // Ensure it's a string

export async function GET(req: Request) {
  try {
    const { userId, orgId } = auth();
    console.log("User ID:", userId);
    
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if this is an organization checkout
    const isOrgCheckout = Boolean(orgId);
    const isAdmin = isOrgCheckout && orgId ? await isOrgAdmin(orgId, userId) : false;

    if (isOrgCheckout && !isAdmin) {
      return new NextResponse("Only organization admins can manage subscriptions", { status: 403 });
    }

    // Get referral info (for both individual and org flows)
    const referral = await prismadb.userReferralLinks.findFirst({
      where: { refId: userId },
    });
    
    console.log("Referral object:", referral);
    console.log(referral?.refId);

    // Get existing subscription
    const existingSubscription = isOrgCheckout
      ? await prismadb.organizationSubscription.findUnique({
          where: { clerkOrgId: orgId }
        })
      : await prismadb.userSubscription.findUnique({
          where: { userId }
        });

    // Handle billing portal for existing customers
    if (existingSubscription?.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: existingSubscription.stripeCustomerId,
        return_url: manage_subscriptions,
      });
      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    }

    // Check for promo credits (for both flows)
    let promoCodeId: string | undefined;
    const userApiLimit = await prismadb.userApiLimit.findUnique({
      where: { userId },
    });

    if (userApiLimit?.credits && userApiLimit.credits >= 19) {
      const coupon = await stripe.coupons.create({
        amount_off: isOrgCheckout ? 9999 : 1999, // $99.99 for org vs $19.99 for individual
        currency: "usd",
        duration: "once",
      });

      const promo = await stripe.promotionCodes.create({
        coupon: coupon.id,
        max_redemptions: 1,
      });

      promoCodeId = promo.id;
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = isOrgCheckout
  ? [{
      price: process.env.STRIPE_ORG_PRICE_ID as string,
      quantity: 1,
    }]
  : [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "NinjaText-AI Pro",
          description: "Unlimited AI Report Generations",
        },
        unit_amount: 1999,
        recurring: {
          interval: "month" as const,
        },
      },
      quantity: 1,
    }];

const metadata: Stripe.MetadataParam = {
  type: isOrgCheckout ? "organization" : "individual",
  refId: referral?.userId ?? "",
  usedCredits: promoCodeId ? "true" : "false",
  ...(isOrgCheckout && orgId ? { clerkOrgId: orgId } : { userId: userId ?? "" }),
};

const sessionParams: Stripe.Checkout.SessionCreateParams = {
  success_url: chatUrl,
  cancel_url: manage_subscriptions,
  payment_method_types: ['card'],
  mode: "subscription",
  billing_address_collection: "auto",
  customer_email: user.emailAddresses[0].emailAddress,
  line_items,
  metadata,
  ...(promoCodeId ? { discounts: [{ promotion_code: promoCodeId }] } : {}),
};

const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    return new NextResponse(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    console.log("STRIPE_CHECKOUT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
