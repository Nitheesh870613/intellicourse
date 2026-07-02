import { db, courses } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all unique categories from courses
    const result = await db.execute(
      sql`SELECT DISTINCT category, COUNT(*) as count FROM courses GROUP BY category ORDER BY category`
    );

    return Response.json({
      categories: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
}
