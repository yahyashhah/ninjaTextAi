// route.ts - FIXED RAG INTEGRATION
import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildNIBRSXML } from "@/lib/nibrs/xml";

const RAG_WEBHOOK_URL = "http://localhost:5678/webhook/6307562b-2066-49cc-a465-3556ef6f89fe";

export async function POST(req: Request) {
  let userId: string | null = null;
  let startTime = Date.now();

  try {
    const authResult = auth();
    userId = authResult.userId;

    const body = await req.json();
    const { prompt, selectedTemplate } = body;
    startTime = Date.now();

    if (!userId) return new NextResponse("Unauthorized User", { status: 401 });
    if (!prompt) return new NextResponse("Prompt is required", { status: 400 });

    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrail && !isPro) return new NextResponse("Free Trial has expired", { status: 403 });

    console.log("🚀 Calling RAG agent with prompt:", prompt.substring(0, 200) + "...");

    // CALL RAG AGENT INSTEAD OF OPENAI + MAPPING
    const ragResponse = await fetch(RAG_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt })
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG agent failed: ${ragResponse.statusText}`);
    }

    const ragResult = await ragResponse.json();
    console.log("🔍 Raw RAG response:", JSON.stringify(ragResult, null, 2));

    // FIX: Handle the array response structure
    let nibrsData;
    if (Array.isArray(ragResult)) {
      // Handle array format: [ { output: { NIBRS_Segments: ... } } ]
      nibrsData = ragResult[0]?.output?.NIBRS_Segments;
    } else if (ragResult.output?.NIBRS_Segments) {
      // Handle object format: { output: { NIBRS_Segments: ... } }
      nibrsData = ragResult.output.NIBRS_Segments;
    } else if (ragResult.NIBRS_Segments) {
      // Handle direct format: { NIBRS_Segments: ... }
      nibrsData = ragResult.NIBRS_Segments;
    }

    if (!nibrsData) {
      console.error("❌ RAG response structure:", ragResult);
      throw new Error("RAG agent returned invalid format. Expected NIBRS_Segments in response.");
    }

    console.log("✅ RAG agent response received and parsed successfully");

    // Convert RAG format to your expected format
    const convertedNibrs = convertRAGToLegacyFormat(nibrsData, prompt);
    console.log("✅ Converted NIBRS data:", JSON.stringify(convertedNibrs, null, 2));
    
    // Generate XML using your existing builder
    const xml = buildNIBRSXML(convertedNibrs);
    console.log("✅ XML generated");

    // Calculate accuracy score (RAG should be high accuracy)
    const accuracyScore = calculateRAGAccuracyScore(nibrsData);
    console.log("Calculated accuracy score:", accuracyScore);

    // ========== KEEP ALL YOUR EXISTING DEPARTMENT SUBMISSION LOGIC ==========
    console.log('🚀 Attempting to submit report to department system...');
    
    // Use the existing authResult instead of calling auth() again
    let clerkOrgId: string | null = null;

    // Debug: Log all session claims to see what's available
    console.log('🔍 All session claims:', authResult.sessionClaims);

    // Try different ways to access organization memberships
    let orgMemberships: any = null;

    // Method 1: Try the most common way
    if (authResult.sessionClaims?.org_memberships) {
      orgMemberships = authResult.sessionClaims.org_memberships;
      console.log('✅ Found org_memberships in session claims');
    } 
    // Method 2: Try alternative naming
    else if (authResult.sessionClaims?.organization_memberships) {
      orgMemberships = authResult.sessionClaims.organization_memberships;
      console.log('✅ Found organization_memberships in session claims');
    }
    // Method 3: Try Clerk's newer format
    else if (authResult.sessionClaims?.orgs) {
      orgMemberships = authResult.sessionClaims.orgs;
      console.log('✅ Found orgs in session claims');
    }

    console.log('📋 User organization memberships:', orgMemberships);

    // Process the organization memberships
    if (orgMemberships) {
      if (Array.isArray(orgMemberships) && orgMemberships.length > 0) {
        clerkOrgId = orgMemberships[0];
        console.log('✅ Using first organization from array:', clerkOrgId);
      } else if (typeof orgMemberships === 'object' && orgMemberships !== null) {
        const orgIds = Object.keys(orgMemberships);
        if (orgIds.length > 0) {
          clerkOrgId = orgIds[0];
          console.log('✅ Using first organization from object:', clerkOrgId);
        }
      }
    }

    // If still no organization, use the direct Clerk API as fallback
    if (!clerkOrgId) {
      console.log('🔄 Falling back to Clerk API for organization membership...');
      try {
        const memberships = await clerkClient().users.getOrganizationMembershipList({
          userId: authResult.userId!,
        });
        
        if (memberships.data.length > 0) {
          clerkOrgId = memberships.data[0].organization.id;
          console.log('✅ Found organization via Clerk API:', clerkOrgId);
        }
      } catch (error) {
        console.error('❌ Error fetching organization from Clerk API:', error);
      }
    }

    if (clerkOrgId) {
      console.log('📤 Submitting to department API with orgId:', clerkOrgId);
      
      const submissionPayload = {
        narrative: prompt,
        nibrsData: convertedNibrs,
        accuracyScore: accuracyScore,
        reportType: 'nibrs',
        title: `NIBRS Report - ${new Date().toLocaleDateString()}`,
        clerkOrgId: clerkOrgId,
        clerkUserId: userId
      };

      console.log('📦 Submission payload:', JSON.stringify(submissionPayload, null, 2));

      const submissionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/department/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload)
      });

      console.log('📨 Department API response status:', submissionResponse.status);

      if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text();
        console.error('❌ Department submission failed:', errorText);
      } else {
        const submissionResult = await submissionResponse.json();
        console.log('✅ Report submitted to department system:', submissionResult);
      }
    } else {
      console.warn('⚠️ No organization ID found for user. Report not submitted to department.');
    }

    const processingTime = Date.now() - startTime;
    
    // KEEP ALL YOUR TRACKING LOGIC
    const reportEventData: any = {
      userId: userId!,
      reportType: "nibrs",
      processingTime,
      success: true,
      templateUsed: selectedTemplate?.id || null,
      accuracyScore: accuracyScore
    };
    
    await trackReportEvent(reportEventData);
    
    await trackUserActivity({
      userId: userId!,
      activity: "report_created",
      metadata: { 
        reportType: "nibrs", 
        templateUsed: selectedTemplate?.id,
        accuracyScore: accuracyScore,
        source: "rag" // Track that RAG was used
      },
    });
    
    if (!isPro) await increaseAPiLimit();

    // Save the human-readable narrative to history
    await saveHistoryReport(
      userId!,
      `${Date.now()}`,
      prompt,
      "nibrs"
    );
    
    return NextResponse.json(
      {
        narrative: prompt,
        nibrs: convertedNibrs,
        xml,
        accuracyScore: accuracyScore,
        source: "rag" // Let frontend know it came from RAG
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.log("[RAG_REPORT_ERROR]", error?.message || error);
    console.error("Full error:", error);

    const processingTime = Date.now() - startTime;
    if (userId) {
      const errorReportEventData: any = {
        userId,
        reportType: "accident",
        processingTime,
        success: false,
        error: error?.message || "Unknown error",
      };
      
      await trackReportEvent(errorReportEventData);
      
      await trackUserActivity({
        userId,
        activity: "report_failed",
        metadata: { reportType: "nibrs", error: error?.message || "Unknown error" },
      });
    }

    return NextResponse.json(
      { error: error?.message || "RAG processing failed" },
      { status: 500 }
    );
  }
}

// UPDATED conversion function to handle your RAG output structure
// UPDATED conversion function to include ALL RAG-provided fields
function convertRAGToLegacyFormat(ragData: any, prompt: string): any {
  console.log("🔧 Converting RAG data to legacy format with enhanced fields");
  
  // Enhanced property type mapping
  const propertyTypeMap: Record<string, string> = {
    "07": "07", "Laptop": "07", "Computer": "07",
    "B": "07", "Stolen Property": "07",
    "Real Property": "34", "Garage door": "34", "Graffiti": "34", 
    "Physical Evidence": "34", "Accelerants": "34", "Spray paint": "34",
    "Controlled Substance": "10", "Drug": "10", "Heroin": "10",
    "Vehicle": "08", "Car": "08", "Auto": "08",
    "Currency": "01", "Cash": "01", "Money": "01",
    "Firearm": "11", "Gun": "11", "Weapon": "11",
    "Electronic": "14", "Phone": "14",
    "Jewelry": "02", "Other": "34"
  };

  // Enhanced weapon force mapping
  const weaponForceMap: Record<string, string> = {
    "30": "16", // Baseball bat -> Blunt object
    "None": "26", // No weapon
    "Unknown": "25" // Unknown weapon
  };

  // Enhanced injury code mapping
  const injuryCodeMap: Record<string, string> = {
    "B": "B", // Broken arm -> Broken bones
    "I17": "I", // Overdose -> Injury
    "N": "N", // None
    "Unknown": "U" // Unknown
  };

  // Process offenses with enhanced data
  const offenses = ragData.Offense_Segment?.map((offense: any, index: number) => ({
    code: offense.Offense_Code,
    description: offense.Offense_Description,
    attemptedCompleted: (offense.Attempted_Completed as "A" | "C") || "C",
    sequenceNumber: index + 1,
    // NEW: Enhanced offense details from RAG
    weaponForceUsed: weaponForceMap[offense.Weapon_Force_Used] || offense.Weapon_Force_Used,
    locationType: offense.Location_Type,
    locationDescription: offense.Location_Description,
    offenseCategory: ragData.Offenses?.[index]?.OffenseCategory || "Unknown",
    nibrsReportable: ragData.Offenses?.[index]?.NIBRSReportable || "Unknown",
    notes: ragData.Offenses?.[index]?.Notes || ""
  })) || [];

  // Process properties with enhanced data
  const properties = ragData.Property_Segment?.map((property: any, index: number) => {
    const descriptionCode = propertyTypeMap[property.Property_Type] || 
                           propertyTypeMap[property.Property_Description] || "34";
    
    return {
      descriptionCode: descriptionCode,
      description: property.Property_Description,
      value: property.Item_Details?.Value || 0,
      lossType: property.Item_Details?.Seized === "Y" ? "6" : "7",
      seized: property.Item_Details?.Seized === "Y",
      sequenceNumber: index + 1,
      // NEW: Enhanced property details from RAG
      currency: property.Item_Details?.Currency || "USD",
      itemDetails: property.Item_Details?.Description || "",
      propertyTypeDescription: property.Property_Type
    };
  }) || [];

  // Process victims with enhanced data
  const victims = ragData.Victim_Segment?.map((victim: any, index: number) => ({
    type: victim.Victim_Type as "I" | "B" | "F" | "G" | "L" | "O" | "P" | "R" | "S" | "U",
    age: victim.Age,
    sex: victim.Sex as "M" | "F" | "U",
    race: victim.Race,
    ethnicity: victim.Ethnicity,
    injury: injuryCodeMap[victim.Injury_Code] || victim.Injury_Code,
    sequenceNumber: index + 1,
    // NEW: Enhanced victim details from RAG
    victimId: victim.Victim_ID || index + 1,
    name: victim.Name,
    role: victim.Role,
    injuryDescription: victim.Injury_Description,
    offenseConnected: victim.Offense_Connected,
    injuryCode: victim.Injury_Code
  })) || [];

  // Process offenders with enhanced data
  const offenders = ragData.Offender_Segment?.map((offender: any, index: number) => ({
    age: offender.Age,
    sex: offender.Sex as "M" | "F" | "U",
    race: offender.Race,
    ethnicity: offender.Ethnicity,
    sequenceNumber: index + 1,
    // NEW: Enhanced offender details from RAG
    offenderId: offender.Offender_ID || index + 1,
    name: offender.Name
  })) || [];

  // Process arrestees with enhanced data
  const arrestees = ragData.Arrestee_Segment?.map((arrestee: any, index: number) => ({
    sequenceNumber: index + 1,
    arrestDate: arrestee.Arrest_Date?.split('T')[0] || arrestee.Arrest_Date,
    arrestTime: arrestee.Arrest_Date?.includes('T') ? arrestee.Arrest_Date.split('T')[1] : undefined,
    arrestType: mapArrestType(arrestee.Arrest_Type),
    age: arrestee.Age,
    sex: arrestee.Sex as "M" | "F" | "U",
    race: arrestee.Race,
    ethnicity: arrestee.Ethnicity,
    offenseCodes: arrestee.Offense_Arrest_Code ? 
                  arrestee.Offense_Arrest_Code.split(',').map((code: string) => code.trim()) : 
                  [],
    // NEW: Enhanced arrestee details from RAG
    arresteeId: arrestee.Arrestee_ID || index + 1,
    name: arrestee.Name,
    arrestTypeDescription: arrestee.Arrest_Type_Description,
    offenseArrestDescription: arrestee.Offense_Arrest_Description,
    residentCode: "U" // Default to Unknown
  })) || [];

  // Enhanced administrative segment
  const administrative = {
    incidentNumber: ragData.Administrative_Segment?.Incident_Number || `INC-${Date.now()}`,
    incidentDate: ragData.Administrative_Segment?.Incident_DateTime?.split('T')[0] || new Date().toISOString().split('T')[0],
    incidentTime: ragData.Administrative_Segment?.Incident_DateTime?.split('T')[1],
    clearedExceptionally: (ragData.Administrative_Segment?.Cleared_Exceptionally as "Y" | "N") || "N",
    exceptionalClearanceDate: undefined,
    // NEW: Enhanced administrative details from RAG
    cargoPropertyInvolved: ragData.Administrative_Segment?.Cargo_Property_Involved || "Unknown",
    reportingAgency: "Unknown", // Can be enhanced if available
    clearedBy: arrestees.length > 0 ? "A" : "N" // Auto-detect if cleared by arrest
  };

  return {
    administrative: administrative,
    locationCode: ragData.Offense_Segment?.[0]?.Location_Type || "13",
    offenses: offenses,
    properties: properties,
    victims: victims,
    offenders: offenders,
    arrestees: arrestees,
    narrative: prompt,
    // NEW: Additional segments for comprehensive reporting
    offenseSummary: ragData.Offenses?.map((offense: any) => ({
      description: offense.Description,
      reportable: offense.NIBRSReportable,
      category: offense.OffenseCategory,
      notes: offense.Notes
    })) || [],
    // Enhanced metadata
    metadata: {
      source: "rag",
      processingDate: new Date().toISOString(),
      totalOffenses: offenses.length,
      totalVictims: victims.length,
      totalArrestees: arrestees.length,
      totalProperties: properties.length
    }
  };
}

// Helper function to map arrest types
function mapArrestType(arrestType: string): "O" | "S" | "T" {
  const typeMap: Record<string, "O" | "S" | "T"> = {
    "A": "T", // Arrest -> Taken into custody
    "O": "O", // On-view
    "S": "S", // Summoned/Cited
    "T": "T"  // Taken into custody
  };
  return typeMap[arrestType] || "T"; // Default to Taken into custody
}

function calculateRAGAccuracyScore(ragData: any): number {
  // RAG should be more accurate - start with high score
  let score = 95;
  
  // Deduct for missing critical fields
  if (!ragData.Offense_Segment || ragData.Offense_Segment.length === 0) {
    score -= 20;
    console.log("⚠️ No offenses found in RAG output");
  }
  
  if (!ragData.Administrative_Segment?.Incident_DateTime) {
    score -= 10;
    console.log("⚠️ No incident date/time in RAG output");
  }
  
  // Check for data quality
  if (ragData.Offense_Segment) {
    ragData.Offense_Segment.forEach((offense: any) => {
      if (offense.Offense_Code === "Unknown" || !offense.Offense_Code) {
        score -= 5;
      }
    });
  }
  
  // Ensure reasonable range
  return Math.max(60, Math.min(100, score));
}

// Export for testing
export { convertRAGToLegacyFormat, calculateRAGAccuracyScore };