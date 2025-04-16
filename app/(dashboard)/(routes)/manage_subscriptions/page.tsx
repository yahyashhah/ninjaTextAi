import FreePlanFallback from "@/components/FreePlanFallback";
import SubscriptionButton from "@/components/subscription-button";
import ProWelcomeModal from "@/components/ProWelcomeModal";
import { checkSubscription } from "@/lib/subscription";
import { currentUser } from "@clerk/nextjs/server";

const Settings = async () => {
  const isPro = await checkSubscription();

  const user = await currentUser();
  if (!isPro) {
    return <FreePlanFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-[#0a0f23] dark:to-[#1e2a4a] py-12 px-4">
      <ProWelcomeModal />
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#10162f] shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-[#1e2a4a] backdrop-blur-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent">
            NinjaTextAI Pro ✨
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-2">
            You're now on the <span className="font-semibold text-blue-600 dark:text-blue-400">Pro Plan</span>. Unlock your creative power!
          </p>
        </div>
  
        <div className="bg-blue-50 dark:bg-[#18223c] p-6 rounded-xl border border-blue-100 dark:border-[#273356] text-center space-y-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Enjoy priority access, premium features, and more with your Pro subscription.
          </div>
          <SubscriptionButton isPro={isPro} />
        </div>
      </div>
    </div>
  );
}  

export default Settings;