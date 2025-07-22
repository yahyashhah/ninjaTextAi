// app/api/update-user-metadata/route.ts
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, metadata } = await request.json();
    
    if (!userId || !metadata) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: metadata
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return NextResponse.json(
      { error: "Failed to update user metadata" },
      { status: 500 }
    );
  }
}