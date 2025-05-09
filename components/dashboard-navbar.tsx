"use server";

import { getApiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
import { UserButton, SignedIn, OrganizationSwitcher } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";

const Navbar = async () => {
  const apiLimitCount = (await getApiLimit()) as number;
  const isPro = (await checkSubscription()) as boolean;

  return (
    <div className="flex bg-[#161717] items-center justify-between p-6">
      <div className="flex items-center gap-4">
        <MobileSidebar isPro={isPro} apiLimitCount={apiLimitCount} />
        
       
        {/* Show Organization Switcher when signed in */}
        <SignedIn>
          <OrganizationSwitcher
            appearance={{
              elements: {
                organizationSwitcherTrigger: "text-white",
              },
            }}
          />
        </SignedIn>
      </div>

      {/* User profile menu */}
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
};

export default Navbar;