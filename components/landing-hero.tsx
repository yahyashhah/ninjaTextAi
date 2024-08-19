import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LandingHero = () => {
  return (
    <div
      id="home"
      className="min-h-screen flex flex-col items-center justify-center gap-y-8 px-32 mt-32"
    >
      <h1 className="text-5xl text-white font-bold text-center">
        Where Speed Meets Accuracy <br />
        in Police Reporting
      </h1>
      <p className="mt-4 px-44 text-white font-light text-center">
        Streamline your police reporting with our advanced AI platform. Easily
        dictate reports and receive accurate, comprehensive narratives
        instantly.{" "}
      </p>
      <Link href={"/sign-up"}>
        <Button className="flex items-center gap-x-3 w-fit px-4 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 drop-shadow-lg">
        Start for Free <ArrowRight />
        </Button>
      </Link>
      <Image
        className="mt-8"
        src={"/heroimage.png"}
        width={950}
        height={830}
        alt="mainImage"
      />
    </div>
  );
};

export default LandingHero;
