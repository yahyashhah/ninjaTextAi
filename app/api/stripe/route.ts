import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";

import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";

const chatUrl = absoluteUrl("/chat") as string;
const manage_subscriptions = absoluteUrl("/manage_subscriptions") as string;

let amount = 1999

export async function GET() {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }

    const reffer = await prismadb.userReferralLinks.findUnique({
      where: {
        userId
      }
    })

    if(reffer?.discount === true) {
      amount = 1520
    }

    const userSubscription = await prismadb.userSubscription.findUnique({
      where: { userId: userId },
    });

    if (userSubscription && userSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: manage_subscriptions,
      });
      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
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
              description: "Unlimited NinjaText-AI Report Generations",
            },
            unit_amount: amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
    });

    return new NextResponse(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    console.log("STRIPE_ERROR", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
