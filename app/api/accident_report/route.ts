// route.ts - COMPLETELY UPDATED with professional NIBRS validation and standardized error handling
import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

import { validateDescriptiveNibrs, validateNibrsPayload, validateProfessionalNibrs } from "@/lib/nibrs/Validator";
import { validateWithTemplate } from "@/lib/nibrs/templates";
import { NibrsSegments } from "@/lib/nibrs/schema";
import { buildNIBRSXML } from "@/lib/nibrs/xml";
import { NibrsMapper } from "@/lib/nibrs/mapper";
import { NIBRSErrorBuilder } from "@/lib/nibrs/errorBuilder";
import { StandardErrorResponse } from "@/lib/nibrs/errorResponse";
import { sendLowAccuracyNotification } from "@/lib/notifications";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function tryParseJSON(raw: string) {
  raw = (raw || "").trim();
  try {
    return JSON.parse(raw);
  } catch { /* fallthrough */ }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch {}
  }

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const substr = raw.slice(first, last + 1);
    try { return JSON.parse(substr); } catch {}
  }

  throw new Error("Model output is not valid JSON.");
}

function getSuggestedFixForTemplateError(error: string): string {
  if (error.includes("Evidence information is required")) {
    return "Add evidence details like 'field test kit' or 'evidence tag number' to the narrative";
  }
  if (error.includes("Property information is required")) {
    return "Add property descriptions and values for damaged vehicles or stolen items";
  }
  if (error.includes("is required for offense")) {
    return "Ensure all required fields are provided in the narrative";
  }
  if (error.includes("Drug/weapon offenses require a Society/Public victim")) {
    return "Add 'Society/Public' as victim for drug or weapon offenses";
  }
  if (error.includes("Non-victimless offenses require individual or business victims")) {
    return "Add individual victim information including injuries and demographics";
  }
  return "Review the narrative for missing required information";
}

// Function to calculate accuracy score based on validation results
function calculateAccuracyScore(data: any, validationErrors: string[] = [], warnings: string[] = []): number {
  let baseScore = 100;
  
  // Deduct for validation errors
  baseScore -= validationErrors.length * 10;
  
  // Deduct for warnings
  baseScore -= warnings.length * 5;
  
  // Deduct for missing critical fields
  if (!data.offenses || data.offenses.length === 0) baseScore -= 20;
  if (!data.victims || data.victims.length === 0) baseScore -= 15;
  if (!data.properties || data.properties.length === 0) baseScore -= 10;
  
  // Deduct for low confidence mappings
  if (data.offenses && Array.isArray(data.offenses)) {
    data.offenses.forEach((offense: any) => {
      if (offense.mappingConfidence && offense.mappingConfidence < 0.6) {
        baseScore -= 15;
      } else if (offense.mappingConfidence && offense.mappingConfidence < 0.8) {
        baseScore -= 5;
      }
    });
  }
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, baseScore));
}

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
    if (!openai.apiKey) return new NextResponse("OpenAI API key is Invalid", { status: 500 });
    if (!prompt) return new NextResponse("Prompt is required", { status: 400 });

    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrail && !isPro) return new NextResponse("Free Trial has expired", { status: 403 });

    const systemInstructions = selectedTemplate?.instructions || `
You are a NIBRS data extraction assistant and professional police report writer.
From the user's free text, extract ALL relevant information including multiple offenses, victims, offenders, and properties.

CRITICAL PROFESSIONAL RULES:
1. FOCUS ON SERIOUS CRIMES: assault, theft, burglary, robbery, drug violations, weapon crimes
2. TRAFFIC OFFENSES: Only include if DUI or serious injury involved - exclude simple traffic collisions
3. DRUG/WEAPON OFFENSES: Use Society/Public victim (Type S) with injury "N"
4. TRAFFIC COLLISIONS WITH INJURIES: Use individual victims (Type I) with specific injuries
5. OTHER CRIMES: Use individual victims (Type I) with specific injuries
6. REQUIRED FIELDS: incident date, location description, property values for stolen items

Produce a NIBRS-aligned JSON object with these exact keys:
{
  "extractedData": {
    "incidentNumber": string (optional),
    "incidentDate": "YYYY-MM-DD", // MUST be in this format
    "incidentTime": "HH:mm" (if available, else omit),
    "clearedExceptionally": "Y" | "N" (default "N"),
    "exceptionalClearanceDate": "YYYY-MM-DD" (optional),
    
    "offenses": [
      {
        "description": string,
        "attemptedCompleted": "A" | "C" (default "C")
      }
    ],
    
    "locationDescription": string,
    "weaponDescriptions": string[] (optional),
    "biasMotivation": string (optional),

    "victims": [
      {
        "type": "I" | "B" | "F" | "G" | "L" | "O" | "P" | "R" | "S" | "U",
        "age": number (optional),
        "sex": "M" | "F" | "U" (optional),
        "race": "W" | "B" | "I" | "A" | "P" | "U" (optional),
        "ethnicity": "H" | "N" | "U" (optional),
        "injury": string (optional)
      }
    ],

    "offenders": [
      {
        "age": number (optional),
        "sex": "M" | "F" | "U" (optional),
        "race": "W" | "B" | "I" | "A" | "P" | "U" (optional),
        "ethnicity": "H" | "N" | "U" (optional),
        "relationshipDescription": string (optional)
      }
    ],

    "properties": [
      {
        "lossDescription": string (optional),
        "propertyDescription": string (optional),
        "value": number (optional)
      }
    ]
  },
  "narrative": string
}

DATE FORMATTING RULES:
- Convert "September 11, 2025" to "2025-09-11"
- Convert "19:45 hours" to "19:45"
- Always use YYYY-MM-DD format for dates

VICTIM ASSIGNMENT RULES:
- For drug crimes: ALWAYS include Type "S" (Society/Public) with injury "N"
- For weapon violations: ALWAYS include Type "S" (Society/Public) with injury "N"  
- For traffic collisions with injuries: Include Type "I" (Individual) with specific injuries
- For assaults/thefts/burglaries: Include Type "I" (Individual) with specific injuries

PROPERTY RULES:
- For drugs: Include description, estimated value, and note if seized
- For stolen items: Include detailed description and estimated value
- For vehicles: Include make, model, year, and value

ARREST RULES:
- If arrest occurred, include offender demographics and arrest details
- For Group B offenses, only include if arrest was made

IMPORTANT:
- Return a SINGLE JSON document with top-level keys "extractedData" and "narrative" ONLY
- Use double quotes and valid JSON. Do not add markdown, comments, or extra text.
- NEVER output NIBRS codes - only descriptive text that we can map to codes.
- Include ALL relevant details from the narrative - don't omit important information.
`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstructions },
      ...(selectedTemplate?.examples
        ? [{ role: "system" as const, content: `Example Report:\n${selectedTemplate.examples}` }]
        : []),
      { role: "user", content: prompt }
    ];

    console.log("Sending request to OpenAI with prompt:", prompt.substring(0, 200) + "...");

    // Get structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1, // Lower temperature for more consistent results
      response_format: { type: "json_object" }
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";

    let parsed: { extractedData: any; narrative: string };

    try {
      parsed = tryParseJSON(raw);
    } catch (e: any) {
      console.error("JSON parsing failed:", e.message);
      console.error("Raw response that failed:", raw);
      
      const errorResponse: StandardErrorResponse = {
        error: "Model did not return valid JSON",
        suggestions: ["Please rephrase your input and try again"],
        nibrsData: {}
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Map descriptive data to NIBRS codes
    const descriptiveData = parsed.extractedData || {};
    const narrative = (parsed.narrative || "").trim();

    if (!narrative) {
      console.error("Narrative missing from model output");
      
      const errorResponse: StandardErrorResponse = {
        error: "Narrative missing from model output",
        suggestions: ["Please provide more detailed information about the incident"],
        nibrsData: descriptiveData
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // PROFESSIONAL VALIDATION - Check descriptive data before mapping
    const professionalValidation = validateDescriptiveNibrs({
      ...descriptiveData,
      offenses: descriptiveData.offenses || [],
      victims: descriptiveData.victims || [],
      offenders: descriptiveData.offenders || [],
      properties: descriptiveData.properties || [],
      narrative: narrative
    });

    if (professionalValidation.errors.length > 0) {
      const errorResponse = NIBRSErrorBuilder.fromProfessionalValidation(
        professionalValidation,
        descriptiveData
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Mapper validation
    const mapperValidation = NibrsMapper.validateAndMapExtract({
      ...descriptiveData,
      narrative
    });

    if (mapperValidation.errors.length > 0) {
      const errorResponse = NIBRSErrorBuilder.fromMapperValidation(mapperValidation);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const mapped = mapperValidation.data;

    // Run your existing validator (zod + logical checks)
    const { ok, data, errors, warnings: validationWarnings, correctionContext } = validateNibrsPayload(mapped);

    console.log("Validation result:", { ok, errors, warnings: validationWarnings });

    const warnings: string[] = [...validationWarnings];
    
    // Check offense mapping confidence - FIXED: Add proper type checking
    if (data.offenses && Array.isArray(data.offenses)) {
      data.offenses.forEach((offense: any) => {
        if (offense.mappingConfidence && offense.mappingConfidence < 0.6) {
          warnings.push(`Low confidence in offense mapping: ${offense.code} (confidence: ${offense.mappingConfidence})`);
        }
      });
    }

    // Calculate accuracy score
    const accuracyScore = calculateAccuracyScore(data, errors, warnings);
    console.log("Calculated accuracy score:", accuracyScore);

    if (!ok && errors.length > 0) {
      const errorResponse = NIBRSErrorBuilder.fromSchemaValidation(
        errors,
        warnings,
        data,
        correctionContext
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Also run template-based validation (business rules)
    const templateErrors = validateWithTemplate(data);
    if (templateErrors.length > 0) {
      // Create proper correction context for template errors
      const templateCorrectionContext = {
        missingVictims: correctionContext?.missingVictims || [],
        ambiguousProperties: correctionContext?.ambiguousProperties || [],
        requiredFields: correctionContext?.requiredFields || [],
        multiOffenseIssues: correctionContext?.multiOffenseIssues || [],
        templateErrors: templateErrors.map(error => ({
          message: error,
          offenseCode: data.offenses?.[0]?.code,
          suggestedFix: getSuggestedFixForTemplateError(error)
        }))
      };

      const errorResponse = NIBRSErrorBuilder.fromTemplateValidation(
        templateErrors,
        warnings,
        data,
        templateCorrectionContext
      );
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Build XML if everything is good
    const xml = buildNIBRSXML(data);

    console.log('🚀 Attempting to submit report to department system...');
    try {
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
          narrative,
          nibrsData: data,
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
    } catch (submissionError) {
      console.error('❌ Error submitting to department system:', submissionError);
    }

    const processingTime = Date.now() - startTime;
    
    // FIXED: Create a properly typed report event object
    const reportEventData: any = {
      userId: userId!,
      reportType: "nibrs",
      processingTime,
      success: true,
      templateUsed: selectedTemplate?.id || null,
    };
    
    // Only add accuracyScore if it exists in your Prisma schema
    // If your ReportEvent model doesn't have accuracyScore, remove this line
    reportEventData.accuracyScore = accuracyScore;
    
    await trackReportEvent(reportEventData);
    
    await trackUserActivity({
      userId: userId!,
      activity: "report_created",
      metadata: { 
        reportType: "nibrs", 
        templateUsed: selectedTemplate?.id,
        accuracyScore: accuracyScore
      },
    });
    
    if (!isPro) await increaseAPiLimit();

    // Save the human-readable narrative to history
    await saveHistoryReport(
      userId!,
      `${Date.now()}`,
      narrative,
      "nibrs"
    );
    
    return NextResponse.json(
      {
        narrative,
        nibrs: data,
        xml,
        accuracyScore: accuracyScore,
        warnings: warnings.length > 0 ? warnings : undefined
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("[NIBRS_REPORT_ERROR]", error?.message || error);
    console.error("Full error:", error);

    const processingTime = Date.now() - startTime;
    if (userId) {
      // FIXED: Create a properly typed report event object for error case
      const errorReportEventData: any = {
        userId,
        reportType: "nibrs",
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

    // Return standardized error response for internal errors
    const errorResponse: StandardErrorResponse = {
      error: error?.message || "Internal server error",
      suggestions: ["Please try again or contact support if the issue persists"],
      statusCode: 500
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}