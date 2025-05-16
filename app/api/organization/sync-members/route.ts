import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    const { orgId } = await req.json();

    if (!clerkUserId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isOrgAdmin(orgId, clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get members from Clerk
    const clerkMembers = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    // Track sync results
    let successCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process all members
    for await (const member of clerkMembers.data) {
      try {
        // Skip if no publicUserData or userId
        if (!member.publicUserData?.userId) {
          skippedCount++;
          continue;
        }

        const userId = member.publicUserData.userId;
        const userData = member.publicUserData;

        // Upsert user with all available data
        await prismadb.user.upsert({
          where: { clerkUserId: userId },
          create: {
            clerkUserId: userId,
            firstName: userData.firstName || null,
            lastName: userData.lastName || null,
            email: userData.identifier || null,
            profileImageUrl: userData.imageUrl || null,
          },
          update: {
            firstName: userData.firstName || undefined,
            lastName: userData.lastName || undefined,
            email: userData.identifier || undefined,
            profileImageUrl: userData.imageUrl || undefined,
          },
        });

        // Check if organization member exists
        const existingMember = await prismadb.organizationMember.findFirst({
          where: {
            organizationId: orgId,
            userId: userId,
          },
        });

        // Create organization member if not exists
        if (!existingMember) {
          await prismadb.organizationMember.create({
            data: {
              organization: {
                connect: { clerkOrgId: orgId },
              },
              user: {
                connect: { clerkUserId: userId },
              },
              role: member.role,
            },
          });
        }

        successCount++;
      } catch (error) {
        const errorMsg = `Error processing member ${member.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({ 
      success: true,
      stats: {
        total: clerkMembers.data.length,
        success: successCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      ...(errors.length > 0 && { errorMessages: errors.slice(0, 5) }),
    });
  } catch (error) {
    console.error("[MEMBERS_SYNC_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}