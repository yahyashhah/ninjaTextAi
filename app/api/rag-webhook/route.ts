import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Process incoming RAG webhook event
    console.log("RAG Webhook Data:", body);

    // Example: handle different event types
    switch (body.event) {
      case "rag.response.completed":
        console.log("RAG Response Completed:", body.data);
        // maybe save to database or trigger another action
        break;

      case "rag.error":
        console.error("RAG Error:", body.data);
        break;

      default:
        console.log("Unhandled RAG event:", body.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("RAG Webhook Error:", error);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }
}