// app/api/admin/users/[userId]/route.ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: adminUserId } = auth();
    
    if (!adminUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the requesting user is an admin
    const requestingUser = await clerkClient.users.getUser(adminUserId);
    if (!requestingUser.publicMetadata?.admin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { userId } = params;

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Get user details from our database
    const dbUser = await prismadb.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 reports
        },
        reportEvents: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Last 20 report events
        },
        userActivities: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Last 20 activities
        },
        apiLimit: true,
        subscription: true,
        templates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Get report statistics
    const reportStats = await prismadb.reportEvent.groupBy({
      by: ['reportType'],
      where: { userId: dbUser?.id },
      _count: { id: true },
      _avg: { processingTime: true }
    });

    // Get success rate
    const successStats = await prismadb.reportEvent.groupBy({
      by: ['success'],
      where: { userId: dbUser?.id },
      _count: { id: true }
    });

    const totalReports = successStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const successCount = successStats.find(stat => stat.success)?._count.id || 0;
    const successRate = totalReports > 0 ? (successCount / totalReports) * 100 : 0;

    // Get weekly activity
    const now = new Date();
    const fourWeeksAgo = new Date(now.setDate(now.getDate() - 28));
    
    const weeklyActivity = await prismadb.reportEvent.groupBy({
      by: ['createdAt'],
      where: {
        userId: dbUser?.id,
        createdAt: {
          gte: fourWeeksAgo
        },
        success: true
      },
      _count: { id: true }
    });

    const userData = {
      clerkUser: {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses,
        lastSignInAt: clerkUser.lastSignInAt,
        createdAt: clerkUser.createdAt,
        publicMetadata: clerkUser.publicMetadata
      },
      dbUser,
      statistics: {
        totalReports,
        successRate: Math.round(successRate),
        reportTypes: reportStats,
        weeklyActivity
      }
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error("[ADMIN_USER_DETAILS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}