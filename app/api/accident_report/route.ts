import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
import { trackReportEvent, trackUserActivity } from "@/lib/tracking";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";  // These are the valid roles
  content: string;  // Content will always be a string
};
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {
  let userId: string | null = null; // make accessible to catch
  let startTime = Date.now();       // declare outside try

  try {
    const authResult = auth();
    userId = authResult.userId;

    const body = await req.json();
    const { prompt, selectedTemplate } = body;
    startTime = Date.now();

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    if (!openai.apiKey) {
      return new NextResponse("OpenAI API key is Invalid", { status: 500 });
    }
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrail && !isPro) {
      return new NextResponse("Free Trial has expired", { status: 403 });
    }

    const systemInstructions = selectedTemplate?.instructions || `
      Task: Be a Professional Police Report writer and accurately extract the following details:
      Required Information:
      • Date and Time: Extract the date and time of the incident.
      • Location: Specify the location.
      • Involved Parties: Include exact text for involved parties.
      • Sequence of Events: Outline events step by step.
      • Statements: Capture statements by witnesses.
      • Evidence: List any evidence provided.
      • Injuries and Damages: Detail any injuries or damages.
      • Resolution: Describe any outcomes.
      • Officer Actions: Specify officer actions if mentioned.
      • Body cam: Indicate if body cam footage was referenced.
      • Additional Info: Add any other details.

      Format the response in plain text suitable for MS Word.
    `;

    // Ensure messages has the correct type
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstructions },
      ...(selectedTemplate?.examples
        ? [{ role: "system" as "system", content: `Example Report:\n${selectedTemplate.examples}` }]
        : []),
      { role: "user", content: prompt }
    ];
    
      const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    const processingTime = Date.now() - startTime;

    await trackReportEvent({
      userId,
      reportType: "accident",
      processingTime,
      success: true,
      templateUsed: selectedTemplate?.id || null,
    });

    await trackUserActivity({
      userId,
      activity: "report_created",
      metadata: { reportType: "accident", templateUsed: selectedTemplate?.id },
    });

    if (!isPro) {
      await increaseAPiLimit();
    }

    await saveHistoryReport(
      userId,
      `${Date.now()}`,
      response.choices[0].message.content || "",
      "accident"
    );

    return NextResponse.json(response.choices[0].message, { status: 200 });
  } catch (error: unknown) {
    console.log("[CONVERSATION_ERROR]", error);

    const processingTime = Date.now() - startTime;

    if (userId) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await trackReportEvent({
        userId,
        reportType: "accident",
        processingTime,
        success: false,
        error: errorMessage,
      });

      await trackUserActivity({
        userId,
        activity: "report_failed",
        metadata: { reportType: "accident", error: errorMessage },
      });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Task: Be professional Police Report writer. Write an accident report using only information given below. Make sure to use the provided format, and any information that is not mentioned in the text given below. Please indicate in a paragraph at the end.
//                 Please provide a detailed account of the accident, including the following information:
//                 Audience: Police Officer
//                 Note: Strictly follow the format and be to the point while providing details. Don't add additional details by yourself.
//                 Output Format:
//                 • Date and Time: When did the accident occur?
//                 • Location: Where did the accident take place?
//                 • Involved Parties: Who was involved? Include names, descriptions, and roles (e.g., drivers, passengers, pedestrians).
//                 • Sequence of Events: Describe what happened leading up to, during, and after the accident. Include weather conditions and road conditions.
//                 • Witness Statements: Summarize any statements made by witnesses.
//                 • Evidence: Describe any evidence collected at the scene (e.g., skid marks, vehicle damage).
//                 • Injuries and Damages: Note any injuries sustained and damages observed.
//                 • Resolution: What was the outcome of the accident? Include any citations issued, insurance information exchanged, and reports filed.
//                 • Officer Actions: Detail any actions you took at the accident scene, including traffic control and medical assistance provided.
//                 • Body cam: Was a body cam used?
//                 • Additional Info: If any?
//                 Format: Plain text that can be used for MSWord