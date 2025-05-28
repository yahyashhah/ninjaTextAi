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
        <div className="flex flex-col bg-[#EFF2FB] p-6 md:p-8 lg:p-12 rounded-3xl items-center justify-center text-center gap-y-4 drop-shadow-lg">
          <h5 className="w-fit px-4 text-black font-normal bg-white rounded-xl shadow-lg">
            Plans and Pricing
          </h5>
          <h1 className="text-xl sm:text- md:text-3xl lg:text-4xl font-bold text-black px-4 md:px-12 lg:px-22">
            Choose Your Plan
          </h1>
          <h1 className="text-xs sm:text-sm md:text-md lg:text-lg font-bold text-black px-4 md:px-12 lg:px-22">
            Flexible, Upgrades, Downgrades, and Easy Cancellations.
          </h1>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 mb-12">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  plan.tag === "Free"
                    ? "bg-white text-black"
                    : "bg-black text-white",
                  "text-left shadow-black/20 shadow-xl px-4 py-4 md:px-6 md:py-8 lg:px-6 lg:py-6 h-fit rounded-3xl"
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
                <CardFooter className="flex items-center justify-center">
                  <Link href={"/sign-up"}>
                    <Button
                      className={cn(
                        plan.tag === "Free"
                          ? "bg-gray-300 text-black hover:text-white"
                          : "bg-sky-600",
                        "drop-shadow-md"
                      )}
                    >
                      {plan.tag === "Free" && "Start for Free"}
                      {plan.tag === "Organization" && "Book a Demo"}
                      {plan.tag === "Premium" && "Try it now"}
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
