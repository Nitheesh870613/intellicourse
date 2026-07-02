import { db, courses } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateCategoryThumbnail } from '@/lib/utils/categoryThumbnails';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'health';
    
    // Generate fresh thumbnail
    const freshThumbnail = generateCategoryThumbnail(category);
    
    // Get a course from this category
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.category, category))
      .limit(1);

    if (!course) {
      return Response.json({
        error: 'No course found in this category',
        category
      });
    }

    // Decode the thumbnails to compare
    const decodeFreshThumb = decodeURIComponent(freshThumbnail.replace('data:image/svg+xml,', ''));
    const decodeDbThumb = course.thumbnail ? decodeURIComponent(course.thumbnail.replace('data:image/svg+xml,', '')) : 'NO THUMBNAIL';

    return Response.json({
      category,
      courseTitle: course.title,
      courseId: course.id,
      hasThumbnailInDb: !!course.thumbnail,
      thumbnailLength: course.thumbnail?.length || 0,
      freshThumbnail,
      dbThumbnail: course.thumbnail,
      decodedFresh: decodeFreshThumb,
      decodedDb: decodeDbThumb.substring(0, 500),
      match: freshThumbnail === course.thumbnail
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
}
