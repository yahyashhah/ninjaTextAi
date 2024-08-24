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
                Task: Be professional Police Report writer. Write an use of force report using only information given below. 
                Make sure to use the provided format given below. Please provide a detailed account of the use of force incident, including the following information:
                Audience: Police Officer
                Note: Strictly follow the format and be to the point while providing details. Don't add additional details by yourself.
                Output Format: 
                • Date and Time: When did the use of force occur?
                • Location: Where did the incident take place?
                • Subject Information: Provide details about the subject(s) involved, including name, description, and reason for use of force.
                • Force Used: Describe the type of force used and the circumstances leading to its use.
                • Witness Statements: Summarize any statements made by witnesses or involved parties.
                • Evidence: Describe any evidence collected at the scene (e.g., body camera footage, injuries).
                • Injuries: Note any injuries sustained by officers or subjects involved.
                • Resolution: What was the outcome of the use of force incident? Include any arrests made, medical assistance provided, and reports filed.
                • Officer Actions: Detail any actions you took during the incident, including attempts to de-escalate and justification for use of force.
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
