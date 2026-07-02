import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import { makeCacheKey, getCachedCourse, setCachedCourse } from '@/lib/cache/courseCache';
import { courseGenerationSchema, courseOutputSchema } from '@/lib/validations/course';
import { normalizeGenerateAiPayload } from "@/lib/utils/normalizeGenerateAiPayload";
import { repairLLMOutput } from "@/lib/utils/repairLLMOutput";
import { cleanJSON } from "@/lib/utils/cleanJSON";
import { safeJSONParse } from "@/lib/utils/safeJSONParse";
import { getSafeYouTubeVideos } from '@/lib/youtube/getSafeVideos';
import { generateCourseId } from '@/lib/youtube/videoCache';
import { generateModuleQuiz } from '@/lib/quiz/generateQuiz';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build-and-missing-env',
});

// Helper: Generate module titles for a topic
function generateModuleTitles(topic, count) {
    const titles = [];
    const prefixes = [
        'Introduction to',
        'Fundamentals of',
        'Core Concepts in',
        'Advanced Topics in',
        'Practical Applications of',
        'Best Practices for',
        'Deep Dive into',
        'Mastering'
    ];

    for (let i = 0; i < count; i++) {
        const prefix = prefixes[i % prefixes.length];
        titles.push(`${prefix} ${topic}`);
    }
    return titles;
}

// Helper: Extract section content from raw text
function extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
}


export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const raw = await request.json();
        const body = normalizeGenerateAiPayload(raw);

        // Validate input with Zod
        const validation = courseGenerationSchema.safeParse(body);
        if (!validation.success) {
            console.error("❌ /api/generate/ai Validation Failed:");
            console.error("   Input:", JSON.stringify(body, null, 2));
            console.error("   Errors:", JSON.stringify(validation.error.format(), null, 2));

            return NextResponse.json({
                error: 'Invalid input',
                details: validation.error.format()
            }, { status: 400 });
        }

        const { topic, difficulty, modules: moduleCount, includeQuiz, includeVideos } = validation.data;

        // ========== CACHING SYSTEM ==========
        // Build deterministic cache key based on normalized input
        const cacheKey = makeCacheKey({
            topic,
            difficulty,
            moduleCount,
            includeQuiz,
            includeVideos,
        }, userId);

        // Check cache first - return instantly if found
        const cachedCourse = await getCachedCourse(cacheKey);
        if (cachedCourse) {
            console.log(`⚡ Returning cached course for: "${topic}"`);
            return NextResponse.json({
                success: true,
                course: cachedCourse,
                cached: true,
                message: 'Course loaded from cache',
            });
        }

        console.log(`🔄 Cache miss - Generating new course for: "${topic}"`);
        // ====================================

        // ===== DIFFICULTY-AWARE CONTENT GUIDELINES =====
        const difficultyGuidelines = {
            Beginner: `
STYLE: Write for beginners. Use simple language, analogies, and real-life examples. Explain concepts step-by-step.`,

            Intermediate: `
STYLE: Write for intermediate learners. Use technical terminology, explain how things work, and include practical applications.`,

            Advanced: `
STYLE: Write for advanced learners. Use academic language, discuss trade-offs, edge cases, and professional insights.`
        };

        // Select guidelines based on difficulty level
        const selectedGuidelines = difficultyGuidelines[difficulty] || difficultyGuidelines.Intermediate;

        // ===== 2-STEP LLM GENERATION =====
        // Step 1: Generate content as free text (focus on quality)
        // Step 2: Convert to JSON MODULE BY MODULE (prevents truncation)
        // This separates semantic generation from structural serialization

        console.log('📝 Generating content MODULE BY MODULE...');

        const convertedModules = [];
        const moduleTitles = generateModuleTitles(topic, moduleCount || 5);

        // GENERATE EACH MODULE SEPARATELY (guaranteed full content)
        for (let i = 0; i < (moduleCount || 5); i++) {
            const moduleTitle = moduleTitles[i] || `Module ${i + 1}: ${topic}`;

            console.log(`   📄 Generating module ${i + 1}/${moduleCount || 5}: ${moduleTitle}...`);

            // STEP 1: Generate content for THIS module only (SIMPLIFIED)
            const moduleContentPrompt = `Create engaging educational content for students learning about this topic.

TOPIC: ${topic}
MODULE: ${moduleTitle} (${i + 1} of ${moduleCount || 5})
LEVEL: ${difficulty || 'Intermediate'}

${selectedGuidelines}

CRITICAL WRITING GUIDELINES:
• Write like a human expert, NOT an AI - use natural language and varied sentence structures
• Avoid AI clichés: "delve into", "dive deep", "it's worth noting", "in today's world", "revolutionize"
• Use specific, concrete examples - NOT generic placeholders
• Vary your vocabulary - don't repeat the same phrases
• Include memorable insights and "aha moments" 
• Use storytelling when appropriate to make concepts stick
• Write with personality and expertise, not bland formality
• Make smooth, natural transitions between sections

Write content organized into these sections:

DESCRIPTION:
A compelling preview that hooks the learner's interest (2-3 sentences, not a generic statement)

INTRODUCTION:
Start with a relatable scenario or question that shows why this matters. Explain the "what" and "why" in a way that builds curiosity. Share a fresh perspective or interesting context that most tutorials miss.

CORE CONCEPTS:
Break down 2-4 key concepts using clear explanations. Use specific examples, analogies (when helpful), and practical demonstrations. Connect abstract ideas to tangible outcomes. Show the "how it works" with precision and clarity.

REAL-WORLD EXAMPLES:
Provide 2-3 specific, named examples from real companies, projects, or scenarios (e.g., "Netflix uses this for...", "In mobile app development, this solves..."). Make these concrete and credible, not vague generalizations.

BEST PRACTICES:
Share 3-4 actionable practices that practitioners actually use. Include the "why" behind each practice. These should feel like insider knowledge from someone with experience.

COMMON MISTAKES:
Identify 2-3 specific mistakes beginners make, explain WHY they happen, and how to avoid them. Make these feel like lessons learned from real experience.

KEY TAKEAWAYS:
Distill the module into 3-5 memorable points. These should be specific and actionable, not generic platitudes.

Write as if mentoring someone in person - engaging, insightful, and genuinely helpful.`;

            let moduleContent = '';
            let retryCount = 0;
            const maxRetries = 2;

            while (retryCount < maxRetries) {
                try {
                    // Create abort controller for 30-second timeout
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 30000);

                    const moduleCompletion = await groq.chat.completions.create({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            {
                                role: 'system',
                                content: `You are an expert educator with deep subject matter expertise. Write naturally as a human expert would - avoid robotic patterns, AI clichés (like "delve into", "dive deep", "it's worth noting"), and formulaic language. Use varied vocabulary, engaging storytelling, and specific concrete examples. Your writing should feel conversational yet professional, with smooth transitions between ideas. Make every course unique with fresh perspectives and memorable insights. Write clear, educational content. Do not output JSON or markdown code blocks.`
                            },
                            { role: 'user', content: moduleContentPrompt },
                        ],
                        temperature: 0.7,
                        max_tokens: 3000,
                    });

                    moduleContent = moduleCompletion.choices[0]?.message?.content || '';
                    clearTimeout(timeout);  // Clear timeout on success

                    // Basic validation - ensure we got some content
                    if (moduleContent.length < 500) {
                        throw new Error('Content too short');
                    }

                    console.log(`   ✅ Module ${i + 1}: Generated ${moduleContent.length} characters`);
                    break;


                } catch (err) {
                    retryCount++;
                    console.warn(`   ⚠️ Module ${i + 1} attempt ${retryCount} failed: ${err.message}`);

                    if (retryCount >= maxRetries) {
                        // Use whatever we have
                        console.log(`   ⚠️ Module ${i + 1}: Using partial content after retries`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // STEP 2: Convert this module's content to JSON
            const moduleJsonPrompt = `Convert this SINGLE module content into JSON.

RULES:
- Output ONLY valid JSON
- Preserve ALL text exactly - do NOT truncate
- Escape quotes properly

JSON SCHEMA:
{
  "title": "${moduleTitle}",
  "description": "Description text",
  "content": [
    { "section": "Introduction", "text": "..." },
    { "section": "Core Concepts", "text": "..." },
    { "section": "Real-World Examples", "text": "..." },
    { "section": "Best Practices", "text": "..." },
    { "section": "Common Mistakes to Avoid", "text": "..." },
    { "section": "Key Takeaways", "text": "..." }
  ],
  "quiz": [],
  "videos": []
}

MODULE CONTENT:
<<<
${moduleContent.substring(0, 5000)}
>>>

OUTPUT ONLY THE JSON OBJECT.`;

            let moduleJson = null;
            retryCount = 0;

            while (retryCount < maxRetries && !moduleJson) {
                try {
                    // Create abort controller for 30-second timeout
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 30000);

                    const jsonCompletion = await groq.chat.completions.create({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            {
                                role: 'system',
                                content: 'Convert to ONLY valid JSON. Preserve ALL content quality - keep the natural language, specific examples, and engaging tone intact. No markdown, no explanations.'
                            },
                            { role: 'user', content: moduleJsonPrompt },
                        ],
                        temperature: 0.2,
                        max_tokens: 4096,
                    });

                    const response = jsonCompletion.choices[0]?.message?.content;
                    clearTimeout(timeout);  // Clear timeout on success

                    if (!response || !response.trim().endsWith('}')) {
                        throw new Error('JSON truncated');
                    }

                    const cleaned = cleanJSON(response);
                    moduleJson = safeJSONParse(cleaned);

                } catch (err) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        // Fallback module
                        moduleJson = {
                            title: moduleTitle,
                            description: moduleContent.substring(0, 500) || `Module ${i + 1} content`,
                            content: [
                                { section: "Introduction", text: moduleContent.substring(0, 1500) || "Content generation in progress." },
                                { section: "Core Concepts", text: extractSection(moduleContent, "CORE CONCEPTS") || "" },
                                { section: "Real-World Examples", text: extractSection(moduleContent, "REAL-WORLD EXAMPLES") || "" },
                                { section: "Best Practices", text: extractSection(moduleContent, "BEST PRACTICES") || "" },
                                { section: "Common Mistakes to Avoid", text: extractSection(moduleContent, "COMMON MISTAKES") || "" },
                                { section: "Key Takeaways", text: extractSection(moduleContent, "KEY TAKEAWAYS") || "" }
                            ],
                            quiz: [],
                            videos: []
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            if (moduleJson) {
                convertedModules.push(moduleJson);
            }
        }

        // Build parsed course object
        let parsed = {
            title: `${topic} - Complete Course`,
            modules: convertedModules
        };

        console.log(`✅ Content generation complete: ${convertedModules.length} modules`);

        // If no modules were converted, fail gracefully
        if (convertedModules.length === 0) {
            console.error('❌ Generation failed: No modules created');
            return NextResponse.json({ error: 'Failed to generate any modules' }, { status: 500 });
        }

        // Build parsed course object
        parsed = {
            title: `${topic} - Complete Course`,
            modules: convertedModules
        };

        // If no modules were converted, fail gracefully
        if (convertedModules.length === 0) {
            console.error('❌ Step 2 failed: No modules converted');
            return NextResponse.json({ error: 'Failed to convert any modules' }, { status: 500 });
        }

        console.log(`✅ Step 2 complete: Converted ${convertedModules.length} modules`);


        // REPAIR: Auto-fix common LLM issues (missing answers, titles, etc.)
        const repaired = repairLLMOutput(parsed);

        // Validate structure
        const validationResult = courseOutputSchema.safeParse(repaired);

        if (!validationResult.success) {
            console.warn("⚠️ LLM Output Validation Failed, using repaired fallback:", validationResult.error.format());
        }

        // Use validated data if success, otherwise use robust repaired data
        const course = validationResult.success ? validationResult.data : repaired;

        // STEP 3: Process modules and generate quizzes AFTER content is finalized
        if (course.modules) {
            console.log('📝 Processing modules and generating quizzes...');

            const processedModules = [];

            for (let index = 0; index < course.modules.length; index++) {
                const module = course.modules[index];

                // Build comprehensive description from content array
                let fullDescription = '';

                if (Array.isArray(module.content)) {
                    module.content.forEach(section => {
                        if (section.section && section.text) {
                            let icon = '📌';
                            if (section.section.includes('Introduction')) icon = '📚';
                            if (section.section.includes('Core Concepts')) icon = '🎯';
                            if (section.section.includes('Real-World Examples')) icon = '💡';
                            if (section.section.includes('Best Practices')) icon = '✅';
                            if (section.section.includes('Common Mistakes')) icon = '⚠️';
                            if (section.section.includes('Key Takeaways')) icon = '🎓';

                            fullDescription += `## ${icon} ${section.section}\n\n${section.text}\n\n`;
                        }
                    });
                }

                if (fullDescription.length === 0) {
                    fullDescription = module.description || "No content generated.";
                }

                // Add completion message
                fullDescription += `---\n\n🏁 **Great job! You have completed this module.**\n`;

                // ===== GENERATE QUIZ FOR EACH MODULE =====
                let quiz = [];
                try {
                    console.log(`   🧠 Generating quiz for module ${index + 1}: ${module.title}`);
                    quiz = await generateModuleQuiz(
                        module.title,
                        fullDescription,
                        difficulty,
                        5 // 5 questions per module
                    );
                    console.log(`   ✅ Module ${index + 1}: ${quiz.length} questions`);
                } catch (quizErr) {
                    console.error(`   ❌ Module ${index + 1}: Quiz failed - ${quizErr.message}`);
                    quiz = [];
                }

                processedModules.push({
                    ...module,
                    id: `module-${index}`,
                    orderIndex: index + 1,
                    description: fullDescription,
                    quiz: quiz,
                    videos: module.videos || [],
                });
            }

            course.modules = processedModules;
        }

        // Fetch and rank YouTube videos for each module if includeVideos is true
        // ===== NEW ROBUST YOUTUBE PIPELINE =====
        // Uses course+module-specific caching with user isolation
        if (includeVideos && course.modules && Array.isArray(course.modules)) {
            console.log('📺 Fetching YouTube videos with robust 5-phase pipeline...');

            // Generate unique course ID for cache isolation
            const courseId = generateCourseId(topic);
            console.log(`   Course ID: ${courseId}`);

            for (let i = 0; i < course.modules.length; i++) {
                const module = course.modules[i];

                // ALWAYS use the safe pipeline - never trust LLM-generated URLs
                try {
                    const result = await getSafeYouTubeVideos(
                        topic,           // courseTitle
                        module.title,    // moduleTitle
                        {
                            userId: userId,
                            courseId: courseId,
                            moduleIndex: i
                        }
                    );

                    if (result.status === "OK" && result.videos.length > 0) {
                        // Convert to expected format for UI
                        course.modules[i].videos = result.videos.map(v => ({
                            title: v.title,
                            url: `https://www.youtube.com/watch?v=${v.videoId}`,
                            embedUrl: v.embedUrl,
                            channelTitle: v.channel,
                            views: v.views,
                            likes: v.likes,
                            thumbnail: v.thumbnail,
                            videoId: v.videoId
                        }));
                        console.log(`   ✅ Module ${i + 1}: ${result.videos.length} verified videos${result.cached ? ' (cached)' : ''}`);
                    } else {
                        // Clean fallback - no broken embeds
                        course.modules[i].videos = [];
                        course.modules[i].videoStatus = "NO_SAFE_VIDEOS";
                        console.log(`   ⚠️ Module ${i + 1}: No safe videos available`);
                    }
                } catch (err) {
                    console.error(`   ❌ Module ${i + 1}: Video fetch failed - ${err.message}`);
                    course.modules[i].videos = [];
                    course.modules[i].videoStatus = "FETCH_ERROR";
                }
            }
        }

        // Build final course object
        const finalCourse = {
            ...course,
            topic,
            include_quiz: includeQuiz,
            include_videos: includeVideos,
            chapterCount: course.modules?.length || moduleCount,
        };

        // Store in cache for future identical requests
        await setCachedCourse(cacheKey, finalCourse);
        console.log(`💾 Course cached for: "${topic}"`);

        return NextResponse.json({
            success: true,
            course: finalCourse,
            cached: false,
        });
    } catch (error) {
        console.error('Generate AI API error:', error);
        return NextResponse.json({ error: 'Failed to generate course' }, { status: 500 });
    }
}

