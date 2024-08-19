import { footerAccess, footerHelp, footerPages } from "@/constants/landingpage";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const LandingFooter = () => {
  return (
    <div className="bg-white pt-24">
      <div className="flex justify-between px-32 py-12 border-b-2 ">
        <div className="flex flex-col gap-y-4">
        <Image className="bg-gray-900 rounded-3xl px-2" src={'/mainlogo.png'} width={180} height={150} alt="mainlogo" />
          <p className="text-sm font-normal text-gray-700">
            NinjaText-AI: web-ready incident documentation for seamless,<br />
            efficient reporting anytime, anywhere.
          </p>
        </div>
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-md text-black">Pages</h1>
          {
            footerPages.map((item, index) => (
                <Link key={index} href={item.href}>{item.name}</Link>
            ))
          }
          
        </div>
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-md text-black">Help and Support</h1>
          {
            footerHelp.map((item, index) => (
                <Link key={index} href={item.href}>{item.name}</Link>
            ))
          }
          
        </div>
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-md text-black">Access</h1>
          {
            footerAccess.map((item, index) => (
                <Link key={index} href={item.href}>{item.name}</Link>
            ))
          }
          
        </div>
        
      </div>
      <p className="text-center py-6">&copy;2024 CopNarrative. All Rights Reserved</p>
    </div>
  );
};

export default LandingFooter;
