import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, courses, chapters, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Call GROQ API with streaming support
async function callGroqStream(messages) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true // Enable streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`GROQ API error: ${await response.text()}`);
    }

    return response.body;
  } catch (error) {
    console.error('GROQ API call failed:', error);
    throw error;
  }
}

// Regular non-streaming call
async function callGroq(messages) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`GROQ API error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GROQ API call failed:', error);
    throw error;
  }
}

// Fetch course content for context
async function getCourseContext(courseId) {
  try {
    // Get course details
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return null;
    }

    let courseModules = [];
    
    // Check if course has JSONB modules
    if (course.modules && Array.isArray(course.modules) && course.modules.length > 0) {
      courseModules = course.modules;
    } else {
      // Fallback to chapters table
      courseModules = await db
        .select()
        .from(chapters)
        .where(eq(chapters.courseId, courseId))
        .orderBy(chapters.orderIndex);
    }

    // Build context string
    let context = `Course Title: ${course.title || course.course_title}\n`;
    if (course.topic) {
      context += `Course Topic: ${course.topic}\n`;
    }
    context += `Difficulty Level: ${course.difficulty || 'intermediate'}\n\n`;
    
    context += `Course Content:\n\n`;
    
    courseModules.forEach((module, index) => {
      const moduleTitle = module.title || module.chapter_title || `Module ${index + 1}`;
      context += `## Module ${index + 1}: ${moduleTitle}\n`;
      if (module.description) {
        context += `Description: ${module.description}\n`;
      }
      if (module.content) {
        context += `\n${module.content}\n\n`;
      }
      context += `---\n\n`;
    });

    return {
      course,
      modules: courseModules,
      context
    };
  } catch (error) {
    console.error('Error fetching course context:', error);
    return null;
  }
}

// Build tutor system prompt
function buildTutorPrompt(courseData) {
  return `You are an expert AI tutor for the course "${courseData.course.title}". Your role is to help students understand the course material by answering their questions clearly and accurately.

IMPORTANT RULES:
1. Answer questions ONLY based on the course content provided below
2. If a question is outside the course scope, politely redirect to the course material
3. Be patient, encouraging, and supportive
4. Break down complex topics into simpler explanations
5. Use examples and analogies when helpful
6. If you're unsure about something, say so honestly
7. Encourage deeper thinking with follow-up questions
8. Reference specific modules when answering

COURSE CONTEXT:
${courseData.context}

Remember: You are a tutor for THIS specific course. Stay focused on helping students master this material.`;
}

// POST endpoint for chat
export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      courseId, 
      message, 
      conversationHistory = [],
      stream = false 
    } = body;

    if (!courseId || !message) {
      return NextResponse.json(
        { error: 'courseId and message are required' },
        { status: 400 }
      );
    }

    // Fetch course content for context
    const courseData = await getCourseContext(courseId);
    
    if (!courseData) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify user owns this course - lookup user by clerkId
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser || courseData.course.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this course' },
        { status: 403 }
      );
    }

    // Build system prompt with course context
    const systemPrompt = buildTutorPrompt(courseData);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Limit conversation history to last 10 messages to avoid token limits
    if (messages.length > 12) { // 1 system + 10 history + 1 new
      messages.splice(1, messages.length - 12);
    }

    // Handle streaming response
    if (stream) {
      const streamBody = await callGroqStream(messages);
      
      return new Response(streamBody, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular response
    const response = await callGroq(messages);

    return NextResponse.json({
      success: true,
      response,
      courseTitle: courseData.course.title,
      moduleCount: courseData.modules.length
    });

  } catch (error) {
    console.error('Chat tutor error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch course info for chat initialization
export async function GET(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const courseData = await getCourseContext(courseId);
    
    if (!courseData) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify user owns this course - lookup user by clerkId
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser || courseData.course.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      course: {
        id: courseData.course.id,
        title: courseData.course.title,
        topic: courseData.course.topic,
        difficulty: courseData.course.difficulty,
        moduleCount: courseData.modules.length
      },
      modules: courseData.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description
      }))
    });

  } catch (error) {
    console.error('Get course info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course info' },
      { status: 500 }
    );
  }
}
