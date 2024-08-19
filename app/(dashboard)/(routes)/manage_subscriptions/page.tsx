import SubscriptionButton from "@/components/subscription-button";
import { checkSubscription } from "@/lib/subscription";

const Settings = async () => {
  const isPro = await checkSubscription();

  return (
    <div>
      <div className="flex flex-col items-start mb-8 px-8 gap-2">
        <h1 className="my-2 bg-gradient-to-t from-[#0A236D] to-[#5E85FE] bg-clip-text text-transparent text-xl md:text-3xl font-bold text-center mt-6">
          CopNarrative Subscription
        </h1>
        <p className="text-muted-foreground font-normal text-sm text-center">
          Find your subscription here!
        </p>
      </div>
      <div className="px-4 lg:px-8 space-y-4">
        <div className="text-muted-foreground text-sm">
          {isPro
            ? "You are currently on Pro Plan"
            : "You are currently on Free Plan"}
        </div>
        <SubscriptionButton isPro={isPro} />
      </div>
    </div>
  );
};

export default Settings;
