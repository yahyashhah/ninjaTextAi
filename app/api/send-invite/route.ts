import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail service
  auth: {
    user: "qaziadan.hidayat.skipq@gmail.com", // Your Gmail address
    pass: process.env.G_PASS, // App password or your Gmail account password
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, referralLink } = body;

    if (!email) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Form submission received:", { email });

    // Configure the email transporter
    const info = await transporter.sendMail({
      from: `qaziadan.hidayat.skipq@gmail.com`, // sender address
      to: email, // list of receivers
      subject: `Invitation for NinjaTextAI`, // Subject line
      text: referralLink, // plain text body
      html: `<p><strong>Message:</strong> </p> You are invited to NinjatextAI<p><strong>Phone:</strong> ${
        "Link: " + referralLink
      }</p>`, // HTML body
    });

    console.log("Email sent:", info.messageId);

    return NextResponse.json(
      { message: "Email sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[EMAIL_ERROR]", error);
    return new NextResponse("Failed to send email", { status: 500 });
  }
}
