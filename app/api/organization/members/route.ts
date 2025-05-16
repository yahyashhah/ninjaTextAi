import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isOrgAdmin } from "@/lib/clerk-utils";

async function syncMembersFromClerk(orgId: string) {
  try {
    const clerkMembers = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    let successCount = 0;

    for (const member of clerkMembers.data) {
      try {
        if (!member.publicUserData?.userId) continue;

        const userId = member.publicUserData.userId;
        const userData = member.publicUserData;

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

        const existingMember = await prismadb.organizationMember.findFirst({
          where: { organizationId: orgId, userId: userId },
        });

        if (!existingMember) {
          await prismadb.organizationMember.create({
            data: {
              organization: { connect: { clerkOrgId: orgId } },
              user: { connect: { clerkUserId: userId } },
              role: member.role,
            },
          });
        }

        successCount++;
      } catch {
        continue;
      }
    }

    return successCount > 0;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!clerkUserId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isOrgAdmin(orgId, clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingMembers = await prismadb.organizationMember.count({
      where: { organizationId: orgId },
    });

    if (existingMembers === 0) {
      await syncMembersFromClerk(orgId);
    }

    const members = await prismadb.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            clerkUserId: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
            isPro: true,
            proAccessGrantedBy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}