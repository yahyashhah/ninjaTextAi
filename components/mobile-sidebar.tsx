"use client";

import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import Sidebar from "./dashboardSidebar";
import { useEffect, useState } from "react";

interface MobileSidebarProps {
  apiLimitCount: number;
  isPro: boolean;
  userId?: string;
}

const MobileSidebar = ({
  apiLimitCount = 0,
  isPro = false,
  userId
}: MobileSidebarProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
        >
          <Menu className="text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 text-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        style={{ zIndex: 10001 }} // Ensure sidebar is above tutorial overlay
      >
        <Sidebar 
          isPro={isPro} 
          apiLimitCount={apiLimitCount} 
          userId={userId}
          setSidebarOpen={setSidebarOpen}
        />
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;