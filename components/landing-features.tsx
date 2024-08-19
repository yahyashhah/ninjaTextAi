import Image from "next/image";
import React from "react";

const LandingFeatures = () => {
  return (
    <div id="features" className="flex flex-col items-center justify-center px-32 text-black -mt-72 z-10 relative bg-white rounded-tl-3xl rounded-tr-3xl min-h-screen">
      <div className=" flex flex-col gap-y-4 text-center mt-12">
        <h5 className="text-gray-500 font-semibold">Features</h5>
        <h2 className="text-black text-3xl font-bold">
          Dictate, Document, Deliver! <br />
          Simplify Police Reporting with AI.
        </h2>
      </div>

      <div className="flex w-full bg-[#EFF2FB] h-64 rounded-3xl p-4 mt-12 drop-shadow-lg">
        <div className="basis-1/2 p-4 pl-6">
        <Image src={'/pic1.jpg'} width={230} height={230} alt="pic1" className="rounded-tl-3xl rounded-tr-3xl" />
        </div>
        <div className="basis-1/2 px-12">
          <div className="w-full h-full flex flex-col items-center justify-center gap-y-2">
            <h1 className="text-xl font-bold">
              Accurate reporting as per your department guidelines.
            </h1>
            <p className="text-gray-500 font-light">
              Our platform ensures precise documentation aligned with your
              department's protocols and guidelines.{" "}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full bg-[#EFF2FB] h-64 rounded-3xl p-4 mt-12 drop-shadow-lg">
        <div className="basis-1/2 px-12">
          <div className="w-full h-full flex flex-col items-center justify-center gap-y-2">
            <h1 className="text-xl font-bold">
              Voice-Powered Efficiency Streamline Your Narrations
            </h1>
            <p className="text-gray-500 font-light">
              Experience the future of documentation with our advanced
              voice-powered platform.
            </p>
          </div>
        </div>
        <div className="basis-1/2 p-4 pr-6 flex justify-end">
        <Image src={'/pic2.jpg'} width={260} height={260} alt="pic1" className="rounded-bl-3xl rounded-br-3xl" />
        </div>
      </div>

      <div className="flex w-full bg-[#EFF2FB] h-64 rounded-3xl p-4 mt-12 drop-shadow-lg">
      <div className="basis-1/2 p-4 pl-6">
        <Image src={'/pic3.png'} width={260} height={260} alt="pic1" className="rounded-tl-3xl rounded-tr-3xl" />
        </div>
        <div className="basis-1/2 px-12">
          <div className="w-full h-full flex flex-col justify-center gap-y-2">
            <h1 className="text-xl font-bold">
              Copy, Regenerate, and Export with Ease
            </h1>
            <p className="text-gray-500 font-light">
              Effortlessly manage reports with our comprehensive tools:
              duplicate for editing or reference, update content with AI
              precision, and export seamlessly in DOCX and PDF formats for easy
              sharing and archival.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingFeatures;
