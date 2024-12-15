import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportType } = await req.json();

    if (!reportType || typeof reportType !== 'string') {
      return NextResponse.json({ message: 'Invalid or missing reportType parameter' }, { status: 400 });
    }

    const templates = await prismadb.uploadTemplates.findMany({
      where: { 
        userId: userId, 
        reportType: reportType,
      },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}