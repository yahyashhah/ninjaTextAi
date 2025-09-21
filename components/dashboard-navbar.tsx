"use server";

import { getApiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
import { UserButton, SignedIn, OrganizationSwitcher } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";
import ShowTutorialAgain from "./showTutorialAgain";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getServerOrgId } from "@/lib/get-org-id";
import { redirect } from "next/navigation";
import { RoleSwitcherButton } from "./role-switcher-button";

const Navbar = async () => {
  const apiLimitCount = (await getApiLimit()) as number;
  const isPro = (await checkSubscription()) as boolean;

  // 👇 Get the user's org membership status
  const { userId } = auth();
  const orgId = await getServerOrgId();

  if (!userId) redirect("/sign-in");

  // Check if user is an admin (super admin or org admin)
  const isAdmin = await checkIfUserIsAdmin(userId, orgId);

  return (
    <div className="flex bg-[#161717] items-center justify-between p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-4">
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

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:block">
          <ShowTutorialAgain userId={userId ?? undefined} />
        </div>
        
        {/* Show Role Switcher Button only for admins */}
        {isAdmin && (
          <RoleSwitcherButton />
        )}
        
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  );
};

// Helper function to check if user is admin
async function checkIfUserIsAdmin(userId: string, orgId: string | null): Promise<boolean> {
  try {
    // Get user data from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    // Check if user is super admin
    const isSuperAdmin = !!user.publicMetadata?.admin;
    if (isSuperAdmin) {
      return true;
    }

    // Check if user is organization admin
    if (orgId) {
      // Get user's organization memberships
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id,
      });
      
      const orgMembership = memberships.data.find(
        (membership: any) => membership.organization.id === orgId
      );
      
      // Check if user has admin role in this organization
      if (orgMembership) {
        const isOrgAdmin = orgMembership.role === "org:admin" || orgMembership.role === "admin";
        return isOrgAdmin;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export default Navbar;