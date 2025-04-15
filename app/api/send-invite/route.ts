// /app/api/send-invite/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, referralLink } = body;

    if (!email || !referralLink) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Form submission received:", { email });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.SENDINBLUE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NinjaTextAI", email: "yahyashah.dev@gmail.com" },
        to: [{ email }],
        subject: "Invitation for NinjaTextAI",
        htmlContent: `<p><strong>You're invited to NinjaTextAI!</strong></p><p>Link: <a href="${referralLink}">${referralLink}</a></p>`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Sendinblue error:", errorData);
      return new NextResponse("Failed to send email", { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({ message: "Email sent!", messageId: data.messageId }, { status: 200 });
  } catch (error) {
    console.error("[SEND_EMAIL_ERROR]", error);
    return new NextResponse("Failed to send email", { status: 500 });
  }
}
