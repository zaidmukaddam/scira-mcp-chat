import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeBase } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Knowledge ID required' }, { status: 400 });
    }

    await db
      .delete(knowledgeBase)
      .where(eq(knowledgeBase.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge' }, { status: 500 });
  }
}
