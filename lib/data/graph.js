import { db } from '@/lib/db';
import { users, courses, chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCached, setCached, CACHE_TTL } from '@/lib/cache/apiCache';

/**
 * Fetch knowledge graph data for a user
 * @param {string} userId - User's Clerk ID
 * @returns {Promise<{nodes: Array, links: Array, stats: Object}>}
 */
export async function getGraphData(userId) {
    if (!userId) return null;

    // Check cache first
    const cached = await getCached('graph', { userId }, CACHE_TTL.GRAPH_DATA);
    if (cached) {
        return { ...cached, cached: true };
    }

    // Get database user
    const dbUsers = await db.select()
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

    if (dbUsers.length === 0) {
        return { nodes: [], links: [] };
    }

    const dbUserId = dbUsers[0].id;

    // Fetch all courses for this user
    const userCourses = await db.select()
        .from(courses)
        .where(eq(courses.userId, dbUserId));

    // If no courses, return empty graph
    if (userCourses.length === 0) {
        return {
            nodes: [],
            links: [],
            stats: { totalCourses: 0, totalNodes: 0, totalLinks: 0 }
        };
    }

    // Build nodes and links from real data
    const nodes = [];
    const links = [];

    for (const course of userCourses) {
        // Add course node
        const courseNodeId = `course-${course.id}`;
        nodes.push({
            id: courseNodeId,
            label: course.title || course.course_title || 'Untitled Course',
            type: 'course',
            group: 'course',
            data: {
                courseId: course.id,
                title: course.title,
                description: course.description,
                category: course.category,
                difficulty: course.difficulty,
                createdAt: course.createdAt,
                moduleCount: course.modules?.length || course.chapterCount || 0,
            }
        });

        // Process modules from JSONB
        if (course.modules && Array.isArray(course.modules)) {
            course.modules.forEach((module, moduleIndex) => {
                const moduleNodeId = `module-${course.id}-${moduleIndex}`;

                nodes.push({
                    id: moduleNodeId,
                    label: module.title || `Module ${moduleIndex + 1}`,
                    type: 'module',
                    group: 'module',
                    data: {
                        courseId: course.id,
                        courseTitle: course.title,
                        moduleIndex,
                        title: module.title,
                        description: module.description?.substring(0, 200),
                        hasQuiz: module.quiz && module.quiz.length > 0,
                        quizCount: module.quiz?.length || 0,
                    }
                });

                // Link course → module
                links.push({
                    source: courseNodeId,
                    target: moduleNodeId,
                    type: 'contains'
                });

                // If module has chapters
                if (module.chapters && Array.isArray(module.chapters)) {
                    module.chapters.forEach((chapter, chapterIndex) => {
                        const chapterNodeId = `chapter-${course.id}-${moduleIndex}-${chapterIndex}`;

                        nodes.push({
                            id: chapterNodeId,
                            label: chapter.title || `Chapter ${chapterIndex + 1}`,
                            type: 'chapter',
                            group: 'chapter',
                            data: {
                                courseId: course.id,
                                moduleIndex,
                                chapterIndex,
                                title: chapter.title,
                                content: chapter.content?.substring(0, 100),
                            }
                        });

                        // Link module → chapter
                        links.push({
                            source: moduleNodeId,
                            target: chapterNodeId,
                            type: 'contains'
                        });
                    });
                }

                // Add quiz node if exists
                if (module.quiz && module.quiz.length > 0) {
                    const quizNodeId = `quiz-${course.id}-${moduleIndex}`;

                    nodes.push({
                        id: quizNodeId,
                        label: `Quiz: ${module.title}`,
                        type: 'quiz',
                        group: 'quiz',
                        data: {
                            courseId: course.id,
                            moduleIndex,
                            questionCount: module.quiz.length,
                            moduleTitle: module.title,
                        }
                    });

                    // Link module → quiz
                    links.push({
                        source: moduleNodeId,
                        target: quizNodeId,
                        type: 'has_quiz'
                    });
                }
            });
        }

        // Also fetch chapters from chapters table (for older courses)
        try {
            const courseChapters = await db.select()
                .from(chapters)
                .where(eq(chapters.courseId, course.id));

            if (courseChapters.length > 0 && (!course.modules || course.modules.length === 0)) {
                // Only add if no JSONB modules (avoid duplicates)
                courseChapters.forEach((chapter, idx) => {
                    const chapterNodeId = `chapter-table-${chapter.id}`;

                    nodes.push({
                        id: chapterNodeId,
                        label: chapter.title || `Chapter ${idx + 1}`,
                        type: 'chapter',
                        group: 'chapter',
                        data: {
                            courseId: course.id,
                            chapterId: chapter.id,
                            title: chapter.title,
                            description: chapter.description?.substring(0, 100),
                            hasQuiz: chapter.quiz && chapter.quiz.length > 0,
                        }
                    });

                    // Link course → chapter directly
                    links.push({
                        source: courseNodeId,
                        target: chapterNodeId,
                        type: 'contains'
                    });

                    // Add quiz node for chapter if exists
                    if (chapter.quiz && chapter.quiz.length > 0) {
                        const quizNodeId = `quiz-chapter-${chapter.id}`;

                        nodes.push({
                            id: quizNodeId,
                            label: `Quiz: ${chapter.title}`,
                            type: 'quiz',
                            group: 'quiz',
                            data: {
                                courseId: course.id,
                                chapterId: chapter.id,
                                questionCount: chapter.quiz.length,
                            }
                        });

                        links.push({
                            source: chapterNodeId,
                            target: quizNodeId,
                            type: 'has_quiz'
                        });
                    }
                });
            }
        } catch (e) {
            // Chapters table might not have data for this course
        }
    }

    const result = {
        nodes,
        links,
        stats: {
            totalCourses: userCourses.length,
            totalNodes: nodes.length,
            totalLinks: links.length,
        }
    };

    // Cache result
    await setCached('graph', { userId }, result);

    return result;
}
