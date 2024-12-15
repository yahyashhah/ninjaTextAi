// import { SignUp } from "@clerk/nextjs";

// export default function Page() {
//     return (
//         <div className="w-full min-h-screen flex items-center justify-center">
//           <SignUp />
//         </div>
//       );
//     }

"use client";
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

const Signup = () => {
  const searchParams = useSearchParams(); // Replaces router.query
  const ref = searchParams.get("refId"); // Get the ref query parameter
  const router = useRouter();
  console.log(ref);
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerfication, setPendingVerfication] = useState(false);

  if (!isLoaded) {
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) {
      return;
    }
    try {
      await signUp.create({ emailAddress: email, password: password });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setPendingVerfication(true);
    } catch (error) {
      console.log(error);
    }
  }

  async function onPressVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignup = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignup.status !== "complete") {
        console.log("error signup");
      }

      if (signUp.status === "complete") {
        await setActive({ session: completeSignup.createdSessionId });
        const response = await axios.post("/api/signup-success-after-refer", {
          refId: ref,
        });
        router.push("/chat");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 shadow-lg rounded-lg">
        {/* <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          {pendingVerification ? "Verify Your Email" : "Create Your Account"}
        </h1> */}

        {!pendingVerfication ? (
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        ) : (
          <form className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                placeholder="Enter the code sent to your email"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={onPressVerify}
            >
              Verify Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;
