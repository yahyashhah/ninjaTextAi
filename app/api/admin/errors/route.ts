import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const clerkUser = await clerkClient.users.getUser(userId);
    const isAdmin = !!clerkUser.publicMetadata?.admin;

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const errorType = searchParams.get('type') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (errorType) {
      whereClause.type = errorType;
    }

    // Get system errors
    const errors = await prismadb.systemError.findMany({
      where: whereClause,
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
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prismadb.systemError.count({
      where: whereClause
    });

    // Get error type counts
    const errorCounts = await prismadb.systemError.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      errors,
      errorCounts,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error("[ADMIN_ERRORS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}