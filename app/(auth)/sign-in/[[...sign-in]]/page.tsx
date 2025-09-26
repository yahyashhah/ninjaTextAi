// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { userId } = auth();
  if (userId) {
    try {
      console.log("👤 User is authenticated. Fetching user details...");
      const user = await clerkClient.users.getUser(userId);
      
      const isSuperAdmin = !!user.publicMetadata?.admin;      
      // Check if user is an admin of any organization (department)
      const membershipsResponse = await clerkClient.users.getOrganizationMembershipList({ userId });
      const memberships = membershipsResponse.data || [];
      
      const isDepartmentAdmin = memberships.some(membership => 
      membership.role === "admin" || membership.role === "org:admin"
      );

      // If user has any admin role, redirect to role selection
      if (isSuperAdmin || isDepartmentAdmin) {
        redirect('/role-selector');
      } else {
        // Regular users go directly to chat
        const redirectUrl = searchParams.redirect_url || '/chat?tutorial=true';
        redirect(redirectUrl);
      }
    } catch (error) {
      const redirectUrl = searchParams.redirect_url || '/chat?tutorial=true';
      redirect(redirectUrl);
    }
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
        redirectUrl="/redirect-handler"
      />
    </div>
  );
}