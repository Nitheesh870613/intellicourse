import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logUserEvent, ActivityTypes } from '@/lib/activity';

export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, meta } = await request.json();

        if (!type || !Object.values(ActivityTypes).includes(type)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        const result = await logUserEvent(userId, type, meta || {});

        return NextResponse.json({ success: true, event: result });
    } catch (error) {
        console.error('Activity log error:', error);
        return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }
}
