import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LandingHero = () => {
  return (
    <div
      id="home"
      className="min-h-screen flex flex-col items-center justify-center gap-y-8 px-4 sm:px-8 md:px-16 lg:px-32 mt-16 sm:mt-24 md:mt-32"
    >
      <h1 className="flex flex-col text-3xl sm:text-4xl gap-y-2 md:text-5xl px-12 md:px-16 lg:px-24 text-white font-bold text-center">
        Where Speed Meets Accuracy <span> in Police Reporting</span>
      </h1>
      <p className="mt-4 text-base sm:text-lg md:text-xl lg:text-2xl text-white font-light text-center">
        Streamline your police reporting with our advanced AI platform. <br />Easily
        dictate reports and receive accurate, comprehensive narratives
        instantly.
      </p>
      <Link href={"/sign-up"}>
        <Button className="flex items-center gap-x-2 sm:gap-x-3 w-fit px-4 py-2 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 drop-shadow-lg text-sm sm:text-base md:text-lg">
          Start for Free <ArrowRight />
        </Button>
      </Link>
      <Image
        className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 w-full max-w-3xl"
        src={"/heroimage.png"}
        width={920}
        height={654}
        alt="mainImage"
        layout="responsive"
      />
    </div>
  );
};

export default LandingHero;
