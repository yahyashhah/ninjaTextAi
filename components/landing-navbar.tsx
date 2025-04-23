'use client'

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/constants/landingpage";
import Image from "next/image";
import Link from "next/link";


const LandingNavbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <nav id="home" className="top-0 z-50 py-3 backdrop-blur-md border-b border-neutral-700/80">
      <div className="container px-4 mx-auto relative lg:text-sm">
        <div className="flex justify-between items-center">
          <Link href={"/"}>
          <div className="flex items-center flex-shrink-0">
            <Image src={"/mainlogo.png"} width={150} height={100} alt="Logo" />
            
          </div>
          </Link>
          <ul className="hidden lg:flex ml-14 space-x-12 text-white">
            {navItems.map((item, index) => (
              <li key={index}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="hidden lg:flex justify-center gap-x-4 items-center">
            <a href="/sign-in" className="py-2 px-3 border rounded-md text-white">
              Sign In
            </a>
            <a
              href="/sign-up"
              className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 drop-shadow-lg py-2 px-3 rounded-md text-white"
            >
              Start For Free
            </a>
          </div>
          <div className="lg:hidden md:flex flex-col justify-end text-white">
            <button onClick={toggleNavbar}>
              {mobileDrawerOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileDrawerOpen && (
          <div className="fixed right-0 z-30 bg-slate-900 w-full p-12 flex flex-col justify-center items-center lg:hidden text-white">
            <ul>
              {navItems.map((item, index) => (
                <li key={index} className="py-4 text-white">
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-y-4">
              <a href="/sign-in" className="py-2 px-3 border rounded-md text-center">
                Sign In
              </a>
              <a
                href="/sign-up"
                className="py-2 px-3 rounded-md bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 drop-shadow-lg"
              >
                Start For Free
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;