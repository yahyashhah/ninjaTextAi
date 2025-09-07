// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { userId } = auth();
  
  if (userId) {
    // Check if user is admin
    try {
      const user = await clerkClient.users.getUser(userId);
      const isAdmin = !!user.publicMetadata?.admin;
      
      // Redirect to admin page if user is admin, otherwise to default URL
      if (isAdmin) {
        redirect('/admin');
      } else {
        const redirectUrl = searchParams.redirect_url || '/chat?tutorial=true';
        redirect(redirectUrl);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      const redirectUrl = searchParams.redirect_url || '/chat?tutorial=true';
      redirect(redirectUrl);
    }
  }

  // For non-authenticated users, use a redirect URL that will handle admin detection
  const redirectUrl = searchParams.redirect_url || '/chat?tutorial=true';
  
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "w-full"
          }
        }}
        // Use a special route that will check admin status after sign-in
        redirectUrl="/redirect-handler"
      />
    </div>
  );
}