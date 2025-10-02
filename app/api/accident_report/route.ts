import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

// Import NIBRS utilities
import { validateDescriptiveNibrs, validateNibrsPayload } from "@/lib/nibrs/Validator";
import { validateWithTemplate } from "@/lib/nibrs/templates";
import { buildNIBRSXML } from "@/lib/nibrs/xml";
import { NibrsMapper } from "@/lib/nibrs/mapper";
import { NIBRSErrorBuilder } from "@/lib/nibrs/errorBuilder";
import { StandardErrorResponse } from "@/lib/nibrs/errorResponse";
import { createReviewQueueItemIfNeeded, getUserOrganizationWithFallback } from "@/lib/organization-utils";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// NIBRS-specific template instructions
const NIBRS_TEMPLATE_INSTRUCTIONS = `
You are a NIBRS data extraction specialist. Convert police narratives into structured NIBRS data.

CRITICAL NIBRS RULES:
1. FOCUS ON NIBRS-REPORTABLE OFFENSES: assault, theft, burglary, robbery, drug violations, weapon crimes
2. EXCLUDE: Simple traffic offenses (unless DUI or serious injury), minor incidents not requiring NIBRS reporting
3. DRUG/WEAPON OFFENSES: Use Society/Public victim (Type S) with injury "N"
4. INDIVIDUAL CRIMES: Use individual victims (Type I) with specific injuries when applicable
5. REQUIRED FIELDS: incident date, location, offense description, victim information

NIBRS-SPECIFIC TEMPLATE FORMAT:
Today is [date] at approximately [time]. I was dispatched to [location] in reference to [type of incident]. 
Upon arrival, I made contact with [victim information if applicable]. 
The victim reported that [describe what happened, including actions by offender(s)].
The offense involved is [offense description]. The offense was [attempted/completed]. 
The suspect is described as [demographics if known].
The suspect used [method/weapon/force if applicable]. 
The victim sustained [type of injury if any]. 
The property involved includes [list items with descriptions and values if applicable].

OUTPUT FORMAT - JSON ONLY:
{
  "extractedData": {
    "incidentNumber": string (optional),
    "incidentDate": "YYYY-MM-DD",
    "incidentTime": "HH:mm" (optional),
    "locationDescription": string,
    
    "offenses": [
      {
        "description": string,
        "attemptedCompleted": "A" | "C"
      }
    ],
    
    "victims": [
      {
        "type": "I" | "S" | "B" | etc.,
        "age": number (optional),
        "sex": "M" | "F" | "U",
        "race": "W" | "B" | "I" | "A" | "P" | "U",
        "ethnicity": "H" | "N" | "U",
        "injury": string
      }
    ],

    "offenders": [
      {
        "age": number (optional),
        "sex": "M" | "F" | "U",
        "race": "W" | "B" | "I" | "A" | "P" | "U",
        "ethnicity": "H" | "N" | "U"
      }
    ],

    "properties": [
      {
        "lossDescription": string,
        "propertyDescription": string,
        "value": number
      }
    ]
  },
  "narrative": "Cleaned narrative following NIBRS template"
}
`;

// Helper function to get user's organization
async function getUserOrganization(userId: string) {
  try {
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId: userId,
    });
    
    if (memberships.data.length > 0) {
      return memberships.data[0].organization;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user organization:", error);
    return null;
  }
}

// Enhanced validation function with better error categorization
async function validateInputCompleteness(narrative: string, template: any) {
  const requiredFields = template?.requiredFields || [];

  if (requiredFields.length === 0) {
    return {
      isComplete: true,
      missingFields: [],
      presentFields: [],
      confidenceScore: 1.0,
      promptForMissingInfo: "No specific fields required for this template."
    };
  }

  const validationPrompt = `
POLICE REPORT FIELD VALIDATION

REQUIRED FIELDS TO VALIDATE:
${requiredFields.map((field: string) => {
  const fieldDef = template.fieldDefinitions?.[field];
  return `- ${field}: ${fieldDef?.label || field} - ${fieldDef?.description || 'No description'}`;
}).join('\n')}

NARRATIVE TO VALIDATE:
"${narrative}"

CHECK: Does the narrative contain information for EACH required field above?

RESPONSE FORMAT - JSON ONLY:
{
  "isComplete": boolean,
  "missingFields": ["field_names_from_required_list"],
  "presentFields": ["field_names_from_required_list"],
  "confidenceScore": number,
  "promptForMissingInfo": "Brief prompt asking for missing fields"
}
`;

  try {
    const validationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: validationPrompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    const content = validationResponse.choices[0].message.content;
    if (!content) throw new Error("No content in validation response");
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in validation response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Validation error:", error);
    return {
      isComplete: false,
      missingFields: requiredFields,
      presentFields: [],
      confidenceScore: 0,
      promptForMissingInfo: `Please ensure you provide: ${requiredFields.join(', ')}`
    };
  }
}

// Enhanced error categorization function
function categorizeMissingFields(missingFields: string[], source: "template" | "nibrs", templateName?: string) {
  const categories = {
    personal: ["victim", "offender", "age", "sex", "race", "ethnicity", "gender", "name"],
    incident: ["date", "time", "location", "offense", "incident", "description"],
    property: ["property", "value", "description", "loss", "item", "stolen"],
    administrative: ["incident", "report", "officer", "number", "id"]
  };

  const categorized: { [key: string]: string[] } = {};

  missingFields.forEach(field => {
    const fieldLower = field.toLowerCase();
    let categorizedField = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => fieldLower.includes(keyword))) {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(field);
        categorizedField = true;
        break;
      }
    }
    
    if (!categorizedField) {
      if (!categorized.other) categorized.other = [];
      categorized.other.push(field);
    }
  });

  return categorized;
}

// Create system instructions for narrative report
function createNarrativeSystemInstructions(template: any) {
  if (!template) {
    return `You are a professional police report writer. Convert the officer's narrative into a standardized format.`;
  }

  const fieldDefinitions = template.fieldDefinitions || {};
  const requiredFields = template.requiredFields || [];
  
  const requiredFieldsText = requiredFields.map((field: string) => {
    const def = fieldDefinitions[field];
    return `- ${field}: ${def?.description || 'No description'} ${def?.required ? '(REQUIRED)' : ''}`;
  }).join('\n') || 'No specific fields required';

  return `
POLICE REPORT TEMPLATE CONVERSION

TEMPLATE REQUIREMENTS:
${requiredFieldsText}

TEMPLATE INSTRUCTIONS:
${template.instructions || 'Convert the narrative into a professional police report format.'}

FORMATTING RULES:
- Use the exact structure provided in the examples
- Only include information explicitly stated in the narrative
- Mark missing information as "INFORMATION NOT PROVIDED"
- Use professional law enforcement terminology
`;
}

// Helper function to parse JSON safely
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

// Calculate accuracy score for NIBRS reports
function calculateAccuracyScore(data: any, validationErrors: string[] = [], warnings: string[] = []): number {
  if (!data) return 0;
  
  let baseScore = 100;
  baseScore -= validationErrors.length * 10;
  baseScore -= warnings.length * 5;
  
  if (!data.offenses || data.offenses.length === 0) baseScore -= 20;
  if (!data.victims || data.victims.length === 0) baseScore -= 15;
  if (!data.properties || data.properties.length === 0) baseScore -= 10;
  
  if (data.offenses && Array.isArray(data.offenses)) {
    data.offenses.forEach((offense: any) => {
      if (offense.mappingConfidence && offense.mappingConfidence < 0.6) {
        baseScore -= 15;
      } else if (offense.mappingConfidence && offense.mappingConfidence < 0.8) {
        baseScore -= 5;
      }
    });
  }
  
  return Math.max(0, Math.min(100, baseScore));
}

// Enhanced NIBRS error extraction with better categorization
function extractNIBRSErrorDetails(error: Error, descriptiveData?: any) {
  const errorMessage = error.message || "NIBRS report generation failed";
  const details = {
    error: errorMessage,
    missingFields: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[],
    categorizedFields: {} as any,
  };

  // Parse common NIBRS error patterns
  if (errorMessage.toLowerCase().includes("victim") || errorMessage.includes("Non-victimless offenses require")) {
    details.missingFields.push("Victim information");
    details.suggestions.push("Add victim type (Individual, Society/Public, or Business)");
    details.suggestions.push("For drug/weapon offenses, use 'Society/Public' victim type");
    details.suggestions.push("For assaults/thefts, use 'Individual' victim type");
  }
  
  if (errorMessage.toLowerCase().includes("offense") || errorMessage.includes("No offense descriptions")) {
    details.missingFields.push("Offense description");
    details.suggestions.push("Specify the criminal offense type (e.g., Burglary, Assault, Theft)");
    details.suggestions.push("Use NIBRS-standard offense descriptions");
  }
  
  if (errorMessage.toLowerCase().includes("property")) {
    details.missingFields.push("Property details");
    details.suggestions.push("Describe stolen/damaged property");
    details.suggestions.push("Include property values if available");
  }

  if (errorMessage.toLowerCase().includes("location")) {
    details.missingFields.push("Location information");
    details.suggestions.push("Provide specific location or address");
  }

  if (errorMessage.toLowerCase().includes("date")) {
    details.missingFields.push("Incident date");
    details.suggestions.push("Include when the incident occurred");
  }

  // Add general suggestions if no specific fields identified
  if (details.missingFields.length === 0) {
    details.suggestions.push("Review the narrative for missing crime details");
    details.suggestions.push("Ensure all required NIBRS fields are provided");
  }

  // Categorize the missing fields
  details.categorizedFields = categorizeMissingFields(details.missingFields, "nibrs");

  return details;
}

export async function POST(req: Request) {
  let startTime = Date.now();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    const body = await req.json();
    const { prompt, selectedTemplate, generateBoth = true, correctedData } = body;
    startTime = Date.now();

    if (!userId) return new NextResponse("Unauthorized User", { status: 401 });
    if (!openai.apiKey) return new NextResponse("OpenAI API key is Invalid", { status: 500 });
    if (!prompt) return new NextResponse("Prompt is required", { status: 400 });

    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrail && !isPro) return new NextResponse("Free Trial has expired", { status: 403 });

    // Get user's organization using shared utility
    const organization = await getUserOrganizationWithFallback(userId);

    // STEP 1: VALIDATE INPUT COMPLETENESS FOR NARRATIVE 
    if (selectedTemplate?.strictMode !== false && selectedTemplate?.requiredFields?.length > 0 && !correctedData) {
      console.log("=== VALIDATING NARRATIVE TEMPLATE REQUIREMENTS ===");
      const validationResult = await validateInputCompleteness(prompt, selectedTemplate);
      
      if (!validationResult.isComplete && validationResult.missingFields.length > 0) {
        console.log("=== VALIDATION FAILED - MISSING REQUIRED FIELDS ===");
        
        await trackReportEvent({
          userId: userId,
          reportType: "narrative",
          processingTime: Date.now() - startTime,
          success: false,
          templateUsed: selectedTemplate?.templateName,
          error: `Validation failed: ${validationResult.missingFields.join(', ')}`
        });

        // Enhanced error response with categorization
        const categorizedFields = categorizeMissingFields(
          validationResult.missingFields, 
          "template", 
          selectedTemplate?.templateName
        );
        
        return NextResponse.json({
          type: "validation_error",
          error: validationResult.promptForMissingInfo,
          missingFields: validationResult.missingFields,
          presentFields: validationResult.presentFields,
          message: validationResult.promptForMissingInfo,
          isComplete: false,
          confidenceScore: validationResult.confidenceScore,
          source: "template",
          errorCategory: "TEMPLATE_REQUIREMENTS",
          severity: "REQUIRED",
          guidance: `The selected template "${selectedTemplate?.templateName}" requires these fields to generate a complete report.`,
          categorizedFields: categorizedFields,
          templateName: selectedTemplate?.templateName
        }, { status: 200 });
      }
    }

    // STEP 2: GENERATE BOTH REPORTS SIMULTANEOUSLY
    console.log("=== GENERATING BOTH REPORTS SIMULTANEOUSLY ===");
    
    const [narrativeResult, nibrsResult] = await Promise.allSettled([
      generateNarrativeReport(prompt, selectedTemplate),
      generateNIBRSReport(prompt)
    ]);

    // Process narrative result
    let narrativeContent = "";
    if (narrativeResult.status === 'fulfilled') {
      narrativeContent = narrativeResult.value;
    } else {
      console.error("Narrative generation failed:", narrativeResult.reason);
      narrativeContent = "Error generating narrative report. Please try again.";
    }

    // Process NIBRS result
    let nibrsData = null;
    let xmlData = null;
    let accuracyScore = null;
    let nibrsWarnings = [];
    
    if (nibrsResult.status === 'fulfilled') {
      nibrsData = nibrsResult.value.nibrs;
      xmlData = nibrsResult.value.xml;
      accuracyScore = nibrsResult.value.accuracyScore;
      nibrsWarnings = nibrsResult.value.warnings || [];
    } else {
      console.error("NIBRS generation failed:", nibrsResult.reason);
      
      // EXTRACT NIBRS ERROR INFORMATION FOR CORRECTION UI
      const nibrsError = nibrsResult.reason;
      const errorDetails = extractNIBRSErrorDetails(nibrsError);

      // Return NIBRS error to trigger CorrectionUI
      return NextResponse.json({
        type: "nibrs_validation_error",
        ...errorDetails,
        nibrsData: {}, // Empty NIBRS data since generation failed
        confidenceScore: 0,
        isComplete: false,
        source: "nibrs",
        errorCategory: "NIBRS_STANDARDS",
        severity: "REQUIRED",
        guidance: "These fields are required by federal crime reporting standards (NIBRS)."
      }, { status: 200 });
    }

    const processingTime = Date.now() - startTime;

    // STEP 3: SAVE REPORTS AND TRACK ACTIVITY (only if both succeeded)
    if (narrativeContent && nibrsData && !nibrsData.error) {
      // Save to user reports table
      const savedReport = await prismadb.userReports.create({
        data: {
          userId: userId,
          reportName: `${selectedTemplate?.templateName || 'Dual'} Report - ${new Date().toLocaleDateString()}`,
          reportText: narrativeContent,
          tag: 'dual_report'
        }
      });

      // Save to DepartmentReport table using shared organization
      if (organization) {
        const departmentReport = await prismadb.departmentReport.create({
          data: {
            organizationId: organization.id,
            clerkUserId: userId,
            reportType: 'dual_report',
            title: `${selectedTemplate?.templateName || 'Dual'} Report - ${new Date().toLocaleDateString()}`,
            content: narrativeContent,
            nibrsData: JSON.stringify(nibrsData),
            accuracyScore: accuracyScore,
            status: accuracyScore && accuracyScore < 80 ? 'pending_review' : 'submitted',
            submittedAt: new Date(),
            flagged: accuracyScore && accuracyScore < 80
          }
        });

        // Create review queue item if needed using shared utility
        if (accuracyScore && accuracyScore < 80) {
          await createReviewQueueItemIfNeeded(departmentReport, organization.id);
        }

        // Update organization report count
        await prismadb.organization.update({
          where: { id: organization.id },
          data: { 
            reportCount: { increment: 1 },
            updatedAt: new Date()
          }
        });
      }

      // Track success
      await trackReportEvent({
        userId: userId,
        reportType: "dual_report",
        processingTime: processingTime,
        success: true,
        templateUsed: selectedTemplate?.templateName,
      });

      await trackUserActivity({
        userId: userId,
        activity: "report_created",
        metadata: {
          reportType: "dual_report",
          templateUsed: selectedTemplate?.templateName,
          reportId: savedReport.id,
          organizationId: organization?.id,
          hasNibrs: !!nibrsData,
          accuracyScore: accuracyScore
        }
      });

      // Track department activity
      if (organization) {
        await prismadb.departmentActivityLog.create({
          data: {
            organizationId: organization.id,
            userId: userId,
            activityType: 'report_submitted',
            description: `Submitted dual report using ${selectedTemplate?.templateName || 'default'} template`,
            metadata: JSON.stringify({
              reportType: 'dual_report',
              template: selectedTemplate?.templateName,
              processingTime: processingTime,
              hasNibrs: !!nibrsData,
              accuracyScore: accuracyScore
            })
          }
        });
      }

      if (!isPro) await increaseAPiLimit();

      // Save to history
      await saveHistoryReport(userId, `${Date.now()}`, narrativeContent, "dual_report");

      console.log("=== BOTH REPORTS GENERATED SUCCESSFULLY ===");
      
      // Return both reports in unified format
      return NextResponse.json({
        narrative: narrativeContent,
        nibrs: nibrsData,
        xml: xmlData,
        accuracyScore: accuracyScore,
        warnings: nibrsWarnings,
        success: true
      }, { status: 200 });
    } else {
      // If we have narrative but NIBRS failed, return partial success with NIBRS error
      return NextResponse.json({
        narrative: narrativeContent,
        nibrs: { error: "NIBRS report generation failed" },
        success: false,
        message: "Narrative generated but NIBRS report failed"
      }, { status: 200 });
    }

  } catch (error) {
    console.log("[UNIFIED_REPORT_ERROR]", error);
    
    if (userId) {
      await trackReportEvent({
        userId: userId,
        reportType: "dual_report",
        processingTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Narrative Report Generation
async function generateNarrativeReport(prompt: string, selectedTemplate: any): Promise<string> {
  const systemInstructions = createNarrativeSystemInstructions(selectedTemplate);
  
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstructions },
    ...(selectedTemplate?.examples ? [{ role: "system" as const, content: `EXAMPLE FORMAT:\n${selectedTemplate.examples}` }] : []),
    { role: "user", content: `OFFICER NARRATIVE TO CONVERT:\n${prompt}` }
  ];
  
  console.log("=== GENERATING NARRATIVE REPORT ===");
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    temperature: 0.1
  });

  return response.choices[0].message.content || "";
}

// NIBRS Report Generation
async function generateNIBRSReport(prompt: string): Promise<any> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: NIBRS_TEMPLATE_INSTRUCTIONS },
    { role: "user", content: prompt }
  ];

  console.log("=== GENERATING NIBRS REPORT ===");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  let parsed: { extractedData: any; narrative: string };

  try {
    parsed = tryParseJSON(raw);
  } catch (e: any) {
    console.error("JSON parsing failed:", e.message);
    throw new Error("NIBRS data extraction failed - invalid JSON format");
  }

  const descriptiveData = parsed.extractedData || {};
  const narrative = (parsed.narrative || "").trim();

  if (!narrative) {
    throw new Error("Narrative missing from NIBRS extraction");
  }

  // Validate descriptive NIBRS data
  const professionalValidation = validateDescriptiveNibrs({
    ...descriptiveData,
    offenses: descriptiveData.offenses || [],
    victims: descriptiveData.victims || [],
    offenders: descriptiveData.offenders || [],
    properties: descriptiveData.properties || [],
    narrative: narrative
  });

  if (professionalValidation.errors.length > 0) {
    throw new Error(`NIBRS validation failed: ${professionalValidation.errors.join(', ')}`);
  }

  // Map to NIBRS codes
  const mapperValidation = NibrsMapper.validateAndMapExtract({
    ...descriptiveData,
    narrative
  });

  if (mapperValidation.errors.length > 0) {
    throw new Error(`NIBRS mapping failed: ${mapperValidation.errors.join(', ')}`);
  }

  const mapped = mapperValidation.data;

  // Validate NIBRS payload
  const { ok, data, errors, warnings: validationWarnings } = validateNibrsPayload(mapped);

  console.log("NIBRS Validation result:", { ok, errors, warnings: validationWarnings });

  const warnings: string[] = [...validationWarnings];
  
  if (!ok && errors.length > 0) {
    throw new Error(`NIBRS payload validation failed: ${errors.join(', ')}`);
  }

  // Calculate accuracy score
  const accuracyScore = calculateAccuracyScore(data || {}, errors, warnings);

  // Validate with template
  const templateErrors = validateWithTemplate(data || {});
  if (templateErrors.length > 0) {
    warnings.push(...templateErrors);
  }

  // Build XML
  const xml = buildNIBRSXML(data);

  return {
    nibrs: data,
    xml,
    accuracyScore,
    warnings
  };
}