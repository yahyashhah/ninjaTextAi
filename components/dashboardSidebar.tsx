"use client";

import { sidebarRoutes } from "@/constants/dashboard";
import { cn } from "@/lib/utils";

import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import FreeCounter from "./free-counter";
// import FreeCounter from "./free-counter";

const monserrat = Montserrat({ weight: "600", subsets: ["latin"] });

interface SideBarProps {
  apiLimitCount: number;
  isPro: boolean;
}

const Sidebar = ({ apiLimitCount = 0, isPro = false }: SideBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="space-y-4 py-3 flex flex-col h-full bg-[#161717] text-white drop-shadow-xl">
      <div className="px-2 py-2">
        <Link
          href="/chat"
          className="flex justify-center mb-2 text-xl font-bold"
        >
        <Image src={'/mainlogo.png'} width={180} height={150} alt="mainlogo" />
        </Link>

        {sidebarRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm group flex p-3 my-1 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 hover:drop-shadow-xl hover:rounded-lg transition",
              pathname === route.href
                ? "text-white bg-[#3D3D3D] rounded-lg"
                : "text-white rounded-lg"
            )}
          >
            <div
              className={cn(
                "flex items-center flex-1",
                pathname === route.href
                  ? "text-white font-semibold"
                  : "font-normal"
              )}
            >
              <route.icon
                className={cn(
                  "h-5 w-5 mr-3 ",
                  pathname === route.href ? "text-[#5E85FE]" : "text-gray-500"
                )}
              />
              {route.label}
            </div>
          </Link>
        ))}
      </div>
      <FreeCounter isPro={isPro} apiLimitCount={apiLimitCount} />
    </div>
  );
};
export default Sidebar;
