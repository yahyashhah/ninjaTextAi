import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportTypes } = await req.json();

    // Validate that reportTypes exists and is an array
    if (!reportTypes || !Array.isArray(reportTypes)) {
      return NextResponse.json(
        { message: 'reportTypes must be an array' }, 
        { status: 400 }
      );
    }

    // Filter templates where reportTypes contains ANY of the provided values
    const templates = await prismadb.uploadTemplates.findMany({
      where: { 
        userId: userId,
        reportTypes: {
          hasSome: reportTypes // Use hasSome to find records containing any of the array values
        }
      },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}