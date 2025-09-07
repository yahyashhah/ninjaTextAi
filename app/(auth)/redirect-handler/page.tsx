// app/auth/redirect-handler/page.tsx
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, User, Loader2, CheckCircle } from "lucide-react";

export default function AuthRedirectHandler() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your credentials...");

  useEffect(() => {
    const handleRedirect = async () => {
      if (!userLoaded || !isSignedIn || status !== "loading") return;

      try {
        setMessage("Checking your access permissions...");
        
        // Simulate a brief loading period for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Check if user is admin
        const isAdmin = !!user?.publicMetadata?.admin;
        
        // Get the original intended destination or use default
        const intendedDestination = localStorage.getItem('intendedDestination');
        localStorage.removeItem('intendedDestination'); // Clean up
        
        setStatus("success");
        setMessage(isAdmin ? "Admin access granted" : "Access verified");
        
        // Brief pause to show success message
        await new Promise(resolve => setTimeout(resolve, 600));
        
        if (isAdmin) {
          router.replace("/admin");
        } else {
          router.replace(intendedDestination || "/chat?tutorial=true");
        }
        
      } catch (error) {
        console.error("Error during authentication:", error);
        setStatus("error");
        setMessage("Authentication error - redirecting to home");
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.replace("/");
      }
    };

    handleRedirect();
  }, [user, userLoaded, isSignedIn, router, status]);

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "error":
        return <Shield className="h-12 w-12 text-red-500" />;
      default:
        return <User className="h-12 w-12 text-gray-500" />;
    }
  };

  const getSubMessage = () => {
    if (status === "loading") {
      return "This will only take a moment...";
    }
    if (status === "success") {
      const isAdmin = !!user?.publicMetadata?.admin;
      return isAdmin 
        ? "Redirecting to admin dashboard" 
        : "Taking you to your workspace";
    }
    return "Please try again or contact support if this continues";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === "loading" ? "Securing Your Access" : 
             status === "success" ? "Access Granted" : "Authentication Issue"}
          </h1>
          
          <p className="text-gray-600 mb-6 font-medium">
            {message}
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            {getSubMessage()}
          </p>
          
          {status === "loading" && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>Protected by Clerk Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}