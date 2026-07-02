import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build-and-missing-env',
});

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request) {
    console.log('\n========================================');
    console.log('📥 FILE-TO-COURSE API CALLED');
    console.log('========================================');

    try {
        const { userId } = await auth();
        if (!userId) {
            console.log('❌ Unauthorized request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        let formData;
        try {
            formData = await request.formData();
        } catch (e) {
            console.error('❌ Failed to parse form data:', e.message);
            return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
        }

        const file = formData.get('file');
        const includeQuizParam = formData.get('includeQuiz');
        const includeQuiz = includeQuizParam === 'true' || includeQuizParam === true;

        if (!file || typeof file === 'string') {
            console.log('❌ No valid file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`📊 Include Quiz: ${includeQuiz}`);

        // Debug file info
        console.log('📄 FILE DETAILS:');
        console.log(`   Name: ${file.name}`);
        console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`   Type: ${file.type || 'unknown'}`);

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            console.log('❌ File too large');
            return NextResponse.json(
                { error: `File too large. Maximum size is 10MB` },
                { status: 400 }
            );
        }

        if (file.size === 0) {
            console.log('❌ File is empty');
            return NextResponse.json({ error: 'File is empty' }, { status: 400 });
        }

        // Read file buffer
        let buffer;
        try {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            console.log(`   Buffer created: ${buffer.length} bytes`);
        } catch (e) {
            console.error('❌ Failed to read file buffer:', e.message);
            return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
        }

        // Dynamic import OCR module (prevents build-time issues)
        const { extractText, detectFileType } = await import('@/lib/ocr/index.js');

        // Detect file type
        const fileType = detectFileType(file.type, file.name);
        console.log(`   Detected type: ${fileType}`);

        if (fileType === 'unknown') {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload PDF, image (PNG/JPG), DOCX, or TXT.' },
                { status: 400 }
            );
        }

        // Extract text
        console.log('\n🔄 STARTING TEXT EXTRACTION...');
        let extractedData;

        try {
            extractedData = await extractText(buffer, file.type, file.name);
        } catch (ocrError) {
            console.error('❌ OCR Error:', ocrError.message);
            console.error('   Stack:', ocrError.stack);
            return NextResponse.json(
                { error: `Text extraction failed: ${ocrError.message}` },
                { status: 500 }
            );
        }

        const { text, type, metadata } = extractedData;
        console.log('\n✅ EXTRACTION COMPLETE:');
        console.log(`   Type: ${type}`);
        console.log(`   Length: ${text.length} characters`);
        console.log(`   Preview: ${text.substring(0, 100)}...`);

        if (!text || text.length < 20) {
            console.log('⚠️ Insufficient text extracted');
            return NextResponse.json(
                {
                    error: 'Could not extract enough text. The file may be empty, scanned without OCR text, or corrupted.',
                    extractedLength: text.length,
                },
                { status: 400 }
            );
        }

        // Truncate text if too long (Llama 3.3 70b has 128k context, so 100k chars is safe)
        const maxTextLength = 100000;
        const truncatedText = text.length > maxTextLength
            ? text.substring(0, maxTextLength) + '\n\n[Content truncated for processing...]'
            : text;

        console.log('\n🤖 GENERATING COURSE WITH UNIFIED PROMPT...');

        // Import unified prompt builder
        const { buildCoursePrompt, cleanLLMResponse, normalizeCourseJSON } = await import('@/lib/llm/buildCoursePrompt');

        // Build unified prompt (same format as AI generation)
        const prompt = buildCoursePrompt({
            extractedText: truncatedText,
            difficulty: 'intermediate',
            moduleCount: 5,
            includeQuiz: includeQuiz,
            includeVideos: false,
            sourceType: 'file',
        });

        let completion;
        try {
            completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert course generator. Output ONLY valid JSON. No markdown code blocks. No explanations.
You MUST return STRICT JSON with EXACTLY the following shape:

{
  "title": "string",
  "description": "string",
  "category": "string",
  "difficulty": "Beginner | Intermediate | Advanced",
  "modules": [
    {
      "title": "string",
      "description": "string",
      "content": "string",
      "quiz": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "answer": "string",
          "explanation": "string"
        }
      ]
    }
  ]
}

Do NOT wrap in "course": {}
Do NOT add prose before or after JSON.
JSON only. No markdown fences.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.5,
                max_tokens: 8192,
            });
        } catch (groqError) {
            console.error('❌ Groq API Error:', groqError.message);
            return NextResponse.json(
                { error: 'AI course generation failed. Please try again.' },
                { status: 500 }
            );
        }

        const response = completion.choices[0]?.message?.content;
        console.log('✅ Groq response received');
        console.log(`   Response length: ${response?.length || 0} chars`);

        if (!response) {
            return NextResponse.json(
                { error: 'AI returned empty response. Please try again.' },
                { status: 500 }
            );
        }

        // Parse the response
        let course;
        try {
            const cleaned = cleanLLMResponse(response);
            try {
                course = JSON.parse(cleaned);
            } catch (err) {
                console.error("JSON parse error", cleaned);
                throw new Error("LLM returned invalid JSON");
            }

            // Handle cases where JSON is wrapped under "course"
            if (course.course) course = course.course;

            // Ensure required fields
            if (!course.title && course.modules?.[0]?.title) {
                course.title = course.modules[0].title + " (Course)";
            }
            if (!course.title) course.title = "Untitled Course";

            if (!course.description) {
                course.description = "Auto-generated course description from uploaded file.";
            }

            if (!course.modules || course.modules.length === 0) {
                throw new Error("LLM returned no modules");
            }

            console.log('✅ Course parsed successfully');
            console.log(`   Title: ${course.title}`);
            console.log(`   Modules: ${course.modules?.length || 0}`);
            console.log(`   Quiz: ${course.quiz?.length || 0} questions`); // Top level quiz? Usually in modules.

        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            console.error('   Raw response preview:', response.substring(0, 300));
            return NextResponse.json(
                { error: 'Failed to parse course structure. Please try again.' },
                { status: 500 }
            );
        }

        console.log('\n========================================');
        console.log('✅ FILE-TO-COURSE COMPLETE');
        console.log('========================================\n');

        return NextResponse.json({
            success: true,
            course,
            extraction: {
                type,
                textLength: text.length,
                metadata,
            },
        });

    } catch (error) {
        console.error('❌ UNEXPECTED ERROR:', error);
        console.error('   Stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}


function cleanLLMResponse(raw) {
    if (!raw) throw new Error("Empty LLM response");

    let text = raw;

    // Remove code fences
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Extract the FIRST valid JSON object
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1)
        throw new Error("No JSON object detected in LLM output");

    const jsonString = text.substring(firstBrace, lastBrace + 1);

    return jsonString;
}
