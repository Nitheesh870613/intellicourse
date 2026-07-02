import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch profile data
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clerkUser = await currentUser();

        // Get user from database
        const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
        const dbUser = dbUsers[0];

        return NextResponse.json({
            displayName: dbUser?.firstName || clerkUser?.firstName || '',
            lastName: dbUser?.lastName || clerkUser?.lastName || '',
            email: dbUser?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || '',
            imageUrl: clerkUser?.imageUrl || '',
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PATCH - Update profile data
export async function PATCH(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { displayName, lastName } = await request.json();

        // Update database
        await db.update(users)
            .set({
                firstName: displayName,
                lastName: lastName,
                updatedAt: new Date(),
            })
            .where(eq(users.clerkId, userId));

        // Update Clerk user
        try {
            const client = await clerkClient();
            await client.users.updateUser(userId, {
                firstName: displayName,
                lastName: lastName,
            });
        } catch (clerkError) {
            console.error('Error updating Clerk user:', clerkError);
            // Continue even if Clerk update fails
        }

        return NextResponse.json({ success: true, displayName, lastName });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
