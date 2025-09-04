// app/api/admin/check-access/route.ts
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    const isAdmin = !!user.publicMetadata?.admin;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("[ADMIN_ACCESS_CHECK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}