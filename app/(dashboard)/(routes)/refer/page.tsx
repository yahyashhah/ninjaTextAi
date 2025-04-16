"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FilingCabinet = () => {
  const [refId, setRefId] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    createReferralLink();
  }, []);

  const onSubmit = async () => {
    try {
      await axios.post("/api/send-invite", {
        email: referralEmail,
        referralLink: `http://localhost:3000/sign-up?refId=${refId}`,
      });
      toast({
        variant: "default",
        title: "Success",
        description: "Invitation Sent Successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please try again later!",
      });
    }
  };

  const createReferralLink = async () => {
    try {
      const response = await axios.post("/api/create-referral-link");
      setRefId(response.data.refId);
    } catch (error) {
      console.error("Unable to generate referral link:", error);
    }
  };

  const getCredits = async () => {
    try {
      const {data} = await axios.get("/api/check_credits");
      setCredits(data.credits);
      console.log("Credits:", data.credits);
      
    } catch (error) {
      console.error("Unable to fetch credits:", error);
    }
  };

  useEffect(() => {
    getCredits();
  }, []);

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="w-full mx-auto space-y-5">
        {/* Heading */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold">Referral and credits</h1>
        </div>

        {/* Credit Balance */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-medium">Credit balance</h2>
          <p className="text-muted-foreground mt-1">
            You currently have <span className="font-bold">${credits}</span> in credit.
            Refer your friends to help them reduce documentation time.
          </p>
        </div>

        {/* Referral Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold">
            Get $19.99 in credit for every person you refer to NinjaTextAI 💖
          </h2>
          <p className="text-muted-foreground mt-1">
            You will receive the credit when the person you invite starts the subscription. They will also receive $19 in credits to use on the first month.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Input
              value={`https://ninjatextai.com/sign-up?refId=${refId}`}
              disabled
              className="text-sm sm:text-base border border-gray-300 rounded-md shadow-sm w-full"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-sky-600 text-white px-4 py-2 rounded-md shadow hover:bg-sky-700 transition-all">
                  Email Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white rounded-xl border shadow-xl p-6">
                <DialogHeader>
                  <DialogTitle>Invite via Email</DialogTitle>
                  <DialogDescription>
                    Enter the email of the person you want to invite.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  onChange={(e) => setReferralEmail(e.target.value)}
                  className="mt-4"
                />
                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button onClick={onSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
                      Send Invitation
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-2 flex gap-4 text-blue-600 underline text-sm">
            <a href={`mailto:?subject=Join NinjaTextAI&body=Use this link: https://ninjatextai.com/sign-up?refId=${refId}`}>Email</a>
            <a href={`sms:?body=Join NinjaTextAI using this link: https://ninjatextai.com/sign-up?refId=${refId}`}>SMS</a>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 Tips for Maximizing Your Referral Credits
          </h3>
          <p className="text-sm text-blue-700">
            The most effective way to earn credits is by sharing your referral link in{" "}
            <span className="font-semibold">Facebook groups</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FilingCabinet;