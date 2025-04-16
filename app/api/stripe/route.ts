// routes/api/stripe/route.ts
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";

const chatUrl = absoluteUrl("/chat");
const manage_subscriptions = absoluteUrl("/manage_subscriptions");

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    console.log("User ID:", userId);
    
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const referral = await prismadb.userReferralLinks.findFirst({
      where: { refId: userId },
    });
    
    console.log("Referral object:", referral);
    console.log(referral?.refId);
    
    const userSubscription = await prismadb.userSubscription.findUnique({
      where: { userId },
    });

    if (userSubscription && userSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: manage_subscriptions,
      });

      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    }

    const userApiLimit = await prismadb.userApiLimit.findUnique({
      where: { userId },
    });

    let promoCodeId: string | undefined;

    if (userApiLimit?.credits && userApiLimit.credits >= 19) {
      const coupon = await stripe.coupons.create({
        amount_off: 1999, // $19.99
        currency: "usd",
        duration: "once",
      });

      const promo = await stripe.promotionCodes.create({
        coupon: coupon.id,
        max_redemptions: 1,
      });

      promoCodeId = promo.id;
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: chatUrl,
      cancel_url: manage_subscriptions,
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      line_items: [
        {
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
        },
      ],
      metadata: {
        userId,
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
