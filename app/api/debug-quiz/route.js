import { NextResponse } from 'next/server';

/**
 * Debug Quiz Generation API
 * 
 * This endpoint helps debug quiz generation issues by checking:
 * 1. Environment variables
 * 2. Database connection
 * 3. Chapter data
 * 4. API functionality
 */

export async function POST(request) {
  try {
    const { chapterId } = await request.json();
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      chapterId: chapterId,
      checks: {}
    };

    // Check 1: Environment Variables
    debugInfo.checks.geminiApiKey = {
      exists: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
    };

    debugInfo.checks.databaseUrl = {
      exists: !!process.env.DATABASE_URL,
      hasValue: process.env.DATABASE_URL ? 'Yes' : 'No'
    };

    // Check 2: Database Connection
    try {
      const { db } = await import('@/lib/db');
      debugInfo.checks.databaseConnection = {
        imported: true,
        dbObject: !!db
      };

      // Check 3: Schema Import
      try {
        const { chapters, quizzes } = await import('@/lib/db/schema');
        debugInfo.checks.schema = {
          chaptersTable: !!chapters,
          quizzesTable: !!quizzes
        };

        // Check 4: Chapter Data (if chapterId provided)
        if (chapterId) {
          try {
            const { eq } = await import('drizzle-orm');
            
            const chapter = await db
              .select()
              .from(chapters)
              .where(eq(chapters.id, chapterId))
              .limit(1);

            debugInfo.checks.chapterData = {
              found: chapter && chapter.length > 0,
              hasContent: chapter && chapter.length > 0 ? !!chapter[0].content : false,
              contentLength: chapter && chapter.length > 0 && chapter[0].content ? chapter[0].content.length : 0,
              chapterTitle: chapter && chapter.length > 0 ? chapter[0].title : 'Not found'
            };

            // Check 5: Existing Quiz
            if (chapter && chapter.length > 0) {
              const existingQuiz = await db
                .select()
                .from(quizzes)
                .where(eq(quizzes.chapterId, chapterId))
                .limit(1);

              debugInfo.checks.existingQuiz = {
                exists: existingQuiz && existingQuiz.length > 0,
                count: existingQuiz ? existingQuiz.length : 0
              };
            }

          } catch (dbError) {
            debugInfo.checks.databaseQuery = {
              error: dbError.message,
              stack: dbError.stack
            };
          }
        }

      } catch (schemaError) {
        debugInfo.checks.schema = {
          error: schemaError.message
        };
      }

    } catch (dbError) {
      debugInfo.checks.databaseConnection = {
        error: dbError.message
      };
    }

    // Check 6: Gemini AI Test (if API key exists)
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        debugInfo.checks.geminiAI = {
          initialized: true,
          ready: !!genAI
        };

        // Test simple generation
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const testPrompt = "Generate a simple JSON object with a test message.";
          const result = await model.generateContent(testPrompt);
          const response = await result.response;
          const text = response.text();
          
          debugInfo.checks.geminiTest = {
            success: true,
            responseLength: text.length,
            responsePreview: text.substring(0, 100)
          };
        } catch (aiError) {
          debugInfo.checks.geminiTest = {
            error: aiError.message
          };
        }

      } catch (importError) {
        debugInfo.checks.geminiAI = {
          importError: importError.message
        };
      }
    }

    // Check 7: Mock Quiz Generation Test
    debugInfo.checks.mockQuizGeneration = {
      sampleQuiz: [
        {
          question: "What is a test question?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          explanation: "This is a test explanation"
        }
      ]
    };

    return NextResponse.json({
      message: "Debug information collected",
      debug: debugInfo,
      recommendations: generateRecommendations(debugInfo)
    });

  } catch (error) {
    return NextResponse.json({
      error: "Debug API failed",
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

function generateRecommendations(debugInfo) {
  const recommendations = [];

  if (!debugInfo.checks.geminiApiKey?.exists) {
    recommendations.push("❌ Add GEMINI_API_KEY to your environment variables");
  }

  if (!debugInfo.checks.databaseConnection?.imported) {
    recommendations.push("❌ Check database connection configuration");
  }

  if (debugInfo.checks.chapterData && !debugInfo.checks.chapterData.found) {
    recommendations.push("❌ Chapter not found in database - check if course/chapters are properly saved");
  }

  if (debugInfo.checks.chapterData && !debugInfo.checks.chapterData.hasContent) {
    recommendations.push("❌ Chapter has no content - quiz generation requires chapter content");
  }

  if (debugInfo.checks.existingQuiz?.exists) {
    recommendations.push("ℹ️ Quiz already exists for this chapter");
  }

  if (debugInfo.checks.geminiTest?.error) {
    recommendations.push("❌ Gemini AI test failed - check API key validity");
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ All checks passed - quiz generation should work");
  }

  return recommendations;
}

// GET endpoint for simple health check
export async function GET() {
  return NextResponse.json({
    message: "Quiz debug API is running",
    timestamp: new Date().toISOString(),
    usage: "POST with { chapterId: 'uuid' } to debug quiz generation"
  });
}
