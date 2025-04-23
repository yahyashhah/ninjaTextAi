// CheckLogoutOnReturn.tsx
"use client";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function CheckLogoutOnReturn() {
  const { signOut } = useClerk();

  useEffect(() => {
    // Check if the flag was set in localStorage
    const shouldLogout = localStorage.getItem("logoutOnNextVisit");
    if (shouldLogout === "true") {
      // Remove the flag
      localStorage.removeItem("logoutOnNextVisit");
      // Force logout
      signOut();
    }
  }, [signOut]);

  return null;
}
