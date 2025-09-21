// components/role-switcher-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function RoleSwitcherButton() {
  const router = useRouter();

  const handleRoleSwitch = () => {
    // Store the current URL to return after role selection
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const returnUrl = encodeURIComponent(currentPath);
    router.push(`/role-selector?change=true&return=${returnUrl}`);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleRoleSwitch}
      className="flex items-center gap-2 bg-transparent border-gray-600 text-white hover:bg-gray-700 hover:text-white"
      size="sm"
    >
      <Settings className="h-4 w-4" />
      <span className="hidden sm:inline">Switch Role</span>
    </Button>
  );
}