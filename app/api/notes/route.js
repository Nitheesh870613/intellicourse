import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userNotes, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET - Fetch notes for a course or module
export async function GET(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query
    let query = db
      .select()
      .from(userNotes)
      .where(
        and(
          eq(userNotes.userId, user.id),
          eq(userNotes.courseId, courseId)
        )
      );

    // Filter by module if specified
    if (moduleId) {
      query = query.where(eq(userNotes.moduleId, moduleId));
    }

    const notes = await query.orderBy(desc(userNotes.isPinned), desc(userNotes.updatedAt));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      courseId,
      moduleId,
      moduleIndex,
      content,
      title,
      isPinned,
      tags
    } = body;

    if (!courseId || !moduleId || moduleIndex === undefined || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create note
    const [note] = await db
      .insert(userNotes)
      .values({
        userId: user.id,
        courseId,
        moduleId,
        moduleIndex,
        content,
        title: title || null,
        isPinned: isPinned || false,
        tags: tags || []
      })
      .returning();

    return NextResponse.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing note
export async function PUT(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      noteId,
      content,
      title,
      isPinned,
      tags
    } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID required' },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if note exists and belongs to user
    const [existingNote] = await db
      .select()
      .from(userNotes)
      .where(
        and(
          eq(userNotes.id, noteId),
          eq(userNotes.userId, user.id)
        )
      )
      .limit(1);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Update note
    const updateData = {
      updatedAt: new Date()
    };

    if (content !== undefined) updateData.content = content;
    if (title !== undefined) updateData.title = title;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (tags !== undefined) updateData.tags = tags;

    const [updatedNote] = await db
      .update(userNotes)
      .set(updateData)
      .where(eq(userNotes.id, noteId))
      .returning();

    return NextResponse.json({
      success: true,
      note: updatedNote
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID required' },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete note (ensure it belongs to the user)
    await db
      .delete(userNotes)
      .where(
        and(
          eq(userNotes.id, noteId),
          eq(userNotes.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
