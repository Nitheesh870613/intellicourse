import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import { extractContentFromUrl, cleanExtractedText } from '@/lib/url/extractContent';
import { makeCacheKey, getCachedCourse, setCachedCourse } from '@/lib/cache/courseCache';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build-and-missing-env',
});

/**
 * POST /api/url-to-course
 * 
 * Extracts content from a URL and generates a structured course using LLM.
 */
export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, difficulty = 'intermediate', includeQuiz = true, includeVideos = false } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // ========== CACHING ==========
        const cacheKey = makeCacheKey({
            type: 'url-extraction',
            url: url.toLowerCase().trim(),
            difficulty,
            includeQuiz,
        }, userId);

        const cachedCourse = await getCachedCourse(cacheKey);
        if (cachedCourse) {
            console.log(`⚡ Returning cached URL course for: "${url}"`);
            return NextResponse.json({
                success: true,
                course: cachedCourse,
                cached: true,
                message: 'Course loaded from cache',
            });
        }
        // =============================

        console.log(`📄 Extracting content from URL: ${url}`);

        // Step 1: Try fetch-based extraction first (faster)
        // If it fails (403, Cloudflare), fall back to browser extraction
        let extracted;
        let extractionMethod = 'fetch';

        try {
            extracted = await extractContentFromUrl(url);
        } catch (fetchError) {
            console.log(`⚠️ Fetch extraction failed: ${fetchError.message}`);
            console.log('🌐 Falling back to browser extraction...');

            try {
                // Dynamic import to avoid loading Playwright unless needed
                const { extractContentWithBrowser } = await import('@/lib/extract/urlBrowserExtractor');
                extracted = await extractContentWithBrowser(url);
                extractionMethod = 'browser';
            } catch (browserError) {
                console.error('❌ Browser extraction also failed:', browserError.message);
                return NextResponse.json({
                    error: 'Failed to extract content from URL',
                    details: `Fetch: ${fetchError.message}, Browser: ${browserError.message}`
                }, { status: 422 });
            }
        }

        if (!extracted.content || extracted.content.length < 100) {
            return NextResponse.json({
                error: 'Unable to extract meaningful content from this URL. The page may be too short or protected.',
            }, { status: 422 });
        }

        console.log(`✅ Extracted ${extracted.wordCount} words using ${extractionMethod} from "${extracted.title}"`);

        // Step 2: Clean the extracted text
        const cleanedText = cleanExtractedText(extracted.content);

        // Step 3: Import unified prompt builder
        const { buildCoursePrompt, cleanLLMResponse, normalizeCourseJSON } = await import('@/lib/llm/buildCoursePrompt');

        // Step 4: Build unified prompt (same format as AI and file generation)
        const prompt = buildCoursePrompt({
            extractedText: cleanedText.substring(0, 20000),
            difficulty: difficulty,
            moduleCount: 5,
            includeQuiz: includeQuiz,
            includeVideos: includeVideos,
            sourceType: 'url',
        });

        console.log('🤖 Generating course with unified prompt...');

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert course generator. Output ONLY valid JSON. No markdown code blocks. No explanations.'
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 8192,
        });

        const response = completion.choices[0]?.message?.content;

        // Parse and validate LLM response using unified functions
        let course;
        try {
            const cleaned = cleanLLMResponse(response);
            const parsed = JSON.parse(cleaned);
            course = normalizeCourseJSON(parsed);
        } catch (parseError) {
            console.error('Failed to parse LLM response:', parseError);
            return NextResponse.json({
                error: 'Failed to generate valid course structure',
            }, { status: 500 });
        }

        // Build final course object
        const finalCourse = {
            course_title: course.course_title || extracted.title,
            title: course.course_title || extracted.title,
            overview: course.overview || '',
            description: course.overview || '',
            category: course.category || 'General',
            difficulty: difficulty,
            modules: course.modules || [],
            chapterCount: course.modules?.length || 0,
            topic: extracted.title,
            sourceUrl: url,
            include_quiz: includeQuiz,
            include_videos: includeVideos,
        };

        // Cache the result
        await setCachedCourse(cacheKey, finalCourse);
        console.log(`💾 URL course cached for: "${url}"`);

        return NextResponse.json({
            success: true,
            course: finalCourse,
            cached: false,
            extracted: {
                title: extracted.title,
                wordCount: extracted.wordCount,
            }
        });

    } catch (error) {
        console.error('URL-to-course API error:', error);
        return NextResponse.json({
            error: 'Failed to generate course from URL',
            details: error.message
        }, { status: 500 });
    }
}
