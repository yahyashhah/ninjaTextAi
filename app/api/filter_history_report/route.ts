import { filterHistoryReports } from "@/lib/history-reports";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { tag } = body;

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }

    const filteredHistoryReports = await filterHistoryReports(tag);

    return NextResponse.json({ reports: filteredHistoryReports }, { status: 200 });
  } catch (error) {
    console.log("[FILTER_HISTORY_REPORTS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
