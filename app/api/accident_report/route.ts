import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

import { matchCode, NIBRS_LOCATION_CODES, NIBRS_OFFENSE_CODES, NIBRS_PROPERTY_CODES, NIBRS_RELATIONSHIP_CODES, NIBRS_WEAPON_CODES } from "@/lib/nibrs/codes";
import { validateNibrsPayload } from "@/lib/nibrs/Validator";
import { NibrsExtract } from "@/lib/nibrs/schema";
import { buildNibrsXML } from "@/lib/nibrs/xml";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  "offenseCode": string,          // Prefer official NIBRS code like 13A; if unsure, give a descriptive label we can map
  "offenseAttemptedCompleted": "A" | "C",
  "locationCode": string,         // prefer NIBRS location code; if unsure, give a descriptive label we can map
  "weaponCode": string (optional),
  "biasMotivationCode": string (optional),
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
    "relationshipToVictim": string (optional)
  },
  "property": {
    "lossType": string (optional),
    "descriptionCode": string (optional),
    "value": number (optional)
  }
}

2) Produce a clear professional narrative paragraph(s) for MS Word.

IMPORTANT:
- Return a SINGLE JSON document with top-level keys "nibrs" and "narrative" ONLY:
  {
    "nibrs": { ...exact structure above... },
    "narrative": "..."
  }
- Use double quotes and valid JSON. Do not add markdown, comments, or extra text.
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
    let parsed: { nibrs: Partial<NibrsExtract>; narrative: string };

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error("Model did not return valid JSON. Raw response: " + raw);
    }

    // --- Mapping / Normalization ---
    const n = parsed.nibrs || {};
    // Ensure incidentNumber exists (fallback)
    if (!n.incidentNumber) {
      n.incidentNumber = `INC-${Date.now()}`;
    }

    // Try to map descriptive offense/location/etc. to codes if needed
    const mapped: Partial<NibrsExtract> = { ...n };

    if (mapped.offenseCode && !/^[0-9A-Z]{3}$/.test(mapped.offenseCode)) {
      const m = matchCode(mapped.offenseCode, NIBRS_OFFENSE_CODES);
      if (m) mapped.offenseCode = m;
    }

    if (mapped.locationCode && !/^[0-9]{2}$/.test(mapped.locationCode)) {
      const m = matchCode(mapped.locationCode, NIBRS_LOCATION_CODES);
      if (m) mapped.locationCode = m;
    }

    if (mapped.weaponCode && !/^[0-9]{2}$/.test(mapped.weaponCode)) {
      const m = matchCode(mapped.weaponCode, NIBRS_WEAPON_CODES);
      if (m) mapped.weaponCode = m;
    }

    if (mapped.property?.descriptionCode && !/^[0-9]{2}$/.test(mapped.property.descriptionCode)) {
      const m = matchCode(mapped.property.descriptionCode, NIBRS_PROPERTY_CODES);
      mapped.property = {
        ...mapped.property,
        descriptionCode: m || mapped.property.descriptionCode
      };
    }

    if (mapped.offender?.relationshipToVictim && !/^[A-Z]{2}$/.test(mapped.offender.relationshipToVictim)) {
      const m = matchCode(mapped.offender.relationshipToVictim, NIBRS_RELATIONSHIP_CODES);
      mapped.offender = {
        ...mapped.offender,
        relationshipToVictim: m || mapped.offender.relationshipToVictim
      };
    }

    // Defaults
    mapped.offenseAttemptedCompleted = mapped.offenseAttemptedCompleted || "C";
    mapped.clearedExceptionally = mapped.clearedExceptionally || "N";

    // Attach narrative
    const narrative = (parsed.narrative || "").trim();
    if (!narrative) throw new Error("Narrative missing from model output");
    mapped.narrative = narrative;

    // Validate
    const { ok, data, errors } = validateNibrsPayload(mapped);
    if (!ok || !data) {
      throw new Error("NIBRS validation failed: " + (errors?.join("; ") || "Unknown error"));
    }

    // Build XML
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
        xml, // frontend will create a download from this string
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