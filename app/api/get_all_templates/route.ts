import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAllUploadTemplates } from "@/lib/templates";

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized User", { status: 401 });
    }
    
    const userTemplates = await getAllUploadTemplates();
    console.log(userTemplates)

    return NextResponse.json({ templates: userTemplates }, { status: 200 });
  } catch (error) {
    console.log("[TEMPLATE_SAVE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";