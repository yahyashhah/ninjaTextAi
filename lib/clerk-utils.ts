// lib/clerk-utils.ts
import { auth } from "@clerk/nextjs/server";

export const isOrgAdmin = async (orgId: string, userId: string) => {
  try {
    const { sessionClaims } = auth();
    
    if (!sessionClaims) return false;
    
    // For organization context
    if (sessionClaims.org_id === orgId) {
      return sessionClaims.org_role === "org:admin";
    }
    
    // Fallback to API check
    const response = await fetch(
      `https://api.clerk.com/v1/organizations/${orgId}/memberships`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!response.ok) return false;
    
    const { data } = await response.json();
    const membership = data.find((m: any) => 
      m.public_user_data?.user_id === userId
    );
    
    console.log("Membership data:", membership);
    
    return membership?.role_name === "Admin";
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
};