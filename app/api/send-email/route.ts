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
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Form submission received:", { name, email, phone, message });

    // Configure the email transporter
    const info = await transporter.sendMail({
      from: `qaziadan.hidayat.skipq@gmail.com`, // sender address
      to: "qaziadanhidayat@gmail.com", // list of receivers
      subject: `NinjaText AI - General Query of ${name} (${email})`, // Subject line
      text: message, // plain text body
      html: `<p><strong>Message:</strong> ${message}</p><p><strong>Phone:</strong> ${
        phone || "Not provided"
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
