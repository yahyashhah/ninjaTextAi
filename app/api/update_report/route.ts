// app/api/update_report/route.ts - ENHANCED
import { updateReport, getReportWithNibrs } from "@/lib/user-reports";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildNIBRSXML } from "@/lib/nibrs/xml";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { 
      reportId, 
      text, 
      reportName, 
      nibrsData, // NEW: Optional NIBRS data updates
      regenerateXml = true // NEW: Regenerate XML when NIBRS data changes
    } = body;

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    if (!reportId) {
      return new NextResponse("Report ID is required", { status: 400 });
    }

    let xmlData = undefined;

    // Regenerate XML if NIBRS data is provided
    if (nibrsData && regenerateXml) {
      try {
        xmlData = buildNIBRSXML(nibrsData);
      } catch (error) {
        console.error("XML regeneration failed:", error);
      }
    }

    // Update report with enhanced data
    await updateReport(reportId, text, reportName, nibrsData, xmlData);

    console.log("Report updated with NIBRS data");
    return NextResponse.json({ 
      success: true, 
      message: "Report updated successfully",
      hasNibrsData: !!nibrsData,
      hasNewXml: !!xmlData
    }, { status: 200 });
    
  } catch (error) {
    console.log("[REPORT_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Error" }, 
      { status: 500 }
    );
  }
}