"use client"
import React from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const LandingNarrative = () => {
  const router = useRouter();

  return (
    <div className="bg-white p-32">
      <div className="flex items-center justify-center">
        <div className="basis-1/2">
          <div className="flex flex-col gap-y-12 px-12">
            <h1 className="text-4xl font-bold">AI-Powered Efficiency in Police Reporting</h1>
            <p className="text-gray-500 font-light text-md">
              The main motive of the website is to revolutionize and simplify
              police reporting through advanced AI-powered tools. Our platform
              aims to streamline the documentation process, enhance accuracy,
              and ensure compliance with departmental guidelines.
            </p>
            <p className="text-gray-500 font-light text-md">
              By leveraging voice dictation and AI technology, we empower law
              enforcement professionals to efficiently create detailed and
              precise reports, ultimately improving operational efficiency and
              effectiveness in maintaining public safety.
            </p>
            <Button onClick={() => router.push("/sign-up")} className="flex items-center gap-x-2 w-fit px-4 bg-gradient-to-r text-md font-bold from-sky-600 via-sky-500 to-sky-600 drop-shadow-lg">Start For Free  <ArrowRight /></Button>
          </div>
        </div>
        <div className="flex basis-1/2 items-center justify-center ">
        <Image
        src={"/reportWriting.jpg"}
        width={450}
        height={450}
        alt="image"
        className="rounded-xl shadow-black/20 shadow-xl"
        />
        </div>
      </div>
    </div>
  );
};

export default LandingNarrative;
