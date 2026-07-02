import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, courses, chapters, quizzes } from '@/lib/db';  // ✅ Fixed: use 'chapters' not 'modules'
import { eq } from 'drizzle-orm';
import { buildSystemPrompt } from '@/lib/prompts/difficulty-prompts';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Call GROQ API
async function callGroq(messages, model = 'llama-3.3-70b-versatile', temperature = 0.7) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GROQ API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GROQ API call failed:', error);
    throw error;
  }
}

// Step 1: Generate course outline
async function generateOutline(topic, difficulty, persona) {
  const systemPrompt = buildSystemPrompt(difficulty, persona);

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}\n\nYou are an instructional designer who creates logical course outlines. You only output valid JSON.`
    },
    {
      role: 'user',
      content: `Generate a comprehensive course outline for the topic "${topic}". 

Give me:
- A compelling course title
- An array of 5-7 module titles with a 1-sentence description for each
- The overall difficulty level

Output *only* a valid JSON object in this exact format:
{
  "title": "Course Title Here",
  "description": "Brief course description",
  "difficulty": "${difficulty}",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "One sentence describing this module"
    }
  ]
}`
    }
  ];

  const response = await callGroq(messages, 'llama-3.3-70b-versatile', 0.8);

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '');
  }

  return JSON.parse(jsonStr);
}

// Step 2: Generate detailed module content
async function generateModuleContent(moduleTitle, moduleDescription, courseTopic, difficulty, persona) {
  const systemPrompt = buildSystemPrompt(difficulty, persona);

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}\n\nYou are a subject-matter expert who writes detailed, engaging educational content. Format your output as clean Markdown with proper headings, bullet points, code blocks (if applicable), and examples.`
    },
    {
      role: 'user',
      content: `Write comprehensive, detailed course content for the following module:

**Module Title:** ${moduleTitle}
**Module Description:** ${moduleDescription}
**Overall Course Topic:** ${courseTopic}

Requirements:
- Write at least 500-800 words of high-quality educational content
- Use proper Markdown formatting (## for sections, ### for subsections)
- Include practical examples where relevant
- Add code snippets if applicable (use \`\`\` code blocks)
- Make it engaging and easy to follow
- Structure the content logically with clear progression

Output *only* the raw Markdown text for this module.`
    }
  ];

  return await callGroq(messages, 'llama-3.3-70b-versatile', 0.7);
}

// Step 3: Generate quiz questions for a module
async function generateModuleQuiz(moduleTitle, moduleContent, difficulty) {
  const messages = [
    {
      role: 'system',
      content: 'You are a strict quiz creator. You must generate questions based *only* on the provided text. You must output *only* a valid JSON object in the exact format requested.'
    },
    {
      role: 'user',
      content: `Based *only* on the following module content, generate 4 quiz questions.

MODULE TITLE: ${moduleTitle}

MODULE CONTENT:
"""
${moduleContent.substring(0, 3000)} 
"""

Generate a mix of question types:
- 2 multiple_choice questions
- 1 true_false question
- 1 fill_in_the_blank question

Output *only* a valid JSON object in this exact format (no markdown, no code blocks):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A"
    },
    {
      "type": "true_false",
      "question": "Statement here.",
      "answer": true
    },
    {
      "type": "fill_in_the_blank",
      "question": "The key concept is ______.",
      "answer": "answer here"
    }
  ]
}`
    }
  ];

  const response = await callGroq(messages, 'llama-3.3-70b-versatile', 0.6);

  // Clean and parse JSON
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '');
  }

  return JSON.parse(jsonStr);
}

// Main Chain-of-Thought handler
export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      topic,
      difficulty = 'intermediate',
      persona = null,
      includeQuiz = true,
      sourceText = null // Optional: if generating from extracted text
    } = body;

    if (!topic && !sourceText) {
      return NextResponse.json(
        { error: 'Topic or sourceText is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting Chain-of-Thought generation for: ${topic}`);

    // STEP 1: Generate course outline
    console.log('📋 Step 1: Generating course outline...');
    const outline = await generateOutline(topic, difficulty, persona);

    console.log(`✅ Outline generated: ${outline.title} with ${outline.modules.length} modules`);

    // STEP 2: Create course and module records in database
    console.log('💾 Step 2: Creating database records...');

    const [course] = await db.insert(courses).values({
      userId,
      title: outline.title,
      topic: topic,
      description: outline.description || `A comprehensive course on ${topic}`,
      category: 'General',
      difficulty: difficulty,
      chapterCount: outline.modules.length.toString(),
      includeVideos: false,
      includeQuiz: includeQuiz,
      status: 'generating'
    }).returning();

    const courseId = course.id;
    console.log(`✅ Course created with ID: ${courseId}`);

    // Create placeholder module records
    const moduleRecords = await Promise.all(
      outline.modules.map((mod, index) =>
        db.insert(chapters).values({
          courseId,
          title: mod.title,
          description: mod.description,
          content: '', // Will be filled in next step
          orderIndex: index,
          duration: '15 min'
        }).returning()
      )
    );

    console.log(`✅ ${moduleRecords.length} module records created`);

    // STEP 3: Generate content and quizzes for each module in parallel
    console.log('🎨 Step 3: Generating module content and quizzes in parallel...');

    const moduleGenerationPromises = moduleRecords.map(async ([module], index) => {
      console.log(`  📝 Generating content for module ${index + 1}: ${module.title}`);

      // Generate content and quiz in parallel
      const [content, quizData] = await Promise.all([
        generateModuleContent(
          module.title,
          outline.modules[index].description,
          topic,
          difficulty,
          persona
        ),
        includeQuiz
          ? generateModuleQuiz(
            module.title,
            outline.modules[index].description, // Use description as preview
            difficulty
          ).catch(err => {
            console.error(`Quiz generation failed for module ${index + 1}:`, err);
            return null;
          })
          : Promise.resolve(null)
      ]);

      // Update module with content
      await db.update(chapters)  // ✅ Fixed: use chapters table
        .set({
          content,
          videoUrls: []
        })
        .where(eq(chapters.id, module.id));

      // Create quiz record if quiz was generated
      if (quizData && quizData.questions) {
        await db.insert(quizzes).values({
          moduleId: module.id,
          questions: quizData.questions
        });
        console.log(`  ✅ Module ${index + 1} completed with quiz (${quizData.questions.length} questions)`);
      } else {
        console.log(`  ✅ Module ${index + 1} completed (no quiz)`);
      }

      return {
        moduleId: module.id,
        title: module.title,
        contentLength: content.length,
        hasQuiz: !!quizData
      };
    });

    // Wait for all modules to complete
    const results = await Promise.all(moduleGenerationPromises);

    // STEP 4: Mark course as completed
    await db.update(courses)
      .set({ status: 'completed' })
      .where(eq(courses.id, courseId));

    console.log('🎉 Course generation complete!');

    return NextResponse.json({
      success: true,
      courseId,
      course: {
        id: courseId,
        title: outline.title,
        description: outline.description,
        difficulty,
        moduleCount: results.length,
        modules: results
      },
      message: 'Course generated successfully using Chain-of-Thought pipeline'
    });

  } catch (error) {
    console.error('❌ Chain generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate course',
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
