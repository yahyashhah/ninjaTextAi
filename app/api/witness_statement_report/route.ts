import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
import { checkSubscription } from "@/lib/subscription";
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
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt, selectedTemplate } = body;

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
      model: "gpt-4",
      messages,
    });

    if (!isPro) {
      await increaseAPiLimit();
    }

    await saveHistoryReport(
      userId,
      `${Date.now()}`,
      response.choices[0].message.content || "",
      "witness"
    );

    console.log(response);
    return NextResponse.json(response.choices[0].message, { status: 200 });
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}