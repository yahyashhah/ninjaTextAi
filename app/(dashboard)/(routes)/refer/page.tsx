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
  const router = useRouter();
  const [referralEmail, setReferralEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    createReferralLink();
  }, []);
  // const handleCopy = async () => {
  //   try {
  //     await navigator.clipboard.writeText(
  //       `http://localhost:3000/sign-up?refId=${refId}`
  //     );
  //     toast({
  //       variant: "default",
  //       title: "Copied",
  //       description: "Text copied to clipboard",
  //     });
  //   } catch (error) {
  //     console.error("Unable to copy to clipboard:", error);
  //   }
  // };

  const onSubmit = async () => {
    try {
      const response = await axios.post("/api/send-invite", {
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
      console.log(response.data);
      setRefId(response.data.refId);
    } catch (error) {
      console.error("Unable to copy to clipboard:", error);
    }
  };
  return (
    <div className="bg-gradient-to-b from-white to-slate-100 min-h-screen py-12 px-6 md:px-16">
      <div className="text-center mb-10">
        <h1 className="bg-gradient-to-r from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-3xl md:text-4xl font-bold mb-2">
          Invite Your Friends 🚀
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Share your referral and give your friends a head start!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
        <Input
          value={`https://ninjatextai.com/sign-up?refId=${refId}`}
          disabled
          className="border border-[#5E85FE] rounded-xl shadow-md w-full sm:max-w-md text-sm sm:text-base"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg hover:brightness-110 transition-all">
              Email Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-full border-none backdrop-blur-md bg-white/70 shadow-2xl rounded-2xl px-6 py-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Invite via Email
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Enter the email of the person you want to invite.
              </DialogDescription>
            </DialogHeader>

            <Input
              onChange={(e) => setReferralEmail(e.target.value)}
              type="email"
              placeholder="user@example.com"
              className="mt-4 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button
                  onClick={onSubmit}
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold px-6 py-2 rounded-xl hover:scale-105 transition-transform shadow-md"
                >
                  Send Invitation
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FilingCabinet;
