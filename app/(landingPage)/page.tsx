import LandingFAQs from "@/components/landing-faq";
import LandingFeatures from "@/components/landing-features";
import LandingFooter from "@/components/landing-footer";
import LandingHero from "@/components/landing-hero";
import LandingNarrative from "@/components/landing-narrative";
import LandingNavbar from "@/components/landing-navbar";
import LandingPricing from "@/components/landing-pricing";

export default function Home() {
  return (
    <>
      <div className="relative min-h-screen w-full bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))] rounded-full"></div>
        <div className="relative z-10">
          <LandingNavbar />
          <LandingHero />
          <LandingFeatures />
          <LandingNarrative />
          <LandingPricing />
          <LandingFAQs />
          <LandingFooter />
        </div>
      </div>
    </>
  );
}
