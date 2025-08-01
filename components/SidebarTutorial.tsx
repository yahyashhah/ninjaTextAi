"use client";

import { useEffect, useState, useRef } from "react";
import { Steps } from "intro.js-react";
import "intro.js/introjs.css";
import { sidebarRoutes } from "@/constants/dashboard";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function SidebarTutorial() {
  const [stepsEnabled, setStepsEnabled] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elementsReady, setElementsReady] = useState(false);
  const introRef = useRef<any>(null);
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const showTutorial = searchParams.get("tutorial") === "true";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isInitialized, setIsInitialized] = useState(false);

  // Define page-specific elements to highlight for mobile
  const pageElements: Record<string, string> = {
    "/chat": "#new-report-button",
    "/filing_cabinet": "#file-list",
    "/templates_page": "#template-card",
    "/account_settings": "#profile-section",
    "/manage_subscriptions": "#plan-selection",
    "/history": "#history-list",
    "/refer": "#referral-input"
  };

  // Mobile steps with guaranteed navigation
  const mobileSteps = sidebarRoutes.map((route, index) => ({
    element: pageElements[route.href] || 'body',
    intro: mobileTooltipContent(route.label, route.href, index + 1, sidebarRoutes.length),
    position: index === sidebarRoutes.length - 1 ? 'top' : 'bottom',
    tooltipClass: 'mobile-tooltip',
    highlightClass: 'mobile-highlight'
  }));

  // Desktop steps
  const desktopSteps = sidebarRoutes.map((route, index) => ({
    element: `#sidebar-${route.label.replace(/\s+/g, '-').toLowerCase()}`,
    intro: desktopTooltipContent(route.label, index + 1, sidebarRoutes.length),
    position: 'right',
    tooltipClass: 'desktop-tooltip',
    highlightClass: 'desktop-highlight'
  }));

  const steps = isMobile ? mobileSteps : desktopSteps;

  // iOS Safari fix - ensure elements are interactable
  const forceElementInteraction = () => {
    if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const elements = document.querySelectorAll(steps[currentStep]?.element || '');
      elements.forEach(el => {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
      });
    }
  };

  // Check if elements exist before enabling steps
  useEffect(() => {
    if (stepsEnabled) {
      const checkElements = () => {
        const currentStepElement = steps[currentStep]?.element;
        if (currentStepElement) {
          const element = document.querySelector(currentStepElement);
          if (element) {
            setElementsReady(true);
            forceElementInteraction();
            return;
          }
        }
        setTimeout(checkElements, 100);
      };
      checkElements();
    }
  }, [stepsEnabled, currentStep, steps]);

  // Main tutorial initialization
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !user) return;

    const savedStep = sessionStorage.getItem('tutorialCurrentStep');
    const hasSeenTutorial = user.publicMetadata?.hasSeenTutorial as boolean || false;
    const forceTutorial = searchParams.get("force") === "true";
    const shouldShowTutorial = (showTutorial && !hasSeenTutorial) || forceTutorial;

    if (shouldShowTutorial) {
      const delay = !hasSeenTutorial ? (isMobile ? 1000 : 1500) : 0;
      const timer = setTimeout(() => {
        setCurrentStep(savedStep ? parseInt(savedStep) : 0);
        setStepsEnabled(true);
        setIsInitialized(true);
        
        if (!forceTutorial) {
          fetch('/api/update-user-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              metadata: { hasSeenTutorial: true }
            })
          });
        }

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("tutorial");
        newUrl.searchParams.delete("force");
        window.history.replaceState({}, '', newUrl.toString());
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, userId, showTutorial, user, searchParams, isMobile]);

  // Handle navigation
  const handleBeforeChange = async (nextStepIndex: number) => {
    if (isMobile) {
      const nextRoute = sidebarRoutes[nextStepIndex];
      if (pathname !== nextRoute.href) {
        sessionStorage.setItem('tutorialCurrentStep', nextStepIndex.toString());
        setStepsEnabled(false);
        
        router.replace(`${nextRoute.href}?tutorial=true&force=true`);
        
        // Wait for navigation to complete
        await new Promise<void>(resolve => {
          const checkNavigation = () => {
            if (pathname === nextRoute.href) {
              resolve();
            } else {
              setTimeout(checkNavigation, 50);
            }
          };
          checkNavigation();
        });
        
        return false;
      }
    }
    
    setCurrentStep(nextStepIndex);
    return undefined;
  };

  // iOS Safari specific fixes
  useEffect(() => {
    if (isInitialized && stepsEnabled) {
      // Force tooltip to show on iOS
      const showTooltip = () => {
        if (introRef.current && typeof introRef.current.updateStep === 'function') {
          introRef.current.updateStep(currentStep);
        }
      };
      
      // Add slight delay for iOS
      const timer = setTimeout(showTooltip, 300);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, stepsEnabled, currentStep]);

  return (
    <>
      <Steps
        enabled={stepsEnabled && elementsReady}
        steps={steps}
        initialStep={currentStep}
        onExit={() => {
          setStepsEnabled(false);
          setCurrentStep(0);
          setIsInitialized(false);
        }}
        onStart={(intro) => {
          introRef.current = intro;
          setCurrentStep(0);
          sessionStorage.removeItem('tutorialCurrentStep');
        }}
        onBeforeChange={handleBeforeChange}
        onAfterChange={(nextStepIndex) => {
          setCurrentStep(nextStepIndex);
          forceElementInteraction();
        }}
        options={{
          nextLabel: 'Next →',
          prevLabel: '← Back',
          doneLabel: 'Got it!',
          skipLabel: 'Skip',
          overlayOpacity: isMobile ? 0.4 : 0.6,
          showProgress: true,
          showBullets: true,
          exitOnEsc: true,
          zIndex: 9999,
          exitOnOverlayClick: false,
          keyboardNavigation: true,
          disableInteraction: false,
          scrollToElement: true,
          positionPrecedence: isMobile ? ['bottom', 'top'] : ['right', 'left', 'bottom', 'top'],
          tooltipPosition: 'fixed',
          scrollPadding: isMobile ? 20 : 0,
          highlightClass: isMobile ? 'mobile-highlight' : 'desktop-highlight'
        }}
      />
      
      <style jsx global>{`
        /* Base tooltip styles */
        .introjs-tooltip {
          border-radius: 0.75rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          background-color: #1F2937 !important;
          border: 1px solid #374151 !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
        }
        
        /* Mobile specific styles */
        .mobile-tooltip {
          position: fixed !important;
          bottom: 10px !important;
          left: 10px !important;
          top: 40% !important;
          right: 10px !important;
          transform: none !important;
          width: auto !important;
          max-width: 100% !important;
          max-height: 50vh !important;
          padding: 1rem !important;
          margin: 0 !important;
          z-index: 9999 !important;
          overflow-y: auto !important;
        }
        
        /* Last step at top */
        .mobile-tooltip[data-position="top"] {
          top: 16px !important;
          bottom: auto !important;
        }
        
        /* Compact content styling */
        .mobile-tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .mobile-tooltip .introjs-tooltip-title {
          font-size: 1.1rem !important;
          margin-bottom: 0rem !important;
        }
        
        .mobile-tooltip .introjs-tooltiptext {
          font-size: 0.9rem !important;
          line-height: 1.4 !important;
          margin-bottom: 0.2rem !important;
          padding: 10px !important;
        }
        
        .mobile-tooltip .step-counter {
          font-size: 0.8rem !important;
          color: #9CA3AF !important;
          margin-bottom: 0.25rem !important;
        }
        
        /* Smaller buttons on mobile */
        .mobile-tooltip .introjs-button {
          padding: 0.4rem 0.5rem !important;
          font-size: 0.85rem !important;
          margin: 0.15rem !important;
        }
        
        /* Adjust progress bar */
        .mobile-tooltip .introjs-progress {
          margin-bottom: 0.5rem !important;
        }
        
        /* Desktop specific styles */
        .desktop-tooltip {
          position: fixed !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          min-width: 300px !important;
          max-width: 380px !important;
          padding: 1.5rem !important;
          margin: 0 !important;
          z-index: 9999 !important;
        }
        
        /* Overlay styles */
        .introjs-overlay {
          background-color: rgba(0, 0, 0, 0.4) !important;
          z-index: 9998 !important;
          pointer-events: none !important;
        }
        
        /* Highlight layer */
        .introjs-helperLayer {
          border-radius: 0.5rem !important;
          border: 2px solid #5E85FE !important;
          box-shadow: 0 0 0 10000px rgba(0, 0, 0, 0.4) !important;
          z-index: 9995 !important;
          pointer-events: none !important;
        }
        
        /* iOS-specific highlight fix */
        .mobile-highlight {
          position: relative !important;
          z-index: 9998 !important;
          -webkit-tap-highlight-color: rgba(0,0,0,0);
        }
        
        .mobile-highlight:focus {
          outline: none;
        }
        
        /* Tooltip reference layer */
        .introjs-tooltipReferenceLayer {
          position: fixed !important;
          z-index: 9995 !important;
          pointer-events: none !important;
        }
        
        /* Buttons */
        .introjs-button {
          background-color: #5E85FE !important;
          color: white !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem 1rem !important;
          margin: 0.25rem !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          border: none !important;
          text-shadow: none !important;
          transition: all 0.2s ease !important;
        }
        
        /* Back button style */
        .introjs-prevbutton {
          background-color: transparent !important;
          border: 1px solid #5E85FE !important;
          color: #5E85FE !important;
        }
        
        .introjs-prevbutton:hover {
          background-color: rgba(94, 133, 254, 0.1) !important;
        }
        
        /* Next button style */
        .introjs-nextbutton:hover {
          background-color: #4a6dc7 !important;
        }
        
        /* Skip button style */
        .introjs-skipbutton {
          background-color: transparent !important;
          color: #9CA3AF !important;
          font-size: 0.875rem !important;
        }
        
        .introjs-skipbutton:hover {
          color: white !important;
          background-color: #374151 !important;
        }
        
        /* Progress bar */
        .introjs-progress {
          background-color: rgba(255, 255, 255, 0.3) !important;
          margin-bottom: 0.75rem !important;
        }
        
        .introjs-progressbar {
          background-color: #5E85FE !important;
        }
        
        /* Step counter */
        .introjs-progress-steps {
          display: block !important;
          text-align: center !important;
          margin-bottom: 0.5rem !important;
          font-size: 0.875rem !important;
          color: #9CA3AF !important;
        }
        
        /* Bullets */
        .introjs-bullets ul li a {
          background: rgba(255, 255, 255, 0.4) !important;
        }
        
        .introjs-bullets ul li a.active {
          background: #5E85FE !important;
        }
        
        /* Text content */
        .introjs-tooltip-title {
          font-size: ${isMobile ? '1.1rem' : '1.35rem'} !important;
          margin-bottom: 0.2rem !important;
          color: white !important;
          font-weight: 600 !important;
        }
        
        .introjs-tooltiptext {
          color: #E5E7EB !important;
          font-size: ${isMobile ? '0.9rem' : '1rem'} !important;
          line-height: ${isMobile ? '1.4' : '1.6'} !important;
          padding: 0.1rem !important;
        }
        
        /* Tip text */
        .introjs-tooltip .tip-text {
          font-size: 0.875rem !important;
          color: rgba(94, 133, 254, 0.8) !important;
          margin-top: 0.5rem !important;
          font-style: italic !important;
        }
        
        .introjs-tooltip-header{
        padding: 0rem !important;
        }
        
        /* Tooltip content container */
        .introjs-tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </>
  );
}

function mobileTooltipContent(label: string, href: string, currentStep: number, totalSteps: number): string {
  const descriptions: Record<string, string> = {
    "/chat": "Start here to create a new report. Tap the microphone to dictate or type your report.",
    "/filing_cabinet": "All your saved reports are organized here. Tap any report to view or edit it.",
    "/templates_page": "Create or select templates to standardize your reports. Tap a template to use it.",
    "/account_settings": "Update your profile, preferences, and security settings here.",
    "/manage_subscriptions": "View or change your subscription plan. Upgrade for more features.",
    "/history": "Review your recent activity and recover unsaved drafts here.",
    "/refer": "Share with colleagues and earn rewards when they sign up."
  };

  return `
    <div class="mobile-tooltip-content">
      <div class="step-counter">Step ${currentStep} of ${totalSteps}</div>
      <h3 class="introjs-tooltip-title">${label}</h3>
      <p class="introjs-tooltiptext">${descriptions[href] || "This section helps you manage your content."}</p>
    </div>
  `;
}

function desktopTooltipContent(label: string, currentStep: number, totalSteps: number): string {
  const descriptions: Record<string, string> = {
    "New Report": "Start by selecting the right report type and a saved template to match your needs or department protocols to streamline your report.",
    "Filing Cabinet": "All your finalized and saved notes live here. Browse, review, or export your completed documentation anytime.",
    "Templates": "Customize your documentation to match your department's standards. Build reusable templates with the structure and language you need.",
    "Account Settings": "Manage your profile, preferences, and security settings here. Update personal info, change your password, or configure your experience.",
    "Manage Subscriptions": "View your current subscription plan, upgrade, or manage billing details in one place. Stay in control of your access and features.",
    "History": "Find all your documentation here — including auto-saved drafts and unsaved notes. If you accidentally closed a note before saving, you can retrieve it.",
    "Refer a friend": "Know someone who could benefit from this tool? Use this feature to refer a colleague and help streamline their reporting process too."
  };

  return `
    <div class="space-y-4">
      <div class="step-counter">Step ${currentStep} of ${totalSteps}</div>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-[#5E85FE]/20">
          ${getIconForRoute(label)}
        </div>
        <h3 class="introjs-tooltip-title">${label}</h3>
      </div>
      <p class="introjs-tooltiptext">${descriptions[label] || "This section helps you manage your account and content efficiently."}</p>
      <div class="pt-2 border-t border-gray-600">
        <p class="tip-text">Tip: Click to navigate</p>
      </div>
    </div>
  `;
}

function getIconForRoute(label: string): string {
  const icons: Record<string, string> = {
    "New Report": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#5E85FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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