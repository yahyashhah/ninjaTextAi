import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
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

    // Get feedback statistics
    const feedbackStats = await prismadb.feedback.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    // Group by experience
    const experienceStats = await prismadb.feedback.groupBy({
      by: ['experience'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get rating distribution
    const ratingDistribution = await prismadb.feedback.groupBy({
      by: ['rating'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        rating: 'asc'
      }
    });

    // Get recent feedback for timeline
    const recentFeedback = await prismadb.feedback.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate feedback trends (weekly for the past 4 weeks)
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekLabel = `Week ${4-i}`;
      
      const weekFeedback = await prismadb.feedback.count({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      });
      
      const weekAvgRating = await prismadb.feedback.aggregate({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        },
        _avg: {
          rating: true
        }
      });

      weeklyTrends.push({
        week: weekLabel,
        count: weekFeedback,
        averageRating: weekAvgRating._avg.rating || 0
      });
    }

    return NextResponse.json({
      summary: {
        averageRating: Math.round((feedbackStats._avg.rating ?? 0) * 100) / 100,
        totalFeedback: feedbackStats._count.id,
        timeframe
      },
      experienceStats,
      ratingDistribution,
      recentFeedback,
      weeklyTrends
    });
  } catch (error) {
    console.error("[ADMIN_FEEDBACK_METRICS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}