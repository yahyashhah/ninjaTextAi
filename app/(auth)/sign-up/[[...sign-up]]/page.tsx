"use client";
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

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
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerfication(true);

      toast({
        title: "Verification Sent",
        description: "Check your email for the verification code.",
      });
    } catch (error: any) {
      const clerkError = error?.errors?.[0]?.message;

      toast({
        title: "Signup Failed",
        description: clerkError
          ? clerkError
          : error?.message ?? "Something went wrong.",
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
      const completeSignup = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignup.status !== "complete") {
        console.log("Error: Signup incomplete.");
        return;
      }

      if (signUp.status === "complete") {
        await setActive({ session: completeSignup.createdSessionId });

        await axios.post("/api/signup-success-after-refer", {
          refId: ref,
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 shadow-lg rounded-lg">
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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading || pendingVerfication}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onPressVerify} className="space-y-6">
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
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;