import { UserProfile } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <UserProfile
      appearance={{
        elements: {
          rootBox: "w-full",
          cardBox: "w-full",
        },
      }}
    />
  );
};

export default page;
