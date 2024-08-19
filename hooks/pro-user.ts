import { checkSubscription } from "@/lib/subscription";
import { create } from "zustand";

interface ProUserStore {
  isPro: boolean;
  setIsPro: () => void;
}

export const ProUser = create<ProUserStore>((set) => ({
  isPro: false,
  setIsPro: async () => {
    const pro = await checkSubscription();
    set({ isPro: pro });
  },
}));
