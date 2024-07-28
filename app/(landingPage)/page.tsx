import LandingFeatures from "@/components/landing-features";
import LandingHero from "@/components/landing-hero";
import LandingNavbar from "@/components/landing-navbar";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* <LandingNavbar /> */}
      <LandingHero />
      <LandingFeatures />
    </main>
  );
}
