import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateTemplate } from "@/lib/templates";

export async function PUT(request: Request) {
  const { userId } = auth();
  const body = await request.json();

  const { id, templateName, instructions } = body;

  if (!id) {
    return NextResponse.json({ error: "Template ID not found" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  await updateTemplate(id, templateName, instructions);
  console.log("Template updated");

  return NextResponse.json({ message: "Template updated" }, { status: 200 });
}
