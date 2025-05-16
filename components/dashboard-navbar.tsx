"use server";

import { getApiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
import { UserButton, SignedIn, OrganizationSwitcher } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";
import { auth } from "@clerk/nextjs/server";
import { getServerOrgId } from "@/lib/get-org-id";

const Navbar = async () => {
  const apiLimitCount = (await getApiLimit()) as number;
  const isPro = (await checkSubscription()) as boolean;

  // 👇 Get the user's org membership status
  const { userId } = auth();
  const orgId = await getServerOrgId();

  return (
    <div className="flex bg-[#161717] items-center justify-between p-6">
      <div className="flex items-center gap-4">
        <MobileSidebar isPro={isPro} apiLimitCount={apiLimitCount} />

        {/* Only show OrganizationSwitcher if user is in an org */}
        <SignedIn>
          {orgId && ( // 👈 Only renders if user is in an org
            <OrganizationSwitcher
              afterSelectOrganizationUrl="/manage_subscriptions"
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "text-white",
                  // 👇 Targets ONLY the "Create Organization" button
                  organizationSwitcherPopoverActionButton__createOrganization:
                    "hidden",
                },
              }}
            />
          )}
        </SignedIn>
      </div>

      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
};

export default Navbar;
