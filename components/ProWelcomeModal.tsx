// components/ProWelcomeModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ProWelcomeModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show modal only once per session
    const shown = sessionStorage.getItem("pro-modal-shown");
    if (!shown) {
      setOpen(true);
      sessionStorage.setItem("pro-modal-shown", "true");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-400 text-transparent bg-clip-text">
            🎉 Welcome to Pro!
          </DialogTitle>
          <DialogDescription className="text-sm mt-2 text-muted-foreground">
            Thank you for upgrading to NinjaTextAI Pro. Enjoy unlimited access and premium features!
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)} className="w-full">
            Let’s Go 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProWelcomeModal;