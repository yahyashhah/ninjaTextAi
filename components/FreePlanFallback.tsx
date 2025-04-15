// components/FreePlanFallback.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RocketIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SubscriptionButton from "./subscription-button";

export default function FreePlanFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardContent className="p-6 text-center">
          <RocketIcon className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground mb-6">
            You're currently on the Free Plan. Upgrade now to unlock NinjaText-AI Pro features!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SubscriptionButton isPro={false} />
            {/* <Button variant="outline" onClick={() => history.back()}>
              Go Back
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
