// app/api/transcribe-audio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkApiLimit, increaseAPiLimit } from "@/lib/api-limits";
import { checkSubscription } from "@/lib/subscription";
import { trackUserActivity } from "@/lib/tracking";
import OpenAI from "openai";

// Increase the maximum duration for this endpoint
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Update the API endpoint with better error handling
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const reportType = formData.get("reportType") as string;

    if (!audioFile) {
      return new NextResponse("Audio file is required", { status: 400 });
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return new NextResponse("File size exceeds 25MB limit", { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'audio/mpeg', 
      'audio/wav', 
      'audio/mp4', 
      'audio/webm', 
      'audio/ogg',
      'audio/x-m4a',
      'audio/aac'
    ];
    
    if (!validTypes.includes(audioFile.type)) {
      return new NextResponse("Unsupported audio format", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();
    
    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired", { status: 403 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file for OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    // Track usage
    await trackUserActivity({
      userId,
      activity: "audio_transcription",
      metadata: { reportType, fileSize: audioFile.size, fileType: audioFile.type },
    });

    if (!isPro) {
      await increaseAPiLimit();
    }

    return NextResponse.json({
      transcript: transcription,
      success: true,
    });

  } catch (error: any) {
    console.error("[AUDIO_TRANSCRIPTION_ERROR]", error);
    
    if (error.status === 401) {
      return new NextResponse("OpenAI API key is invalid", { status: 500 });
    }
    
    if (error.status === 429) {
      return new NextResponse("OpenAI API rate limit exceeded", { status: 429 });
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}