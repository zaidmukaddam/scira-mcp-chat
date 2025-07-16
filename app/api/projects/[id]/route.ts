import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, customInstructions, userId } = await request.json();
    
    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId required' }, { status: 400 });
    }

    // Verify the project belongs to the user
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, params.id),
        eq(projects.userId, userId)
      )
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedProject = await db
      .update(projects)
      .set({
        name,
        description,
        customInstructions,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id))
      .returning();

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Verify the project belongs to the user
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, params.id),
        eq(projects.userId, userId)
      )
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if this is the default project
    if (existingProject.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default project' }, { status: 400 });
    }

    // Delete the project (CASCADE will handle related chats and knowledge)
    await db.delete(projects).where(eq(projects.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
