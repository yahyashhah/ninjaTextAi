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
    <div className="bg-white min-h-screen">
      <div className="flex flex-col items-start mb-8 px-8 gap-2">
        <h1 className="my-2 bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-xl md:text-3xl font-bold text-center mt-6">
          Invite Friends
        </h1>
        <p className="text-muted-foreground font-normal text-sm text-center">
          Invite your friend so that they can take benefit out of it.
        </p>
      </div>
      <div className="flex gap-4 px-2 md:px-8 overflow-scroll lg:overflow-hidden">
        <Input
          placeholder="www.ninjatextai.com/"
          className="dropshadow-md border-[#5E85FE]"
          disabled
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 drop-shadow-md text-xs sm:text-base">
              Email Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-full">
            <DialogHeader>
              <DialogTitle>
                Enter the email of user you want to invite!
              </DialogTitle>
              <DialogDescription className="mt-2">
                <Input
                  onChange={(e) => setReferralEmail(e.target.value)}
                  className="mt-4"
                  type="email"
                  placeholder="Please write here!"
                />
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose>
                <Button
                  className="bg-sky-500 drop-shadow-md w-full sm:w-auto"
                  onClick={onSubmit}
                >
                  Send Email
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
