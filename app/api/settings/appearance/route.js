import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch appearance settings
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (settings.length === 0) {
            return NextResponse.json({
                density: 'comfortable',
                accentColor: 'purple',
            });
        }

        return NextResponse.json({
            density: settings[0].density,
            accentColor: settings[0].accentColor,
        });
    } catch (error) {
        console.error('Error fetching appearance:', error);
        return NextResponse.json({ error: 'Failed to fetch appearance settings' }, { status: 500 });
    }
}

// PATCH - Update appearance settings
export async function PATCH(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { density, accentColor } = await request.json();

        const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (existing.length === 0) {
            await db.insert(userSettings).values({
                userId,
                density: density ?? 'comfortable',
                accentColor: accentColor ?? 'purple',
            });
        } else {
            await db.update(userSettings)
                .set({
                    density: density ?? existing[0].density,
                    accentColor: accentColor ?? existing[0].accentColor,
                    updatedAt: new Date(),
                })
                .where(eq(userSettings.userId, userId));
        }

        return NextResponse.json({ success: true, density, accentColor });
    } catch (error) {
        console.error('Error updating appearance:', error);
        return NextResponse.json({ error: 'Failed to update appearance settings' }, { status: 500 });
    }
}
