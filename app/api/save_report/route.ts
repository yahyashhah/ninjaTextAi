// app/api/save_report/route.ts - ENHANCED
import { saveReport } from "@/lib/user-reports";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildNIBRSXML } from "@/lib/nibrs/xml"; // Import your XML builder

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { 
      reportName, 
      reportText, 
      tag, 
      nibrsData, // NEW: Optional NIBRS data
      generateXml = true // NEW: Option to generate XML
    } = body;

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    if (!reportName) {
      return new NextResponse("File name is required", { status: 400 });
    }
    if (!reportText) {
      return new NextResponse("File is empty", { status: 400 });
    }

    let xmlData = null;

    // Generate XML if NIBRS data is provided and XML generation is requested
    if (nibrsData && generateXml) {
      try {
        xmlData = buildNIBRSXML(nibrsData);
      } catch (error) {
        console.error("XML generation failed:", error);
        // Continue without XML if generation fails
      }
    }

    // Save report with enhanced data
    await saveReport(
      userId, 
      reportName, 
      reportText, 
      tag, 
      nibrsData, 
      xmlData, 
    );

    console.log("Report saved with NIBRS data");
    return NextResponse.json({ 
      success: true, 
      message: "Report saved successfully",
      hasNibrsData: !!nibrsData,
      hasXmlData: !!xmlData
    }, { status: 200 });
    
  } catch (error) {
    console.log("[REPORT_SAVE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Error" }, 
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";