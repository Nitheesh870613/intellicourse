import { db, courses } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('id');

    if (courseId) {
      // Get specific course
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course) {
        return Response.json({ error: 'Course not found' }, { status: 404 });
      }

      // Parse modules to check structure
      const modules = typeof course.modules === 'string' 
        ? JSON.parse(course.modules)
        : course.modules;

      return Response.json({
        course: {
          id: course.id,
          title: course.title,
          category: course.category,
          hasThumbnail: !!course.thumbnail,
          thumbnailLength: course.thumbnail?.length || 0,
          moduleCount: modules?.length || 0,
          modules: modules?.map((m, i) => ({
            index: i + 1,
            title: m.title,
            hasDescription: !!m.description,
            descriptionLength: m.description?.length || 0,
            descriptionPreview: m.description?.substring(0, 200) + '...',
            hasMarkdown: m.description?.includes('##'),
            hasEmojis: /[\u{1F300}-\u{1F9FF}]/u.test(m.description || '')
          }))
        }
      });
    }

    // Get recent courses
    const recentCourses = await db
      .select()
      .from(courses)
      .orderBy(desc(courses.createdAt))
      .limit(5);

    return Response.json({
      totalCourses: recentCourses.length,
      courses: recentCourses.map(c => {
        const modules = typeof c.modules === 'string' 
          ? JSON.parse(c.modules)
          : c.modules;
        
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          hasThumbnail: !!c.thumbnail,
          moduleCount: modules?.length || 0,
          createdAt: c.createdAt
        };
      })
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
