import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    const body = await request.json();
    
    const { rating, comment, experience, wantsToSee } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!rating) {
      return new NextResponse("Rating is required", { status: 400 });
    }

    const feedback = await prismadb.feedback.create({
      data: {
        userId,
        rating,
        comment: comment || null,
        experience: experience || null,
        wantsToSee: wantsToSee || null,
      }
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("[FEEDBACK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}