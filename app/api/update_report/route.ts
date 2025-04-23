import { saveReport, updateReport } from "@/lib/user-reports";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { reportId, reportText, reportName } = body;

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    if (!openai.apiKey) {
      return new NextResponse("OpenAI API key is Invalid", { status: 500 });
    }
    if (!reportId) {
      return new NextResponse("File id is required", { status: 400 });
    }
    if (!reportText) {
      return new NextResponse("File is empty", { status: 400 });
    }

    await updateReport(reportId, reportText, reportName);

    console.log("report Updated");
    return new NextResponse("Report updated successfully", { status: 200 });
  } catch (error) {
    console.log("[REPORT_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
