// app/api/admin/metrics/route.ts - FIXED VERSION
import prismadb from "@/lib/prismadb";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const isAdmin = !!clerkUser.publicMetadata?.admin;

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get all users from OUR database (not Clerk)
    const allUsers = await prismadb.user.findMany();
    const totalUsers = allUsers.length;

    // FIX: Get active users from UserReports (not ReportEvent)
    const activeUsers = await prismadb.userReports.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      distinct: ['userId'],
      select: {
        userId: true
      }
    });

    // FIX: Get report statistics from UserReports (single source of truth)
    const reportStats = await prismadb.userReports.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get processing time statistics from ReportEvent
    const processingStats = await prismadb.reportEvent.aggregate({
      where: {
        createdAt: {
          gte: startDate
        },
        success: true,
        processingTime: {
          not: null
        }
      },
      _avg: {
        processingTime: true
      },
      _min: {
        processingTime: true
      },
      _max: {
        processingTime: true
      }
    });

    // Get success/failure rates from ReportEvent
    const successStats = await prismadb.reportEvent.groupBy({
      by: ['success'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get login activities
    const totalLoginActivities = await prismadb.userActivity.count({
      where: {
        activity: "login",
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get all activities
    const totalActivities = await prismadb.userActivity.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get latency metrics by stage
    const latencyStats = await prismadb.reportEvent.groupBy({
      by: ['reportType'],
      where: {
        createdAt: {
          gte: startDate
        },
        success: true,
        processingTime: {
          not: null
        }
      },
      _avg: {
        processingTime: true
      }
    });

    // Get error statistics
    const errorStats = await prismadb.systemError.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Calculate metrics - FIXED to use correct data sources
    const activeUsersCount = activeUsers.length;
    const activeUsersPercentage = totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0;
    
    // FIX: Use UserReports count (not ReportEvent)
    const totalReports = reportStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const avgReportsPerUser = activeUsersCount > 0 ? totalReports / activeUsersCount : 0;
    
    const successCount = successStats.find(stat => stat.success)?._count.id || 0;
    const failureCount = successStats.find(stat => !stat.success)?._count.id || 0;
    const totalAttempts = successCount + failureCount;
    const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

    // Calculate audit log completeness
    const auditCompleteness = totalActivities > 0 ? 
      (totalLoginActivities / totalActivities) * 100 : 0;

    // Weekly data for charts - FIXED
    const weeklyData = await getWeeklyData();

    return NextResponse.json({
      // Adoption & Engagement - NOW ACCURATE
      activeUsers: activeUsersCount,
      activeUsersPercentage: Math.round(activeUsersPercentage),
      reportRate: Math.round(activeUsersPercentage),
      avgReportsPerUser: Math.round(avgReportsPerUser * 100) / 100,
      totalReports, // NOW CORRECT - not double counted
      
      // Efficiency
      avgProcessingTime: processingStats._avg.processingTime 
        ? Math.round(processingStats._avg.processingTime / 1000)
        : 0,
      minProcessingTime: processingStats._min.processingTime 
        ? Math.round(processingStats._min.processingTime / 1000)
        : 0,
      maxProcessingTime: processingStats._max.processingTime 
        ? Math.round(processingStats._max.processingTime / 1000)
        : 0,
      
      // System Reliability
      successRate: Math.round(successRate),
      errorCount: failureCount,
      errorStats: errorStats,
      latencyByStage: latencyStats,
      
      // Compliance
      auditCompleteness: Math.round(auditCompleteness),
      
      // Business ROI
      reportsPerOfficerPerMonth: Math.round(avgReportsPerUser * 4.33),
      
      // Weekly data for charts - NOW ACCURATE
      weeklyData,
      
      // Additional calculated metrics
      totalUsers,
      timeframe
    });
  } catch (error) {
    console.error("[ADMIN_METRICS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function getWeeklyData() {
  // Get data for the last 4 weeks - FIXED to use UserReports
  const weeks = [];
  const now = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekLabel = `Week ${4-i}`;
    
    // FIX: Get active users from UserReports
    const activeUsers = await prismadb.userReports.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      distinct: ['userId'],
      select: {
        userId: true
      }
    });
    
    // FIX: Get reports from UserReports (not ReportEvent)
    const reports = await prismadb.userReports.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    // Get errors for this week
    const errors = await prismadb.systemError.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });
    
    weeks.push({
      week: weekLabel,
      activeUsers: activeUsers.length,
      reports: reports, // NOW ACCURATE
      errors: errors,
      reportsPerUser: activeUsers.length > 0 ? Math.round((reports / activeUsers.length) * 100) / 100 : 0
    });
  }
  
  return weeks;
}