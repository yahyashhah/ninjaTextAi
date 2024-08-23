import { footerAccess, footerHelp, footerPages } from "@/constants/landingpage";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const LandingFooter = () => {
  return (
    <div className="bg-white pt-12 sm:pt-24">
      <div className="flex flex-col md:flex-row justify-between px-4 sm:px-8 md:px-16 lg:px-32 py-6 sm:py-12 border-b-2">
        <div className="flex flex-col gap-y-4 mb-6 md:mb-0">
          <Image
            className="bg-gray-900 rounded-3xl px-2"
            src={'/mainlogo.png'}
            width={180}
            height={150}
            alt="mainlogo"
          />
          <p className="text-xs sm:text-sm font-normal text-gray-700">
            Web-ready documentation for seamless,
            efficient reporting anytime, anywhere.
          </p>
        </div>
        <div className="flex flex-col gap-y-4 mb-6 md:mb-0">
          <h1 className="font-semibold text-sm sm:text-base md:text-md lg:text-lg text-black">Pages</h1>
          {footerPages.map((item, index) => (
            <Link key={index} href={item.href} className="text-sm sm:text-base text-gray-600 hover:text-black">
              {item.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-y-4 mb-6 md:mb-0">
          <h1 className="font-semibold text-sm sm:text-base md:text-md lg:text-lg text-black">Help and Support</h1>
          {footerHelp.map((item, index) => (
            <Link key={index} href={item.href} className="text-sm sm:text-base text-gray-600 hover:text-black">
              {item.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-sm sm:text-base md:text-md lg:text-lg text-black">Access</h1>
          {footerAccess.map((item, index) => (
            <Link key={index} href={item.href} className="text-sm sm:text-base text-gray-600 hover:text-black">
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      <p className="text-center py-4 text-xs sm:text-sm">
        &copy;2024 NinjaText AI All Rights Reserved
      </p>
    </div>
  );
};

export default LandingFooter;
