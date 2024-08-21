import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { plans } from "@/constants/landingpage";
import { cn } from "@/lib/utils";
import Link from "next/link";

const LandingPricing = () => {
  return (
    <div id="pricing" className="bg-white py-8">
      <div className="px-4 sm:px-8 md:px-16 lg:px-32">
        <div className="flex flex-col bg-[#EFF2FB] p-6 md:p-8 lg:p-12 rounded-3xl items-center justify-center text-center gap-y-8 drop-shadow-lg">
          <p className="text-gray-500 font-semibold text-sm md:text-base mt-4">
            Plans and Pricing
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black px-4 md:px-12 lg:px-48">
            Choose your plan: flexible upgrades, downgrades, and easy
            cancellations.
          </h1>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 mb-12">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  plan.tag === "Free" ? "bg-white text-black" : "bg-black text-white",
                  "text-left drop-shadow-xl px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10 h-fit rounded-3xl"
                )}
              >
                <CardHeader>
                  <div
                    className={cn(
                      plan.tag === "Free"
                        ? "bg-gray-200 text-sky-600"
                        : "bg-sky-600 text-white",
                      "w-fit p-1 px-3 rounded-lg font-bold text-sm mb-2"
                    )}
                  >
                    {plan.tag}
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    {plan.price}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    {plan.line}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-y-2 md:gap-y-4">
                  {plan.description.map((desc, index) => (
                    <p
                      key={index}
                      className={cn(
                        plan.tag === "Free"
                          ? "border-gray-200"
                          : "border-gray-700",
                        "text-sm font-medium border-b-2 pb-2"
                      )}
                    >
                      {desc}
                    </p>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href={"/sign-up"}>
                    <Button
                      className={cn(
                        plan.tag === "Free" ? "bg-gray-300 text-black" : "bg-sky-600",
                        "drop-shadow-md"
                      )}
                    >
                      {plan.tag === "Organization" ? "Book a Demo" : "Buy Now"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPricing;
