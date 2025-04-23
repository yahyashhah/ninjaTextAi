import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: "Report ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify the report belongs to the user before deleting
    const report = await prismadb.userReports.findFirst({
      where: {
        id: reportId,
        userId: userId
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found or not owned by user" },
        { status: 404 }
      );
    }

    // Delete the report
    await prismadb.userReports.delete({
      where: {
        id: reportId
      }
    });

    return NextResponse.json(
      { message: "Report deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE_REPORT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}