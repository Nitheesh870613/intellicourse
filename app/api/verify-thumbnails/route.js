import { db, courses } from '@/lib/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all courses with their thumbnail info
    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        category: courses.category,
        thumbnail: courses.thumbnail
      })
      .from(courses)
      .orderBy(desc(courses.createdAt))
      .limit(20);

    const results = allCourses.map(course => ({
      id: course.id,
      title: course.title,
      category: course.category,
      hasThumbnail: !!course.thumbnail,
      thumbnailLength: course.thumbnail?.length || 0,
      thumbnailPreview: course.thumbnail?.substring(0, 100) || 'NO THUMBNAIL',
      startsWithDataUri: course.thumbnail?.startsWith('data:image/svg+xml') || false
    }));

    return Response.json({
      total: results.length,
      courses: results,
      summary: {
        withThumbnails: results.filter(c => c.hasThumbnail).length,
        withoutThumbnails: results.filter(c => !c.hasThumbnail).length,
        byCategory: {
          health: results.filter(c => c.category === 'health').map(c => ({
            title: c.title,
            hasThumbnail: c.hasThumbnail
          })),
          programming: results.filter(c => c.category === 'programming').map(c => ({
            title: c.title,
            hasThumbnail: c.hasThumbnail
          })),
          business: results.filter(c => c.category === 'business').map(c => ({
            title: c.title,
            hasThumbnail: c.hasThumbnail
          })),
          technology: results.filter(c => c.category === 'technology').map(c => ({
            title: c.title,
            hasThumbnail: c.hasThumbnail
          }))
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
}
