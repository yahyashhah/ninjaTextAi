import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";

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

    // Prepare line items based on checkout type
    const line_items = isOrgCheckout
      ? [{
          price: process.env.STRIPE_ORG_PRICE_ID,
          quantity: 1, // Or calculate based on member count
        }]
      : [{
          price_data: {
            currency: "USD",
            product_data: {
              name: "NinjaText-AI Pro",
              description: "Unlimited AI Report Generations",
            },
            unit_amount: 1999,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }];

    // Create checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: chatUrl,  // Ensure it's a string
      cancel_url: manage_subscriptions,  // Ensure it's a string
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      line_items,
      metadata: {
        type: isOrgCheckout ? "organization" : "individual",
        ...(isOrgCheckout ? { clerkOrgId: orgId } : { userId }),
        refId: referral?.userId ?? "",
        usedCredits: promoCodeId ? "true" : "false",
      },
      discounts: promoCodeId ? [{ promotion_code: promoCodeId }] : undefined,
    });

    return new NextResponse(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    console.log("STRIPE_CHECKOUT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
