// components/SidebarTutorial.tsx
"use client";

import { useEffect, useState } from "react";
import { Steps } from "intro.js-react";
import "intro.js/introjs.css";
import { sidebarRoutes } from "@/constants/dashboard";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";

export default function SidebarTutorial() {
  const [stepsEnabled, setStepsEnabled] = useState(false);
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const showTutorial = searchParams.get("tutorial") === "true";

  const steps = sidebarRoutes.map((route) => ({
    element: `#sidebar-${route.label.replace(/\s+/g, '-').toLowerCase()}`,
    intro: `
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-[#5E85FE]/20">
            ${getIconForRoute(route.label)}
          </div>
          <h3 class="text-xl font-bold text-white">${route.label}</h3>
        </div>
        <p class="text-gray-100 text-sm leading-relaxed">${getDescriptionForRoute(route.label)}</p>
        <div class="pt-2 border-t border-gray-600">
          <p class="text-xs text-gray-300 italic">Tip: Click to navigate</p>
        </div>
      </div>
    `,
    position: 'right',
    tooltipClass: 'custom-tooltip'
  }));

  useEffect(() => {
  if (!isLoaded || !isSignedIn || !userId || !user) return;

  const hasSeenTutorial = user.publicMetadata?.hasSeenTutorial as boolean || false;
  const forceTutorial = searchParams.get("force") === "true";
  
  const shouldShowTutorial = (showTutorial && !hasSeenTutorial) || forceTutorial;

  if (shouldShowTutorial) {
    // Different delay for first-time vs forced tutorial
    const delay = !hasSeenTutorial ? 1000 : 0;
    
    const timer = setTimeout(() => {
      setStepsEnabled(true);
      
      fetch('/api/update-user-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          metadata: { hasSeenTutorial: true }
        })
      }).catch(error => console.error("Failed to update user metadata:", error));

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("tutorial");
      newUrl.searchParams.delete("force");
      window.history.replaceState({}, '', newUrl.toString());
    }, delay);

    return () => clearTimeout(timer);
  }
}, [isLoaded, isSignedIn, userId, showTutorial, user, searchParams]);

  return (
    <>
      <Steps
        enabled={stepsEnabled}
        steps={steps}
        initialStep={0}
        onExit={() => setStepsEnabled(false)}
        options={{
          nextLabel: 'Next →',
          prevLabel: '← Back',
          doneLabel: 'Got it!',
          skipLabel: 'Skip',
          overlayOpacity: 0.8,
          showProgress: true,
          showBullets: true,
          exitOnEsc: true,
          exitOnOverlayClick: false,
          keyboardNavigation: true,
          disableInteraction: true,
          tooltipClass: 'bg-gray-800 text-white rounded-xl shadow-2xl border border-gray-700 min-w-[300px] max-w-[380px] w-full',
          highlightClass: 'rounded-lg border-2 border-[#5E85FE] shadow-lg',
          buttonClass: 'bg-[#5E85FE] hover:bg-[#4a6dc7] text-white rounded-lg px-5 py-2 m-1 font-medium transition-all',
          skipButtonClass: 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg px-5 py-2 m-1 font-medium transition-all',
          scrollToElement: false,
          positionPrecedence: ['right', 'left', 'bottom', 'top'],
          tooltipPosition: 'fixed'
        }}
      />
      <style jsx global>{`
        .introjs-tooltip {
          border-radius: 0.75rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          margin: 20px !important;
          margin-left: 30px !important;
          padding: 1.5rem !important;
          position: fixed !important;
          z-index: 99999 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          max-height: none !important;
          overflow: visible !important;
          background-color: #1F2937 !important;
          border: 1px solid #374151 !important;
        }
        
        .introjs-tooltipbuttons {
          padding: 0.5rem 1.5rem 1rem !important;
          border-top: 1px solid #374151 !important;
        }
        
        .introjs-arrow {
          display: none !important;
        }
        
        .introjs-tooltipReferenceLayer {
          padding: 0 !important;
        }
        
        .introjs-tooltip-title {
          font-size: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          padding: 0 1rem !important;
          color: white !important;
        }
        
        .introjs-helperLayer {
          border-radius: 0.5rem !important;
          box-shadow: 
            0 0 0 10000px rgba(0, 0, 0, 0.85), 
            0 0 15px rgba(255, 255, 255, 0.5) !important;
        }
        
        .introjs-progress {
          height: 4px !important;
          background-color: rgba(255, 255, 255, 0.3) !important;
        }
        
        .introjs-progressbar {
          background-color: #5E85FE !important;
        }
        
        .introjs-bullets ul li a {
          background: rgba(255, 255, 255, 0.4) !important;
        }
        
        .introjs-bullets ul li a.active {
          background: #5E85FE !important;
        }
        
        .introjs-tooltiptext {
          color: #E5E7EB !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        .introjs-button {
          font-weight: 500 !important;
          text-shadow: none !important;
        }
        
        .introjs-skipbutton {
          color: #9CA3AF !important;
        }
        
        .introjs-skipbutton:hover {
          color: white !important;
        }
      `}</style>
    </>
  );
}

function getDescriptionForRoute(label: string): string {
  const descriptions: Record<string, string> = {
    "New Report": "Start by selecting the right report type and a saved template to match your needs or department protocols to streamline your report. When you're ready, tap the Record button to begin dictating — our NinjaText will handle the rest, turning your speech into a clear, professional note.",
    "Filing Cabinet": "All your finalized and saved notes live here. Browse, review, or export your completed documentation anytime. Think of it as your digital filing cabinet — organized, secure, and always accessible.",
    "Templates": "Customize your documentation to match your department's standards. Build reusable templates with the structure and language you need, or choose from existing ones when creating a new note. Templates help streamline your workflow and ensure every report is consistent.",
    "Account Settings": "Manage your profile, preferences, and security settings here. Update personal info, change your password, or configure your experience to suit how you work.",
    "Manage Subscriptions": "View your current subscription plan, upgrade, or manage billing details in one place. Stay in control of your access and features.",
    "History": "Find all your documentation here — including auto-saved drafts and unsaved notes. If you accidentally closed a note before saving, you can retrieve it from your history.",
    "Refer a friend": "Know someone who could benefit from this tool? Use this feature to refer a colleague and help streamline their reporting process too. Referrals will unlock rewards or benefits."
  };

  return descriptions[label] || "This section helps you manage your account and content efficiently.";
}

function getIconForRoute(label: string): string {
  const icons: Record<string, string> = {
    "New AI Chat": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>`,
    "Filing Cabinet": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>`,
    "Templates": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>`,
    "Account Settings": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>`,
    "Manage Subscriptions": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>`,
    "History": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    "Refer a friend": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>`
  };

  return icons[label] || `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`;
}