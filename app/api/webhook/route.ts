// routes/api/stripe/webhook/route.ts
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return new NextResponse(`Webhook Error: ${error}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    console.log("✅ Webhook Triggered: checkout.session.completed");

    const userId = session?.metadata?.userId;
    const refId = session?.metadata?.refId;
    const usedCredits = session?.metadata?.usedCredits;
    const subscriptionId = session.subscription as string;

    if (!userId || !subscriptionId) {
      console.error("❌ Missing userId or subscriptionId in metadata");
      return new NextResponse("Invalid metadata", { status: 400 });
    }

    // Retrieve the full subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log("✅ Retrieved Subscription:", subscription.id);

    // 1. Save user's subscription details
    await prismadb.userSubscription.create({
      data: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeroidEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    // 2. Credit the referred user (new user)
    const existingApiLimit = await prismadb.userApiLimit.findUnique({
      where: { userId },
    });

    if (existingApiLimit) {
      await prismadb.userApiLimit.update({
        where: { userId },
        data: {
          credits: { increment: 19.99 },
          refId: existingApiLimit.refId || refId || undefined,
        },
      });
    } else {
      await prismadb.userApiLimit.create({
        data: {
          userId,
          credits: 19.99,
          refId: refId || undefined,
        },
      });
    }

    console.log("✅ Credited new user (referred):", userId);

    // 3. Credit the referrer
    if (refId) {
      const alreadyRewarded = await prismadb.referralReward.findFirst({
        where: {
          referrerId: refId,
          referredUserId: userId,
        },
      });

      if (!alreadyRewarded) {
        await prismadb.userApiLimit.upsert({
          where: { userId: refId },
          update: {
            credits: { increment: 19.99 },
          },
          create: {
            userId: refId,
            credits: 19.99,
          },
        });

        await prismadb.referralReward.create({
          data: {
            referrerId: refId,
            referredUserId: userId,
            credited: true,
          },
        });

        console.log("✅ Referrer credited:", refId);
      } else {
        console.log("ℹ️ Referrer already rewarded:", refId);
      }
    }
    if (usedCredits === "true") {
      // Deduct 19.99 credits here
      await prismadb.userApiLimit.update({
        where: { userId },
        data: {
          credits: { decrement: 19.99 },
        },
      });
    
      console.log("✅ Deducted 19.99 credits for promo code use:", userId);
    }    
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    console.log("🔁 Subscription Renewed for User ID:", session?.metadata?.userId);

    await prismadb.userSubscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeroidEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}