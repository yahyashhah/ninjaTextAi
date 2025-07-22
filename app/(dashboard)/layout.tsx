import Navbar from "@/components/dashboard-navbar";
import Sidebar from "@/components/dashboardSidebar";
import { Toaster } from "@/components/ui/toaster";
import { getApiLimit } from "@/lib/api-limits";
import { checkOrgSubscription } from "@/lib/organization-billing";
import { checkSubscription } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


// app/(dashboard)/layout.tsx
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId, orgId } = auth();

  if (!userId) redirect("/sign-in");

  const apiLimitCount = (await getApiLimit()) as number;

  const isPro = !!(orgId 
    ? await checkOrgSubscription(orgId)
    : await checkSubscription());

  return (
    <div className={cn("h-full relative bg-white")}>
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 rounded-br-lg rounded-tr-lg">
        <Sidebar userId={userId} isPro={isPro} apiLimitCount={apiLimitCount} />
      </div>
      <main className={cn("md:pl-64")}>
        <Navbar />
        <div className="max-h-screen rounded-tl-lg bg-white">
          {orgId && (
            <div className="p-4 border-b">
              <span className="font-medium">
                Currently in organization mode
              </span>
            </div>
          )}
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default DashboardLayout;