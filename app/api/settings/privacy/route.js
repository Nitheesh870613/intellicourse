import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch privacy settings
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (settings.length === 0) {
            return NextResponse.json({
                publicProfile: false,
                shareActivity: true,
            });
        }

        return NextResponse.json({
            publicProfile: settings[0].publicProfile,
            shareActivity: settings[0].shareActivity,
        });
    } catch (error) {
        console.error('Error fetching privacy:', error);
        return NextResponse.json({ error: 'Failed to fetch privacy settings' }, { status: 500 });
    }
}

// PATCH - Update privacy settings
export async function PATCH(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { publicProfile, shareActivity } = await request.json();

        const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (existing.length === 0) {
            await db.insert(userSettings).values({
                userId,
                publicProfile: publicProfile ?? false,
                shareActivity: shareActivity ?? true,
            });
        } else {
            await db.update(userSettings)
                .set({
                    publicProfile: publicProfile ?? existing[0].publicProfile,
                    shareActivity: shareActivity ?? existing[0].shareActivity,
                    updatedAt: new Date(),
                })
                .where(eq(userSettings.userId, userId));
        }

        return NextResponse.json({ success: true, publicProfile, shareActivity });
    } catch (error) {
        console.error('Error updating privacy:', error);
        return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 });
    }
}
