import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const folders = [
            { id: 'documents', name: 'Documents', count: 12, icon: 'file-text' },
            { id: 'images', name: 'Images', count: 8, icon: 'image' },
            { id: 'videos', name: 'Videos', count: 3, icon: 'video' },
            { id: 'notes', name: 'Notes', count: 25, icon: 'sticky-note' },
            { id: 'exports', name: 'Exports', count: 5, icon: 'download' },
            { id: 'archives', name: 'Archives', count: 2, icon: 'archive' },
        ];

        return NextResponse.json({ folders });
    } catch (error) {
        console.error('Library API error:', error);
        return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 });
    }
}
