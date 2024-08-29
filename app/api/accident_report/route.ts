import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { saveHistoryReport } from "@/lib/history-reports";
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
                Task: Be a Professional Police Report writer and extract the following details from the user text given below.
                Task: Be accuarte while extracting the details given below
                Details: 
                • Date and Time: If any 
                • Location: If any 
                • Involved Parties: if any (extract the exact text from the report)
                • Sequence of Events: if any (extract the events step by step from the user text)
                • Witness Statements: if any (create exact summary of witness statement)
                • Evidence: if any 
                • Injuries and Damages: if any
                • Resolution: Extract the outcome of accident (if any)
                • Officer Actions: if any (what was the action of officer)
                • Body cam: if any (Was a body cam used?)
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
    await saveHistoryReport(
      userId,
      `${Date.now()}`,
      response.choices[0].message.content || "",
      "accident"
    );

    console.log(response);
    return NextResponse.json(response.choices[0].message, { status: 200 });
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
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
