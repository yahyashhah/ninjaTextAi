import Navbar from "@/components/dashboard-navbar";
import Sidebar from "@/components/dashboardSidebar";
import { cn } from "@/lib/utils";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={cn("h-full relative bg-[#161717]")}>
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 rounded-br-lg rounded-tr-lg">
        <Sidebar />
      </div>
      <main className={cn("md:pl-64")}>
        <Navbar />
        <div className="max-h-screen rounded-tl-lg bg-white">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
