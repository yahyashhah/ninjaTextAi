import Navbar from "@/components/dashboard-navbar";
import Sidebar from "@/components/dashboardSidebar";
import { Toaster } from "@/components/ui/toaster";
import { getApiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
import { cn } from "@/lib/utils";


const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const apiLimitCount = (await getApiLimit()) as number;
  const isPro = (await checkSubscription()) as boolean;
  return (
    <div className={cn("h-full relative bg-white")}>
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 rounded-br-lg rounded-tr-lg">
        <Sidebar isPro={isPro} apiLimitCount={apiLimitCount} />
      </div>
      <main className={cn("md:pl-64")}>
        <Navbar />
        <div className="max-h-screen rounded-tl-lg bg-white">{children}</div>
      </main>
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
