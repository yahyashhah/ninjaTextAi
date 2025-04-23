// SessionAutoLogout.tsx
"use client";
import { useEffect } from "react";

export default function SessionAutoLogout() {
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Set flag in localStorage to indicate the user is closing the tab
      localStorage.setItem("logoutOnNextVisit", "true");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
  
  return null;
}
