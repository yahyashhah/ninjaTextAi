"use client";
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/mainlogo.png"; // Adjust the path to your logo

const Signup = () => {
  const searchParams = useSearchParams();
  const ref = searchParams.get("refId");
  const router = useRouter();
  const { toast } = useToast();

  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingVerfication, setPendingVerfication] = useState(false);

  if (!isLoaded) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || pendingVerfication) return;

    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password: password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerfication(true);
      toast({
        title: "Verification Sent",
        description: "Check your email for the verification code.",
      });
    } catch (error: any) {
      const clerkError = error?.errors?.[0];
      const errorCode = clerkError?.code;
      const message =
        errorCode === "session_exists"
          ? "You already have an active session. Please log out before attempting to login again."
          : clerkError?.message || error?.message || "Something went wrong.";

      toast({
        title: "Signup Failed",
        description: message,
        variant: "destructive",
      });
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onPressVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setVerifying(true);

    try {
      const completeSignup = await signUp.attemptEmailAddressVerification({ code });

      if (completeSignup.status !== "complete") {
        console.log("Error: Signup incomplete.");
        return;
      }

      if (signUp.status === "complete") {
        await setActive({ session: completeSignup.createdSessionId });

        await axios.post("/api/signup-success-after-refer", {
          refId: ref,
          userId: completeSignup.createdUserId,
        });

        router.push("/chat");
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Verification Failed",
        description: "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4 py-8">
      {/* Logo container with flex */}
      <div className="flex justify-center mb-4 w-full max-w-md">
        <div className="w-64 relative"> {/* Increased size to w-64 h-64 */}
          <Image
            src={logo}
            alt="App Logo"
            layout="responsive"
            width={256} // Adjusted width
          />
        </div>
      </div>

      {/* Modal */}
      <div className="max-w-md w-full bg-white p-8 shadow-2xl rounded-2xl">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          {pendingVerfication ? "Verify Your Email" : "Create Your Account"}
        </h2>

        {!pendingVerfication ? (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onPressVerify} className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Enter the code from email"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-600 hover:underline font-medium">
            Login instead
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;