// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { userId } = auth();
  const redirectUrl = searchParams.redirect_url || '/chat?tutorial=true';
  
  if (userId) {
    redirect(redirectUrl);
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "w-full"
          }
        }}
        redirectUrl={redirectUrl}
      />
    </div>
  );
}