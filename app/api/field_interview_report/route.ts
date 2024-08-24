import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
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
    const { prompt } = body;
    console.log(prompt);

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    if (!openai.apiKey) {
      return new NextResponse("OpenAI API key is Invalid", { status: 500 });
    }
    if (!prompt) {
      return new NextResponse("Prompt us required", { status: 400 });
    }
    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrail && !isPro) {
      return new NextResponse("Free Trail has expired", { status: 403 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
                Task: Be professional Police Report writer. Write an field interview report using only information given below. Make sure to use the provided format, and any information that is not mentioned in the text given below.
                Please indicate in a paragraph at the end. Please provide a detailed account of the field interview, including the following information:
                Audience: Police Officer
                Note: Strictly follow the format and be to the point while providing details. Don't add additional details by yourself.
                Output Format: 
                • Date and Time: When did the field interview occur?
                • Location: Where did the interview take place?
                • Subject Information: Provide details about the individual(s) interviewed, including name, description, and reason for the interview.
                • Interview Details: Summarize the conversation and topics discussed during the interview.
                • Witness Statements: Include any statements made by witnesses or others present during the interview.
                • Evidence: Describe any evidence collected or observations made during the interview (e.g., ID checks, items seized).
                • Outcome: What was the outcome of the field interview? Include any actions taken or referrals made based on the interview.
                • Officer Actions: Detail any actions you took during the interview, including rapport-building techniques and legal considerations.
                • Body cam: Was a body cam used?
                • Additional Info: If any?
                Format: Plain text that can be used for MSWord
                `,
        },
        { role: "user", content: prompt },
      ],
    });
    if (!isPro) {
      await increaseAPiLimit();
    }

    console.log(response);
    return NextResponse.json(response.choices[0].message, { status: 200 });
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
