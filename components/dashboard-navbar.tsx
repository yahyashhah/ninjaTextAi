"use server";

import { UserButton } from "@clerk/nextjs";

// import { UserButton } from "@clerk/nextjs";

const Navbar = async () => {
  return (
    <div className="flex bg-[#161717] items-center p-6">
      <div className="flex w-full justify-end">
        <UserButton />
        
      </div>
    </div>
  );
};
export default Navbar;
