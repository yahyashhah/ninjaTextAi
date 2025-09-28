import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveUploadTemplate } from '@/lib/templates';

export async function POST(req: NextRequest) {
  const { templateName, instructions, examples, reportTypes, requiredFields, fieldDefinitions, strictMode } = await req.json();

  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    await saveUploadTemplate(
      userId, 
      templateName, 
      instructions, 
      examples, 
      reportTypes,
      requiredFields || [],
      fieldDefinitions || {},
      strictMode !== false // Default to true
    );
    return NextResponse.json({ message: 'Template saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}