import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeBase } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
  }

  try {
    const knowledge = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.projectId, projectId))
      .orderBy(knowledgeBase.createdAt);

    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and projectId required' }, { status: 400 });
    }

    // Process file content (you might want to use a service like Azure Document Intelligence or similar)
    const content = await file.text();
    
    const knowledge = await db
      .insert(knowledgeBase)
      .values({
        id: nanoid(),
        projectId,
        fileName: file.name,
        fileType: file.type,
        content,
        metadata: {
          size: file.size,
          uploadDate: new Date().toISOString(),
        },
      })
      .returning();

    return NextResponse.json(knowledge[0]);
  } catch (error) {
    console.error('Error uploading knowledge:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
