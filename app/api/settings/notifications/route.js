import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch notification settings
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get settings from database
        const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (settings.length === 0) {
            // Return defaults if no settings exist
            return NextResponse.json({
                emailUpdates: true,
                quizReminders: true,
                aiTips: true,
            });
        }

        return NextResponse.json({
            emailUpdates: settings[0].emailUpdates,
            quizReminders: settings[0].quizReminders,
            aiTips: settings[0].aiTips,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// PATCH - Update notification settings
export async function PATCH(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emailUpdates, quizReminders, aiTips } = await request.json();

        // Check if settings exist
        const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (existing.length === 0) {
            // Create new settings
            await db.insert(userSettings).values({
                userId,
                emailUpdates: emailUpdates ?? true,
                quizReminders: quizReminders ?? true,
                aiTips: aiTips ?? true,
            });
        } else {
            // Update existing settings
            await db.update(userSettings)
                .set({
                    emailUpdates: emailUpdates ?? existing[0].emailUpdates,
                    quizReminders: quizReminders ?? existing[0].quizReminders,
                    aiTips: aiTips ?? existing[0].aiTips,
                    updatedAt: new Date(),
                })
                .where(eq(userSettings.userId, userId));
        }

        return NextResponse.json({ success: true, emailUpdates, quizReminders, aiTips });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
