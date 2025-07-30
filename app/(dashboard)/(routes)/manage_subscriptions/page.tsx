// app/(dashboard)/settings/page.tsx
import { OrgBillingCard } from "@/components/org-billing-card";
import { OrgMembersSelector } from "@/components/org-members-selector";
import FreePlanFallback from "@/components/FreePlanFallback";
import SubscriptionButton from "@/components/subscription-button";
import ProWelcomeModal from "@/components/ProWelcomeModal";
import { isOrgAdmin } from "@/lib/clerk-utils";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { checkOrgSubscription } from "@/lib/organization-billing";
import { getServerOrgId } from "@/lib/get-org-id";

const SettingsPage = async () => {
  const { userId } = auth();
  const orgId = await getServerOrgId();

  if (!userId) {
    return <div>Please sign in to view settings</div>;
  }

  // First check organization context
  if (orgId) { 
    const isAdmin = await isOrgAdmin(orgId, userId);
    const isOrgPro = await checkOrgSubscription(orgId);

    if (isAdmin) {
      return (
        <div className="p-6 bg-white">
          <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>
          <div className="grid gap-6">
            <OrgBillingCard />
          </div>
          <div className="mt-4">
            <OrgMembersSelector />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Organization Membership
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isOrgPro 
                ? "Your organization has a Pro subscription" 
                : "Your organization is on the Free Plan"}
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center space-y-4">
            <p className="text-sm text-gray-700">
              {isOrgPro
                ? "You have access to premium features through your organization"
                : "Ask your organization admin to upgrade for team features"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Individual user context
  const user = await prismadb.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      isPro: true,
      proAccessGrantedBy: true,
      subscription: {
        select: {
          stripeSubscriptionId: true,
          stripeCurrentPeriodEnd: true
        }
      }
    }
  });

  // Check if user has pro access through organization (even if not currently in org context)
  const hasOrgProAccess = user?.proAccessGrantedBy 
    ? await checkOrgSubscription(user.proAccessGrantedBy)
    : false;

  const isPro = user?.isPro || hasOrgProAccess;

  if (!isPro) {
    return <FreePlanFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 py-12 px-4">
      <ProWelcomeModal />
      <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h1 id="plan-selection" className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            NinjaTextAI Pro ✨
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            You're now on the <span className="font-semibold text-blue-600">Pro Plan</span>
          </p>
          {user?.proAccessGrantedBy && (
            <p className="text-sm text-gray-500 mt-1">
              Pro access granted by your organization
            </p>
          )}
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center space-y-4">
          <SubscriptionButton
            isPro={isPro}
            proAccessGrantedBy={user?.proAccessGrantedBy}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
