// pages/api/delete_template.ts
import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    console.log(id);
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 });
    }

    await prismadb.uploadTemplates.delete({
      where: { id: id},  // Ensure ID is a number if required
    });

    return NextResponse.json({ message: 'Template deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template.' }, { status: 500 });
  }
}