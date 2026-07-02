import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, topic, description, difficulty, duration, chapterCount, includeVideos } = body;

    console.log('Received request:', { category, topic, description, difficulty, duration, chapterCount, includeVideos });
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

    // Helper function to generate mock course
    const generateMockCourse = () => {
      console.log('Generating mock course data');
      return {
        courseTitle: `${topic} - Complete ${difficulty} Course`,
        courseDescription: `A comprehensive ${difficulty.toLowerCase()} course on ${topic}. Learn everything you need to know about ${category} with practical examples and hands-on projects.`,
        chapters: Array.from({ length: parseInt(chapterCount) }, (_, i) => ({
          title: `Chapter ${i + 1}: Introduction to ${topic}`,
          content: [
            `- Overview: Simple explanation of ${topic} basics.`,
            `- Key Terms: Short definitions for core concepts.`,
            `- Why It Matters: Real-world use cases in ${category}.`,
            `- Next Steps: What you'll learn after this.`
          ],
          videoUrl: null // YouTube integration disabled
        }))
      };
    };

    // If no API key, return mock response
    if (!GEMINI_KEY) {
      console.log('No Gemini API key found, using mock response');
      const mockCourse = generateMockCourse();
      console.log('Returning mock course:', mockCourse);
      return NextResponse.json({
        success: true,
        course: mockCourse
      });
    }

    try {
      // Create the prompt for Gemini
      const prompt = `You are an expert course creator. Create a structured course based on this input:
- Category: ${category}
- Topic: ${topic}
- Description: ${description || 'No description provided'}
- Difficulty: ${difficulty}
- Duration: ${duration}
- Chapters: ${chapterCount}
- Include YouTube videos: ${includeVideos ? 'Yes' : 'No'}

Generate a JSON response with this exact structure:
{
  "courseTitle": "A catchy Course Title",
  "courseDescription": "A professional Course Description",
  "chapters": [
    {
      "title": "Chapter Title",
      "content": [
        "- Smart Pointers: Objects that manage memory automatically.",
        "- unique_ptr: Ensures only one owner of a resource.",
        "- shared_ptr: Multiple owners share the same resource.",
        "- weak_ptr: References a resource without owning it."
      ],
      "videoUrl": null
    }
  ]
}

Important:
1. Make the course title catchy and SEO-friendly.
2. Write a compelling course description that explains what students will learn.
3. Create exactly ${chapterCount} chapters.
4. For each chapter:
   - Provide a plain text title.
   - Provide content as an array of bullet point strings, each a very simple beginner-friendly definition.
   - Avoid large unstructured paragraphs.
   - Set videoUrl to null (YouTube integration disabled)
5. Return ONLY valid JSON, no additional text or explanations.
6. Make content original and engaging.`;

      // Generate content with Gemini using the correct model name
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      let courseData;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          courseData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        console.log('Falling back to mock response due to parsing error');
        const mockCourse = generateMockCourse();
        return NextResponse.json({
          success: true,
          course: mockCourse
        });
      }

      // Validate the response structure
      if (!courseData.courseTitle || !courseData.chapters || !Array.isArray(courseData.chapters)) {
        console.log('Invalid AI response structure, falling back to mock response');
        const mockCourse = generateMockCourse();
        return NextResponse.json({
          success: true,
          course: mockCourse
        });
      }

      return NextResponse.json({
        success: true,
        course: courseData
      });

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      console.log('Falling back to mock response due to Gemini API error');
      const mockCourse = generateMockCourse();
      return NextResponse.json({
        success: true,
        course: mockCourse
      });
    }

  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json(
      { error: 'Failed to generate course: ' + error.message },
      { status: 500 }
    );
  }
}
