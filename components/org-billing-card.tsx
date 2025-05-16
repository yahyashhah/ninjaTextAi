"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface SubscriptionStatus {
  active: boolean;
  members: number;
  seats: number;
  periodEnd?: Date;
}

export const OrgBillingCard = () => {
  const { organization } = useOrganization();
  const { user } = useUser();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [seatCount, setSeatCount] = useState(5);
  const [isManagingSeats, setIsManagingSeats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubscription = async () => {
    if (!organization?.id || !user?.id) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/organization/subscription?orgId=${organization.id}`);
      if (!res.ok) throw new Error("Failed to fetch subscription");
      
      const data = await res.json();
      
      if (data?.periodEnd) {
        data.periodEnd = new Date(data.periodEnd);
      }
      
      setSubscriptionStatus(data);
      setSeatCount(data?.seats || 5);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [organization?.id, user?.id]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      if (!organization?.id) {
        throw new Error("No organization selected");
      }
  
      const response = await fetch("/api/stripe/org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          orgId: organization.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Request failed");
      }
  
      const result = await response.json();
      
      if (result?.url) {
        router.push(result.url);
      } else {
        toast({
          title: "Upgrade successful!",
          description: "Your organization has been upgraded to Pro.",
        });
        await fetchSubscription();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to process request",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSeatsMutation = useMutation({
    mutationFn: async (newSeats: number) => {
      const res = await fetch('/api/organization/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization?.id,
          extraSeats: Math.max(0, newSeats - 5)
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to update seats");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Seats updated successfully",
        description: `Your organization now has ${data.totalSeats} seats.`,
      });
      fetchSubscription();
      setIsManagingSeats(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update seats",
        description: error.message || "Please try again or contact support.",
      });
    }
  });

  const handleSeatUpdate = () => {
    if (seatCount < 5) {
      toast({
        variant: "destructive",
        title: "Minimum 5 seats required",
      });
      return;
    }
    updateSeatsMutation.mutate(seatCount);
  };

  const calculateTotalPrice = () => {
    const basePrice = 80;
    const extraSeats = Math.max(0, seatCount - 5);
    return basePrice + (extraSeats * 15);
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium">
        {subscriptionStatus?.active ? "Organization Pro Plan" : "Organization Plan"}
      </h3>
      <p className="text-sm text-muted-foreground mt-2">
        {subscriptionStatus?.active
          ? "All members have access to premium features."
          : "Upgrade your organization to give all members access to premium features."}
      </p>
      
      {subscriptionStatus?.active ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Subscription Status</span>
            <span className="font-medium">Active</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Seats</span>
            <span className="font-medium">
              {subscriptionStatus.seats}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Members</span>
            <span className="font-medium">
              {subscriptionStatus.members}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Renews On</span>
            <span className="font-medium">
              {subscriptionStatus?.periodEnd 
                ? new Date(subscriptionStatus.periodEnd).toLocaleDateString() 
                : "N/A"}
            </span>
          </div>

          {isManagingSeats ? (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">Additional Seats</span>
                <input
                  type="number"
                  min="0"
                  value={seatCount - 5}
                  onChange={(e) => setSeatCount(5 + parseInt(e.target.value) || 5)}
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Total: ${calculateTotalPrice()}/month
                </span>
                <div className="space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsManagingSeats(false)}
                    disabled={updateSeatsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSeatUpdate}
                    disabled={updateSeatsMutation.isPending}
                  >
                    {updateSeatsMutation.isPending ? "Processing..." : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                setSeatCount(subscriptionStatus.seats);
                setIsManagingSeats(true);
              }}
            >
              Manage Seats
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Subscription Status</span>
            <span className="font-medium">Inactive</span>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            Includes 5 seats, additional seats available for $15 each.
          </div>
        </div>
      )}

      <Button 
        onClick={handleUpgrade} 
        className="mt-6 w-full"
        disabled={!organization || isLoading || updateSeatsMutation.isPending}
      >
        {isLoading
          ? "Processing..."
          : subscriptionStatus?.active 
            ? "Manage Subscription" 
            : "Upgrade Organization ($80/month)"}
      </Button>
    </div>
  );
};