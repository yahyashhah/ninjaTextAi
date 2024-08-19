import { filterReports, getAllReports, saveReport, searchReportByName } from "@/lib/user-reports";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { name } = body;

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }

    const filteredReports = await searchReportByName(name);

    return NextResponse.json({ reports: filteredReports }, { status: 200 });
  } catch (error) {
    console.log("[FILTER_REPORTS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
