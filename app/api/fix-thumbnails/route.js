import { db, courses } from '@/lib/db';
import { generateCategoryThumbnail } from '@/lib/utils/categoryThumbnails';
import { sql, isNull, eq } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🔍 Finding courses without thumbnails...');
    
    // Get ALL courses to regenerate thumbnails with fixed gradient IDs
    const coursesWithoutThumbnails = await db
      .select()
      .from(courses);

    console.log(`📊 Found ${coursesWithoutThumbnails.length} courses without thumbnails`);

    if (coursesWithoutThumbnails.length === 0) {
      return Response.json({
        success: true,
        message: 'All courses already have thumbnails!',
        updated: 0
      });
    }

    let updatedCount = 0;

    // Update each course with category-based thumbnail
    for (const course of coursesWithoutThumbnails) {
      const category = course.category || 'programming';
      const thumbnail = generateCategoryThumbnail(category);
      
      await db
        .update(courses)
        .set({ thumbnail })
        .where(eq(courses.id, course.id));
      
      console.log(`✅ Added thumbnail for course ${course.id} (${course.title}) - category: ${category}`);
      updatedCount++;
    }

    console.log(`🎉 Successfully added thumbnails to ${updatedCount} courses!`);

    return Response.json({
      success: true,
      message: `Successfully added thumbnails to ${updatedCount} courses`,
      updated: updatedCount,
      courses: coursesWithoutThumbnails.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category
      }))
    });

  } catch (error) {
    console.error('❌ Error adding thumbnails:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
