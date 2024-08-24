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
                Task: Be professional Police Report writer. Write an supplemenmtal report using only information given below. Make sure to use the provided format, and any information that is not mentioned in the text given below.
                Please provide additional details or updates related to a previous report, including the following information:
                Audience: Police Officer
                Note: Strictly follow the format and be to the point while providing details. Don't add additional details by yourself.
                Output Format: 
                • Original Report Reference: Specify the reference number or details of the original report.
                • Date and Time: When did the supplemental information arise or become relevant?
                • Nature of Supplement: Describe the new information or updates that need to be added to the original report.
                • Statements: Summarize any new statements made by involved parties or witnesses.
                • Evidence: Describe any new evidence collected or observations made since the original report.
                • Outcome: How does this supplemental information affect the outcome or understanding of the incident?
                • Officer Actions: Detail any actions you took related to gathering or documenting the supplemental information.
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
    return NextResponse.json(response.choices[0].message.content, { status: 200 });
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
