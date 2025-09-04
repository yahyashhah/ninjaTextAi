// app/api/admin/users/route.ts
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the requesting user is an admin
    const requestingUser = await clerkClient.users.getUser(userId);
    if (!requestingUser.publicMetadata?.admin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get all users
    const users = await clerkClient.users.getUserList();
    
    // Format the response
    const formattedUsers = users.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      publicMetadata: user.publicMetadata,
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("[ADMIN_USERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}