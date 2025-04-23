import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('historyId');
    const userId = searchParams.get('userId');

    if (!historyId || !userId) {
      return NextResponse.json(
        { error: "History ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify the history item belongs to the user before deleting
    const historyItem = await prismadb.reportsHistory.findFirst({
      where: {
        id: historyId,
        userId: userId
      }
    });

    if (!historyItem) {
      return NextResponse.json(
        { error: "History item not found or not owned by user" },
        { status: 404 }
      );
    }

    // Delete the history item
    await prismadb.reportsHistory.delete({
      where: {
        id: historyId
      }
    });

    return NextResponse.json(
      { message: "History item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE_HISTORY_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}