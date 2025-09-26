// app/auth/redirect-handler/page.tsx
"use client";

import { useUser, useAuth, useOrganizationList } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Loader2, CheckCircle } from "lucide-react";

export default function AuthRedirectHandler() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { isLoaded: orgsLoaded, setActive, userMemberships } = useOrganizationList();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your credentials...");

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !user.id) {
        return false;
      }

      try {
        const isSuperAdmin = !!user.publicMetadata?.admin;
        const organizationMemberships = user.organizationMemberships || [];
        const hookMemberships = userMemberships?.data || [];

        const isDepartmentAdminFromUser = organizationMemberships.some(
          (membership: any) => membership.role === "admin" || membership.role === "org:admin"
        );

        const isDepartmentAdminFromHook = hookMemberships.some(
          (membership: any) => membership.role === "admin" || membership.role === "org:admin"
        );

        return isSuperAdmin || isDepartmentAdminFromUser || isDepartmentAdminFromHook;
      } catch {
        return false;
      }
    };

    const handleRedirect = async () => {
      if (!userLoaded || !isSignedIn || !orgsLoaded || status !== "loading") {
        return;
      }

      try {
        setMessage("Checking your access permissions...");
        await new Promise(resolve => setTimeout(resolve, 800));

        const userIsAdmin = await checkAdminStatus();
        const intendedDestination = localStorage.getItem("intendedDestination");
        localStorage.removeItem("intendedDestination");

        setStatus("success");

        if (userIsAdmin) {
          setMessage("Admin access detected");
          const rolePreference = user?.id ? localStorage.getItem(`rolePreference_${user.id}`) : null;
          const lastOrgId = user?.id ? localStorage.getItem(`lastOrg_${user.id}`) : null;

          await new Promise(resolve => setTimeout(resolve, 600));

          if (rolePreference === "user") {
            router.replace(intendedDestination || "/chat?tutorial=true");
          } else if (rolePreference === "admin") {
            const isSuperAdmin = !!user?.publicMetadata?.admin;
            if (isSuperAdmin) {
              router.replace("/admin");
            } else if (lastOrgId && setActive) {
              try {
                await setActive({ organization: lastOrgId });
              } catch {}
              router.replace("/department-admin");
            } else {
              router.replace("/department-admin");
            }
          } else {
            router.replace("/role-selector");
          }
        } else {
          setMessage("Access verified");
          await new Promise(resolve => setTimeout(resolve, 600));
          router.replace(intendedDestination || "/chat?tutorial=true");
        }
      } catch {
        setStatus("error");
        setMessage("Authentication error - redirecting to home");
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.replace("/");
      }
    };

    handleRedirect();
  }, [user, userLoaded, isSignedIn, orgsLoaded, userMemberships, setActive, router, status]);

  const getIcon = () => {
    if (status === "loading") return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
    if (status === "success") return <CheckCircle className="h-12 w-12 text-green-500" />;
    return <Shield className="h-12 w-12 text-red-500" />;
  };

  const getSubMessage = () => {
    if (status === "loading") return "This will only take a moment...";
    if (status === "success") return "Redirecting to your destination...";
    return "Please try again or contact support if this continues";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">{getIcon()}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === "loading"
              ? "Securing Your Access"
              : status === "success"
              ? "Access Granted"
              : "Authentication Issue"}
          </h1>
          <p className="text-gray-600 mb-6 font-medium">{message}</p>
          <p className="text-sm text-gray-500 mb-8">{getSubMessage()}</p>

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