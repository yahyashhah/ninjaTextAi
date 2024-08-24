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
                Task: Be professional Police Report writer. Write an witness statement report using only information given below. Make sure to use the provided format, and any information that is not mentioned in the text given below.
                Please indicate in a paragraph at the end. Please provide a detailed witness statement, including the following information:
                Audience: Police Officer
                Note: Strictly follow the format and be to the point while providing details. Don't add additional details by yourself.
                Output Format: 
                • Date and Time: When did you witness the incident?
                • Location: Where did the incident take place?
                • Incident Description: Describe what you saw and heard in chronological order.
                • Parties Involved: Identify any individuals involved in the incident.
                • Your Role: Specify your relationship to the incident (e.g., bystander, victim, companion).
                • Observations: Include any observations or details that may be relevant to the incident.
                • Statements: Summarize any statements made by others involved or witnesses.
                • Additional Information: Provide any other relevant details that may assist in the investigation.
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
