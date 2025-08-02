"use server";

import { getApiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
import { UserButton, SignedIn, OrganizationSwitcher } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";
import ShowTutorialAgain from "./showTutorialAgain";
import { auth } from "@clerk/nextjs/server";
import { getServerOrgId } from "@/lib/get-org-id";
import { redirect } from "next/navigation";

const Navbar = async () => {
  const apiLimitCount = (await getApiLimit()) as number;
  const isPro = (await checkSubscription()) as boolean;

  // 👇 Get the user's org membership status
  const { userId } = auth();
  const orgId = await getServerOrgId();

  if (!userId) redirect("/sign-in");

  return (
    <div className="flex bg-[#161717] items-center justify-between p-4 md:p-6"> {/* Adjusted padding */}
      <div className="flex items-center gap-2 md:gap-4"> {/* Adjusted gap */}
        <MobileSidebar isPro={isPro} apiLimitCount={apiLimitCount} userId={userId} />
        
        <SignedIn>
          {orgId && (
            <OrganizationSwitcher
              afterSelectOrganizationUrl="/manage_subscriptions"
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "text-white",
                  organizationSwitcherPopoverActionButton__createOrganization: "hidden",
                },
              }}
            />
          )}
        </SignedIn>
      </div>

      <div className="hidden md:flex items-center gap-2 md:gap-4"> {/* Adjusted gap */}
        <ShowTutorialAgain 
          userId={userId ?? undefined} />
      </div>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
    </div>
  );
};

export default Navbar;
