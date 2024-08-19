"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";

import {
  Check,
  AlertCircleIcon,
  CarFront,
  Fingerprint,
  Activity,
  House,
  Handshake,
  BookOpen,
  BookLock,
  Zap,
  Star,
} from "lucide-react";

import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useProModal } from "@/hooks/user-pro-modal";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import axios from "axios";
import { LoaderStripe } from "./loader-stripe";

const tools = [
  "AI - Powered Chatbot",
  "Unlimited Report Generation",
  "Unlimited Reports Narration",
  "File saving and copying",
];

export const ProModal = () => {
  const proModal = useProModal();
  const [loading, setLoading] = useState(false);

  const onSubscribe = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/stripe");
      window.location.href = response.data.url;
    } catch (error) {
      console.log("STRIPE_CLIENT_ERROR", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center flex-col gap-y-4 pb-2">
            <div className="flex items-center gap-x-2 font-bold py-1 text-white">
              Upgrade to CopNarrative
              <Badge className=" uppercase text-sm py-1 bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-600">
                Pro
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className=" pt-2 space-y-2 text-zinc-900 font-medium">
            <div className="grid grid-cols-1 gap-x-2 gap-y-2">
              {tools.map((tool, index) => (
                <div key={index}>
                  <Card
                    key={index}
                    className="p-3 bg-gray-100 border-black/5 flex items-center justify-between"
                  >
                    <div className="flex gap-x-2 items-center font-semibold text-[0.75rem]">
                      <Star className="text-yellow-500" /> {tool}
                    </div>

                    <Check className="text-green-500" />
                  </Card>
                </div>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {!loading ? (
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-600"
              onClick={onSubscribe}
            >
              Upgrade
              <Zap className="w-4 h-4 ml-2 fill-yellow-500" />
            </Button>
          ) : (
            <LoaderStripe />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
