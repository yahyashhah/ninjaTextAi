"use client";

import React from "react";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const FilingCabinet = () => {
  const router = useRouter();
  const { toast } = useToast();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("https://www.ninjatextai.com");
      toast({
        variant: "default",
        title: "Copied",
        description: "Text copied to clipboard",
      });
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
        <Button onClick={handleCopy} className="bg-gradient-to-tr from-[#0A236D] to-[#5E85FE] hover:bg-[#5E85FE]">
          Copy Link
        </Button>
      </div>
    </div>
  );
};

export default FilingCabinet;
