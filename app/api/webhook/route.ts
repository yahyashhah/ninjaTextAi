import { syncOrganizationMembers } from "@/lib/clerk-org-sync";
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
  } catch (error: any) {
    console.error("❌ Webhook signature verification failed:", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'price.created':
      case 'product.created':
        // These are normal when creating dynamic prices
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }
}

async function handleOrganizationSubscription(subscription: Stripe.Subscription, clerkOrgId: string) {
  console.log(`Processing org subscription for ${clerkOrgId}`);

  const baseSeats = 5;
  let extraSeats = 0;
  let basePriceId = '';
  let seatPriceId = '';

  // Calculate seats and track prices
  subscription.items.data.forEach(item => {
    const price = item.price as Stripe.Price;
    if (!price.active) return;
    
    const metadata = price.metadata || {};
    const productMetadata = (typeof price.product === 'string') 
      ? {} 
      : (price.product as Stripe.Product)?.metadata || {};
    
    if (metadata.type === 'extra_seat' || productMetadata.type === 'extra_seat') {
      extraSeats += item.quantity || 0;
      seatPriceId = price.id;
    } else {
      basePriceId = price.id;
    }
  });

  try {
    await prismadb.$transaction([
      prismadb.organizationSubscription.upsert({
        where: { clerkOrgId },
        update: {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: basePriceId,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          baseSeats,
          extraSeats,
          totalSeats: baseSeats + extraSeats,
          ...(seatPriceId ? { stripeSeatPriceId: seatPriceId } : {})
        },
        create: {
          clerkOrgId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: basePriceId,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          baseSeats,
          extraSeats,
          totalSeats: baseSeats + extraSeats,
          ...(seatPriceId ? { stripeSeatPriceId: seatPriceId } : {})
        }
      })
    ]);

    await syncOrganizationMembers(clerkOrgId);
  } catch (error) {
    console.error("Failed to process org subscription:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const orgSub = await prismadb.organizationSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!orgSub) return;

  // Calculate seats from ACTIVE prices only
  let extraSeats = 0;
  subscription.items.data.forEach(item => {
    const price = item.price as Stripe.Price;
    if (price.active && (price.metadata?.type === 'extra_seat' || 
        (typeof price.product !== 'string' && (price.product as Stripe.Product).metadata?.type === 'extra_seat'))) {
      extraSeats += item.quantity || 0;
    }
  });

  await prismadb.organizationSubscription.update({
    where: { id: orgSub.id },
    data: {
      extraSeats,
      totalSeats: 5 + extraSeats,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}

async function handleIndividualUserSubscription(subscription: Stripe.Subscription, userId: string, refId?: string, usedCredits?: string) {
  // 1. Save subscription details
  await prismadb.userSubscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // 2. Credit the referred user
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

  // 3. Credit the referrer if applicable
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
    }
  }
  
  if (usedCredits === "true") {
    await prismadb.userApiLimit.update({
      where: { userId },
      data: {
        credits: { decrement: 19.99 },
      },
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Handling checkout.session.completed for session:", session.id);
  
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID found in session");
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log("Retrieved subscription:", subscription.id);
    
    const metadata = session.metadata || {};
    console.log("Session metadata:", metadata);

    const subscriptionType = metadata.type || 'individual';

    if (subscriptionType === 'organization') {
      if (!metadata.clerkOrgId) {
        throw new Error("Missing clerkOrgId in metadata");
      }
      console.log("Processing organization subscription for org:", metadata.clerkOrgId);
      await handleOrganizationSubscription(subscription, metadata.clerkOrgId);
    } else {
      if (!metadata.userId) {
        throw new Error("Missing userId in metadata");
      }
      console.log("Processing individual subscription for user:", metadata.userId);
      await handleIndividualUserSubscription(
        subscription,
        metadata.userId,
        metadata.refId,
        metadata.usedCredits
      );
    }
  } catch (error: any) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Check if this is an organization subscription
  const orgSubscription = await prismadb.organizationSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (orgSubscription) {
    await prismadb.organizationSubscription.update({
      where: { id: orgSubscription.id },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } else {
    // Individual subscription renewal
    await prismadb.userSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }
}