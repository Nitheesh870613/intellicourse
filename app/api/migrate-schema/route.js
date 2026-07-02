import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔧 Running database schema migration...');
    
    const results = [];
    
    // Simple approach - just return instructions for manual migration
    // since we can't guarantee the database connection method
    
    const migrationSQL = `
-- Add missing columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS include_quiz BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS include_videos BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_title TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS chapter_count INTEGER DEFAULT 3;

-- Add missing columns to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS quiz JSONB;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update NULL values to defaults
UPDATE courses SET include_quiz = FALSE WHERE include_quiz IS NULL;
UPDATE courses SET include_videos = FALSE WHERE include_videos IS NULL;
UPDATE courses SET chapter_count = 3 WHERE chapter_count IS NULL;
    `.trim();
    
    return NextResponse.json({
      success: true,
      message: 'Migration SQL generated successfully',
      sql: migrationSQL,
      instructions: [
        'Copy the SQL below',
        'Connect to your PostgreSQL database',
        'Run the SQL commands',
        'Restart your application',
        'Try generating a course again'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed: ' + error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
