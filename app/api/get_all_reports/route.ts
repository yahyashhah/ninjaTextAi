import { getAllReports, saveReport } from "@/lib/user-reports";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    
    const userReports = await getAllReports();
    // console.log(userReports)

    return NextResponse.json({ reports: userReports }, { status: 200 });
  } catch (error) {
    console.log("[REPORT_SAVE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";