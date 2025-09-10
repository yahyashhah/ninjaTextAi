import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

import {
  NIBRS_LOCATION_CODES,
  NIBRS_OFFENSE_CODES,
  NIBRS_PROPERTY_CODES,
  NIBRS_RELATIONSHIP_CODES,
  NIBRS_WEAPON_CODES
} from "@/lib/nibrs/codes";

import { validateNibrsPayload } from "@/lib/nibrs/Validator";
import { validateWithTemplate } from "@/lib/nibrs/templates";
import { NibrsExtract } from "@/lib/nibrs/schema";
import { buildNibrsXML } from "@/lib/nibrs/xml";
import { NibrsMapper } from "@/lib/nibrs/mapper";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Try to recover JSON from model output if it wrapped it in markdown or text. */
function tryParseJSON(raw: string) {
  raw = (raw || "").trim();
  // quick path
  try {
    return JSON.parse(raw);
  } catch { /* fallthrough */ }

  // remove code fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch {}
  }

  // try to find first { and last } and parse substring
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const substr = raw.slice(first, last + 1);
    try { return JSON.parse(substr); } catch {}
  }

  // give up
  throw new Error("Model output is not valid JSON.");
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
From the user's free text, do TWO things:

1) Produce a NIBRS-aligned JSON object with these exact keys:
{
  "incidentNumber": string,
  "incidentDate": "YYYY-MM-DD",
  "incidentTime": "HH:mm" (if available, else omit),
  "clearedExceptionally": "Y" | "N",
  "exceptionalClearanceDate": "YYYY-MM-DD" (optional),
  "offenseDescription": string,
  "offenseAttemptedCompleted": "A" | "C",
  "locationDescription": string,
  "weaponDescription": string (optional),
  "biasMotivation": string (optional),
  "victim": {
    "type": "I" | "B" | "F" | "G" | "L" | "O" | "P" | "R" | "S" | "U" (optional),
    "age": number (optional),
    "sex": "M" | "F" | "U" (optional),
    "race": "W" | "B" | "I" | "A" | "P" | "U" (optional),
    "ethnicity": "H" | "N" | "U" (optional),
    "injury": string (optional)
  },
  "offender": {
    "age": number (optional),
    "sex": "M" | "F" | "U" (optional),
    "race": "W" | "B" | "I" | "A" | "P" | "U" (optional),
    "ethnicity": "H" | "N" | "U" (optional),
    "relationshipDescription": string (optional)
  },
  "property": {
    "lossDescription": string (optional),
    "propertyDescription": string (optional),
    "value": number (optional)
  }
}

2) Produce a clear professional narrative paragraph(s) for MS Word.

CRITICAL RULES:
- For drug crimes: DO NOT include victim data
- For weapon violations: DO NOT include victim data  
- For public intoxication: DO NOT include victim data
- For business crimes: use relationshipDescription "business" not "stranger"
- For shoplifting: use offenseDescription "shoplifting"
- For credit card fraud: use offenseDescription "credit card fraud"
- For multiple stolen items: include all in propertyDescription like "laptop ($1200) and jewelry ($3500)"
- For seized evidence: use lossDescription "seized as evidence"
- For damaged property: use lossDescription "damaged" or "vandalized"
- For cleared arrests: ensure clearedExceptionally is "N" (system will detect arrest)

IMPORTANT:
- Return a SINGLE JSON document with top-level keys "extractedData" and "narrative" ONLY
- Use double quotes and valid JSON. Do not add markdown, comments, or extra text.
- NEVER output NIBRS codes - only descriptive text that we can map to codes.
`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstructions },
      ...(selectedTemplate?.examples
        ? [{ role: "system" as const, content: `Example Report:\n${selectedTemplate.examples}` }]
        : []),
      { role: "user", content: prompt }
    ];

    // Get structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let parsed: { extractedData: any; narrative: string };

    try {
      parsed = tryParseJSON(raw);
    } catch (e: any) {
      throw new Error("Model did not return valid JSON. Raw response: " + raw);
    }

    // Map descriptive data to NIBRS codes
    const descriptiveData = parsed.extractedData || {};
    const narrative = (parsed.narrative || "").trim();

    if (!narrative) throw new Error("Narrative missing from model output");

    // Use the mapper to convert descriptive text to codes
    const mapped = NibrsMapper.mapDescriptiveToNibrs({
      ...descriptiveData,
      narrative
    });

    // Ensure incidentNumber exists
    if (!mapped.incidentNumber) {
      mapped.incidentNumber = `INC-${Date.now()}`;
    }

    // Defaults
    mapped.offenseAttemptedCompleted = mapped.offenseAttemptedCompleted || "C";
    mapped.clearedExceptionally = mapped.clearedExceptionally || "N";

    // Check mapping confidence and add warnings
    const warnings: string[] = [];
    if (mapped.mappingConfidence?.offense < 0.6) {
      warnings.push(`Low confidence in offense mapping: ${mapped.offenseCode} (confidence: ${mapped.mappingConfidence.offense})`);
    }
    if (mapped.mappingConfidence?.location < 0.6) {
      warnings.push(`Low confidence in location mapping: ${mapped.locationCode} (confidence: ${mapped.mappingConfidence.location})`);
    }

    // Run your existing validator (zod + logical checks)
    const { ok, data, errors } = validateNibrsPayload(mapped);
    
    if (!ok && errors.length > 0) {
      return NextResponse.json({ 
        errors, 
        warnings,
        nibrs: mapped,
        mappingConfidence: mapped.mappingConfidence 
      }, { status: 400 });
    }

    // Also run template-based validation (business rules)
    const templateErrors = validateWithTemplate(mapped);
    if (templateErrors.length > 0) {
      return NextResponse.json({ 
        errors: templateErrors, 
        warnings,
        nibrs: mapped,
        mappingConfidence: mapped.mappingConfidence 
      }, { status: 400 });
    }

    if (!ok || !data) {
      return NextResponse.json({ 
        errors: errors || ["Validation failed"], 
        warnings,
        nibrs: mapped,
        mappingConfidence: mapped.mappingConfidence 
      }, { status: 400 });
    }

    // Build XML if everything is good
    const xml = buildNibrsXML(data);

    const processingTime = Date.now() - startTime;
    await trackReportEvent({
      userId: userId!,
      reportType: "accident",
      processingTime,
      success: true,
      templateUsed: selectedTemplate?.id || null,
    });
    await trackUserActivity({
      userId: userId!,
      activity: "report_created",
      metadata: { reportType: "accident", templateUsed: selectedTemplate?.id },
    });
    if (!isPro) await increaseAPiLimit();

    // Save the human-readable narrative to history (as before)
    await saveHistoryReport(
      userId!,
      `${Date.now()}`,
      narrative,
      "accident"
    );

    return NextResponse.json(
      {
        narrative,
        nibrs: data,
        xml,
        mappingConfidence: mapped.mappingConfidence,
        warnings: warnings.length > 0 ? warnings : undefined
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("[ACCIDENT_REPORT_ERROR]", error?.message || error);

    const processingTime = Date.now() - startTime;
    if (userId) {
      await trackReportEvent({
        userId,
        reportType: "accident",
        processingTime,
        success: false,
        error: error?.message || "Unknown error",
      });
      await trackUserActivity({
        userId,
        activity: "report_failed",
        metadata: { reportType: "accident", error: error?.message || "Unknown error" },
      });
    }

    return new NextResponse(error?.message || "Internal Error", { status: 500 });
  }
}