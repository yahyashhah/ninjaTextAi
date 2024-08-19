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
    <div id="pricing" className="bg-white">
      <div className="px-32 h-fit">
        <div className="flex flex-col bg-[#EFF2FB] p-4 rounded-3xl items-center justify-center text-center gap-y-8 drop-shadow-lg">
          <p className="text-gray-500 font-semibold mt-6">Plans and Pricing</p>
          <h1 className="text-3xl font-bold text-black px-48">
            Choose your plan: flexible upgrades, downgrades, and easy
            cancellations.
          </h1>

          <div className="flex items-center  gap-x-12 mb-12">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  plan.tag === "Free" ? "" : "bg-black text-white space-y-4",
                  "text-left drop-shadow-xl px-3 pl-4 pr-12 h-fit rounded-3xl"
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
                  <CardTitle className="text-3xl font-bold">
                    {plan.price}
                  </CardTitle>
                  <CardDescription>{plan.line}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-y-4">
                  {plan.description.map((desc, index) => (
                    <p
                      key={index}
                      className={cn(
                        plan.tag === "Free"
                          ? "border-gray-200"
                          : "border-gray-700",
                        "text-sm font-medium border-b-2  pb-2"
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
                        plan.tag === "Free" ? "" : "bg-sky-600",
                        "drop-shadow-md"
                      )}
                    >
                     {plan.tag === "Oraginzation" ? "Book a Demo" : "Buy Now"} 
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
