import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import Image from "next/image";

const LandingNavbar = () => {
  return (
    <div className="flex items-center justify-between p-3 text-white px-32">
      <div className="flex">
        <Image src={'/mainlogo.png'} width={180} height={150} alt="mainlogo" />
      </div>
      <div className="flex gap-x-12">
        <Link className="text-md" href={"/"}>
          Home
        </Link>
        <Link href={"/#pricing"}>Pricing</Link>
        <Link href={"/#faqs"}>FAQ's</Link>
        <Link href={"/terms"}>Term & Condition</Link>
      </div>
      <div className="flex gap-x-4">
        <Link href={"/sign-in"}>
          <Button className="ring-1 ring-white hover:bg-white hover:text-black">
            Sign in
          </Button>
        </Link>
        <Link href={"/sign-up"}>
        <Button className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 drop-shadow-lg hover:text-black hover:bg-white">
          Sign up
        </Button>
        </Link>
      </div>
    </div>
  );
};

export default LandingNavbar;
