import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveUploadTemplate } from '@/lib/templates';

export async function POST(req: NextRequest) {
  const { templateName, instructions, examples, reportType } = await req.json();

  // Get user ID from Clerk auth
  const { userId } = auth(); // Ensure you pass the req object here

  // Check if user ID exists
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  console.log(examples);
  
  // Save the upload template
  try {
    await saveUploadTemplate(userId, templateName, instructions, examples, reportType);
    return NextResponse.json({ message: 'Template saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}