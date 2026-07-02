import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, chapters, users, moduleProgress } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { validateYouTubeUrls, normalizeYouTubeUrls } from '@/lib/utils/youtube';
import { generateCategoryThumbnail } from '@/lib/utils/categoryThumbnails';
import { logCourseCreated } from '@/lib/activity-logger';

// GET - Fetch user's courses with completion data
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create the user by Clerk ID
    let existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existingUsers.length === 0) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || 'unknown@example.com';
      const firstName = clerkUser?.firstName || null;
      const lastName = clerkUser?.lastName || null;
      const [created] = await db
        .insert(users)
        .values({ clerkId: userId, email, firstName, lastName })
        .returning();
      existingUsers = [created];
    }

    const dbUserId = existingUsers[0].id;

    // Fetch courses
    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, dbUserId))
      .orderBy(courses.createdAt);

    // Fetch module progress for all user's courses
    let allProgress = [];
    try {
      allProgress = await db
        .select()
        .from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.userId, dbUserId),
            eq(moduleProgress.isCompleted, true)
          )
        );
    } catch (e) {
      // Table might not exist yet
      console.log('Could not fetch module progress:', e.message);
    }

    // Group completed modules by courseId
    const progressByCourse = {};
    allProgress.forEach(p => {
      if (!progressByCourse[p.courseId]) {
        progressByCourse[p.courseId] = new Set();
      }
      progressByCourse[p.courseId].add(p.moduleId);
    });

    // Add completion data to courses
    const coursesWithProgress = userCourses.map(course => {
      const completedSet = progressByCourse[course.id] || new Set();
      const completedCount = completedSet.size;
      const totalModules = course.modules?.length || course.chapterCount || 5;
      const progressPercentage = totalModules > 0
        ? Math.round((completedCount / totalModules) * 100)
        : 0;

      return {
        ...course,
        completedModules: completedCount,
        totalModules: totalModules,
        progressPercentage: progressPercentage,
      };
    });

    return NextResponse.json({ courses: coursesWithProgress });
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Return empty array instead of error for better UX
    return NextResponse.json({ courses: [] });
  }
}

// POST - Create new course
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create the user by Clerk ID
    let existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existingUsers.length === 0) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || 'unknown@example.com';
      const firstName = clerkUser?.firstName || null;
      const lastName = clerkUser?.lastName || null;
      const [created] = await db
        .insert(users)
        .values({ clerkId: userId, email, firstName, lastName })
        .returning();
      existingUsers = [created];
    }

    const body = await request.json();
    const {
      title,
      course_title,
      description,
      category,
      difficulty,
      duration,
      chapterCount,
      includeVideos,
      includeQuiz,
      include_videos,
      include_quiz,
      videoUrls,
      topic,
      modules,
      generatedChapters,
      quizzes
    } = body;

    // Validate and normalize video URLs if includeVideos is true
    let processedVideoUrls = null;
    if (includeVideos && videoUrls && Array.isArray(videoUrls) && videoUrls.length > 0) {
      const { valid, invalid } = validateYouTubeUrls(videoUrls);

      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: 'Invalid YouTube URLs provided',
            invalidUrls: invalid
          },
          { status: 400 }
        );
      }

      processedVideoUrls = normalizeYouTubeUrls(valid);
    }

    // Debug logging for new structure
    console.log('💾 Saving course with new JSONB structure:');
    console.log('📋 Received data:', JSON.stringify({
      course_title,
      title,
      include_quiz,
      includeQuiz,
      include_videos,
      includeVideos,
      modulesCount: modules?.length || 0,
      chaptersCount: generatedChapters?.length || 0
    }, null, 2));

    console.log(`   📚 Course Title: ${course_title || title}`);
    console.log(`   🧩 Include Quiz: ${include_quiz || includeQuiz || false}`);
    console.log(`   🎥 Include Videos: ${include_videos || includeVideos || false}`);

    if (modules && Array.isArray(modules)) {
      const modulesWithQuiz = modules.filter(m => m.quiz && m.quiz.length > 0);
      console.log(`   📖 Modules: ${modules.length} total, ${modulesWithQuiz.length} with quizzes`);
      modulesWithQuiz.forEach(m => {
        console.log(`      🧠 ${m.title}: ${m.quiz.length} questions`);
      });
    } else {
      console.log('   ⚠️ No modules data received');
    }

    if (generatedChapters && Array.isArray(generatedChapters)) {
      const chaptersWithQuiz = generatedChapters.filter(ch => ch.quiz && ch.quiz.length > 0);
      console.log(`   📝 Chapters: ${generatedChapters.length} total, ${chaptersWithQuiz.length} with quizzes`);
    }

    // Create course with new JSONB structure
    const courseTitle = course_title || title || `${topic} Course`;
    const courseCategory = category || 'General';

    // Generate category-based thumbnail
    const thumbnail = generateCategoryThumbnail(courseCategory);

    const [newCourse] = await db
      .insert(courses)
      .values({
        userId: existingUsers[0].id,
        title: courseTitle, // Required NOT NULL field
        course_title: courseTitle, // New field for API compatibility
        description: description || `Learn ${topic} with this comprehensive course.`,
        category: courseCategory,
        difficulty: difficulty || 'Beginner',
        duration: duration || '1-2 hours',
        chapterCount: chapterCount || (generatedChapters && generatedChapters.length) || (modules && modules.length) || 3, // Required NOT NULL field
        modules: modules || [], // Store complete modules as JSONB
        include_quiz: include_quiz || includeQuiz || false,
        include_videos: include_videos || includeVideos || false,
        topic: topic || courseTitle,
        thumbnail: thumbnail, // SVG data URI based on category
        userDescription: description
      })
      .returning();

    console.log(`✅ Course saved with ID: ${newCourse.id}`);

    // Log COURSE_CREATED activity (after successful DB insert)
    await logCourseCreated(userId, newCourse.id, courseTitle, 'AI');

    // Create chapters with enhanced structure support
    if (generatedChapters && Array.isArray(generatedChapters) && generatedChapters.length > 0) {
      const chapterData = generatedChapters.map((chapter, index) => {
        // Handle both old and new chapter formats
        const points = Array.isArray(chapter.points) ? chapter.points :
          Array.isArray(chapter.objectives) ? chapter.objectives :
            Array.isArray(chapter.content) ? chapter.content : [];

        const contentText = points.join('\n');
        const urls = Array.isArray(chapter.videoUrls) && chapter.videoUrls.length > 0 ? chapter.videoUrls : null;

        // Enhanced chapter data with new fields
        return {
          courseId: newCourse.id,
          title: chapter.title,
          description: chapter.description || `Learn about ${chapter.title}`,
          duration: '10-15 minutes', // Default duration
          content: contentText,
          videoUrls: urls, // store array of embed URLs or null
          videoUrl: chapter.videoUrl || null, // single video URL for frontend
          quiz: chapter.quiz || null, // quiz data as JSONB
          orderIndex: chapter.orderIndex || index + 1
        };
      });

      if (chapterData.length > 0) {
        // Debug logging for quiz data
        if (includeQuiz) {
          const chaptersWithQuiz = chapterData.filter(ch => ch.quiz && Array.isArray(ch.quiz) && ch.quiz.length > 0);
          console.log(`💾 Saving ${chaptersWithQuiz.length}/${chapterData.length} chapters with quiz data`);
          chaptersWithQuiz.forEach(ch => {
            console.log(`   📝 ${ch.title}: ${ch.quiz.length} questions`);
          });
        }

        await db.insert(chapters).values(chapterData);
        console.log(`✅ Successfully saved ${chapterData.length} chapters to database`);
      }
    }

    return NextResponse.json({
      success: true,
      course: newCourse
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}


