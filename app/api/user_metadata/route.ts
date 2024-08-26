import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = auth();
  const body = await req.json();
  const { fullName, rank, badgeNumber } = body;

  if (!userId) {
    return new NextResponse("Unauthorized User", { status: 401 });
  }

  await clerkClient().users.updateUserMetadata(userId, {
    publicMetadata: {
      fullName,
      rank,
      badgeNumber,
    },
  });
  return NextResponse.json({ success: "Profile details updated successfully" });
}
