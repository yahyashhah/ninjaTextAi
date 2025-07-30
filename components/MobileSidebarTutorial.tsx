"use client";

import { useEffect, useState, useRef } from "react";
import { Steps } from "intro.js-react";
import "intro.js/introjs.css";
import { sidebarRoutes } from "@/constants/dashboard";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function MobileSidebarTutorial({ 
  onComplete,
  onStart
}: {
  onComplete: () => void;
  onStart: () => void;
}) {
  const [stepsEnabled, setStepsEnabled] = useState(false);
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const tutorialActive = useRef(true); // Start as true since we're beginning tutorial
  const elementsVerified = useRef(false);
  const stepsInstance = useRef<any>(null);
  const initialized = useRef(false);

  const steps = [
    {
      intro: `
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-[#5E85FE]/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white">Mobile Navigation</h3>
          </div>
          <p class="text-gray-100 text-xs leading-relaxed">
            Tap the menu icon to open this sidebar anytime.
          </p>
        </div>
      `,
      position: 'bottom'
    },
    ...sidebarRoutes.map((route) => ({
      element: `#sidebar-${route.label.replace(/\s+/g, '-').toLowerCase()}`,
      intro: `
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-[#5E85FE]/20">
              ${getMobileIconForRoute(route.label)}
            </div>
            <h3 class="text-lg font-bold text-white">${route.label}</h3>
          </div>
          <p class="text-gray-100 text-xs leading-relaxed">${getMobileDescriptionForRoute(route.label)}</p>
        </div>
      `,
      position: 'bottom'
    }))
  ];

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !user || initialized.current) return;
    
    initialized.current = true;
    console.log("[MobileTutorial] Initializing tutorial");
    onStart();
    
    // Start checking for elements immediately
    const checkElements = () => {
      const missingElements = steps
        .filter(step => 'element' in step)
        .filter(step => !document.querySelector(step.element));

      if (missingElements.length === 0) {
        console.log("[MobileTutorial] All elements found");
        elementsVerified.current = true;
        setStepsEnabled(true);
        return;
      }

      console.log("[MobileTutorial] Missing elements:", missingElements.map(s => s.element));
      setTimeout(checkElements, 100);
    };

    checkElements();
  }, [isLoaded, isSignedIn, userId, user]);

  const handleBeforeChange = (nextStepIndex: number, nextElement: Element) => {
    console.log(`[MobileTutorial] Moving to step ${nextStepIndex}`);
    // You can optionally return false to prevent change, or just return void
  };

  const handleExit = () => {
    console.log("[MobileTutorial] Exit triggered");
    if (tutorialActive.current) {
      console.log("[MobileTutorial] Tutorial still active - preventing exit");
      return false;
    }
    console.log("[MobileTutorial] Allowing exit");
    setStepsEnabled(false);
    onComplete();
    return true;
  };

  const handleComplete = () => {
    console.log("[MobileTutorial] Tutorial completed");
    tutorialActive.current = false;
    setStepsEnabled(false);
    
    if (user && !user.publicMetadata?.hasSeenTutorial) {
      updateMetadata();
    }
    
    onComplete();
  };

  const updateMetadata = async () => {
    try {
      const response = await fetch('/api/update-user-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          metadata: { hasSeenTutorial: true }
        })
      });

      if (!response.ok) throw new Error('Update failed');
      console.log("[MobileTutorial] Metadata updated successfully");
    } catch (error) {
      console.error("[MobileTutorial] Metadata update error:", error);
    }
  };

  return (
    <Steps
      enabled={stepsEnabled}
      steps={steps}
      initialStep={0}
      onExit={handleExit}
      onBeforeChange={handleBeforeChange}
      onComplete={handleComplete}
      options={{
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Got it!',
        showProgress: true,
        showBullets: true,
        exitOnEsc: false,
        exitOnOverlayClick: false,
        disableInteraction: true,
        tooltipClass: 'mobile-tutorial-tooltip',
        highlightClass: 'mobile-tutorial-highlight',
        positionPrecedence: ['bottom', 'top']
      }}
    />
  );
}

function getMobileDescriptionForRoute(label: string): string {
  const descriptions: Record<string, string> = {
    "New Report": "Start dictating reports quickly by selecting a template first.",
    "Filing Cabinet": "Access all your saved reports and documents here.",
    "Templates": "Create or use templates to standardize your reports.",
    "Account Settings": "Update your profile and preferences.",
    "Manage Subscriptions": "View or change your subscription plan.",
    "History": "Find your recent and unsaved reports here.",
    "Refer a friend": "Share with colleagues and get rewards."
  };
  return descriptions[label] || "Access this feature from the mobile menu.";
}

function getMobileIconForRoute(label: string): string {
  const icons: Record<string, string> = {
    "New Report": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>`,
    "Filing Cabinet": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>`,
    "Templates": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>`,
    "Account Settings": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
    "Manage Subscriptions": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>`,
    "History": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    "Refer a friend": `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>`
  };
  return icons[label] || `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
}