import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Enhanced AI Course Generator API with Quiz Functionality
 * 
 * Generates comprehensive course content with:
 * 1. Structured modules with key points, explanations, and examples
 * 2. Interactive quizzes with difficulty-based questions
 * 3. YouTube video integration with search optimization
 * 4. Level-appropriate content depth scaling
 */

// Search YouTube for educational videos
async function searchYouTubeVideos(query, apiKey, maxResults = 1) {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: String(maxResults),
      safeSearch: 'moderate',
      videoDuration: 'medium',
      videoDefinition: 'high',
      order: 'relevance'
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

// Generate level-specific prompts with quiz requirements
function generateEnhancedPrompt(topic, level, includeQuizzes) {
  const basePrompt = `Generate a comprehensive educational course on "${topic}" for ${level} level learners.`;
  
  const levelInstructions = {
    'Beginner': {
      content: `
        - Use simple, clear language that beginners can understand
        - Focus on fundamental concepts and basic understanding
        - Include plenty of real-world analogies and simple examples
        - Avoid technical jargon, explain terms clearly when necessary
        - Build confidence with encouraging explanations
      `,
      quiz: `
        - Create simple conceptual questions
        - Focus on basic understanding and recognition
        - Use straightforward multiple choice options
        - Avoid trick questions or complex scenarios
        - Include encouraging explanations for correct answers
      `
    },
    'Intermediate': {
      content: `
        - Include technical details and industry terminology
        - Add practical applications and real-world use cases
        - Include processes, methodologies, and best practices
        - Assume some prior knowledge but explain advanced concepts
        - Focus on practical skills and implementation
      `,
      quiz: `
        - Create scenario-based questions
        - Include practical application problems
        - Test understanding of processes and methodologies
        - Use realistic examples and case studies
        - Focus on "how" and "when" to apply concepts
      `
    },
    'Advanced': {
      content: `
        - Use professional terminology and advanced concepts
        - Include complex examples, case studies, and research
        - Discuss cutting-edge developments and optimization
        - Assume strong foundational knowledge
        - Focus on expert-level insights and advanced techniques
      `,
      quiz: `
        - Create complex problem-solving questions
        - Include technical and analytical challenges
        - Test deep understanding and application
        - Use professional scenarios and edge cases
        - Focus on optimization and advanced decision-making
      `
    }
  };

  const instructions = levelInstructions[level];
  
  const quizSection = includeQuizzes ? `
    
    For each module, create exactly 4 quiz questions with the following structure:
    ${instructions.quiz}
    
    Each quiz question must have:
    - A clear, specific question text
    - Exactly 4 multiple choice options (A, B, C, D style)
    - One correct answer (must match exactly one of the options)
    - A brief 1-sentence explanation for why the correct answer is right
  ` : '';

  return basePrompt + instructions.content + quizSection;
}

// Fallback quiz creation functions
function createFallbackQuestion(module, level, questionNumber) {
  const questionTemplates = {
    'Beginner': [
      {
        question: `What is the main purpose of ${module.title}?`,
        options: ["To understand basic concepts", "To confuse students", "To waste time", "To complicate learning"],
        answer: "To understand basic concepts",
        explanation: "The main purpose is to help students understand fundamental concepts."
      },
      {
        question: `Which of the following is a key benefit of learning ${module.title}?`,
        options: ["Better understanding", "More confusion", "Less knowledge", "Increased difficulty"],
        answer: "Better understanding",
        explanation: "Learning this topic provides better understanding of the subject matter."
      }
    ],
    'Intermediate': [
      {
        question: `How would you apply the concepts from ${module.title} in a real-world scenario?`,
        options: ["Through practical implementation", "By ignoring the concepts", "By avoiding application", "Through theoretical study only"],
        answer: "Through practical implementation",
        explanation: "Real-world application requires practical implementation of the learned concepts."
      },
      {
        question: `What is the most effective approach when working with ${module.title}?`,
        options: ["Systematic methodology", "Random approach", "Avoiding the topic", "Guessing solutions"],
        answer: "Systematic methodology",
        explanation: "A systematic methodology ensures effective and reliable results."
      }
    ],
    'Advanced': [
      {
        question: `What are the optimization considerations for ${module.title}?`,
        options: ["Performance and efficiency", "Complexity and confusion", "Reduced functionality", "Increased errors"],
        answer: "Performance and efficiency",
        explanation: "Advanced implementations focus on optimizing performance and efficiency."
      },
      {
        question: `How do you handle edge cases in ${module.title}?`,
        options: ["Comprehensive error handling", "Ignore edge cases", "Hope for the best", "Avoid complex scenarios"],
        answer: "Comprehensive error handling",
        explanation: "Professional implementations require comprehensive error handling for edge cases."
      }
    ]
  };

  const templates = questionTemplates[level] || questionTemplates['Beginner'];
  const template = templates[(questionNumber - 1) % templates.length];
  
  return {
    question: template.question,
    options: [...template.options],
    answer: template.answer,
    explanation: template.explanation
  };
}

function createFallbackQuiz(module, level) {
  console.log(`Creating fallback quiz for module: ${module.title}`);
  
  const quiz = [];
  for (let i = 1; i <= 4; i++) {
    quiz.push(createFallbackQuestion(module, level, i));
  }
  
  return quiz;
}

// Main enhanced course generation function
async function generateEnhancedCourse(topic, level, includeVideos, includeQuizzes) {
  console.log('Generating enhanced course:', { topic, level, includeVideos, includeQuizzes });

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const enhancedPrompt = generateEnhancedPrompt(topic, level, includeQuizzes);
    
    // Build the JSON template dynamically to ensure proper structure
    let moduleTemplate = `{
      "id": "module-1",
      "title": "Clear, descriptive module title",
      "keyPoints": [
        "Specific, actionable learning point 1",
        "Specific, actionable learning point 2",
        "Specific, actionable learning point 3",
        "Specific, actionable learning point 4"
      ],
      "explanation": "Comprehensive explanation (6-8 sentences) covering the module content in appropriate depth for ${level} level. Include relevant details, processes, and concepts students need to understand.",
      "example": "Practical, relatable example or analogy that reinforces the concepts. Make it concrete and easy to understand for ${level} learners.",
      "youtubeQuery": "Specific search terms for finding relevant educational videos"`;

    if (includeQuizzes) {
      moduleTemplate += `,
      "quiz": [
        {
          "question": "Clear, specific question text about the module content",
          "options": ["First option", "Second option", "Third option", "Fourth option"],
          "answer": "First option",
          "explanation": "Brief explanation of why this answer is correct"
        },
        {
          "question": "Another question testing different aspect of the module",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option B",
          "explanation": "Brief explanation of why this answer is correct"
        },
        {
          "question": "Third question focusing on practical application",
          "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
          "answer": "Choice 3",
          "explanation": "Brief explanation of why this answer is correct"
        },
        {
          "question": "Final question to test comprehensive understanding",
          "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
          "answer": "Answer A",
          "explanation": "Brief explanation of why this answer is correct"
        }
      ]`;
    }

    moduleTemplate += `
    }`;

    const prompt = `${enhancedPrompt}

CRITICAL REQUIREMENT: ${includeQuizzes ? 'YOU MUST INCLUDE EXACTLY 4 QUIZ QUESTIONS FOR EACH MODULE. THIS IS MANDATORY!' : 'No quiz questions needed.'}

${includeQuizzes ? `
QUIZ GENERATION RULES:
1. Each module MUST have a "quiz" array with exactly 4 questions
2. Each question MUST have: question, options (array of 4), answer (matching one option), explanation
3. Questions should test understanding of the module content
4. Make questions ${level.toLowerCase()}-appropriate
5. Ensure answers exactly match one of the options
` : ''}

Create a comprehensive course with the following JSON structure:

{
  "title": "Engaging course title appropriate for ${level} level",
  "overview": "2-3 sentence course overview explaining learning outcomes and benefits",
  "level": "${level}",
  "estimatedDuration": "Realistic time estimate (e.g., '6-8 hours', '2-3 weeks')",
  "modules": [
    ${moduleTemplate}
  ]
}

Requirements:
- Generate 4-6 modules that build upon each other logically
- Adjust content complexity appropriately for ${level} level
- Make explanations educational, comprehensive, and engaging
- Include practical examples that reinforce learning
- Ensure quiz questions test understanding at the appropriate level
- Make sure quiz answers exactly match one of the provided options

Topic: ${topic}
Level: ${level}

Return ONLY valid JSON, no additional text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response received, parsing...');

    // Parse JSON response
    let courseData;
    try {
      console.log('Raw Gemini response length:', text.length);
      console.log('Raw Gemini response preview:', text.substring(0, 500));
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        courseData = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed course data');
        console.log('Modules count:', courseData.modules?.length);
        
        // Log quiz status for each module
        if (includeQuizzes && courseData.modules) {
          courseData.modules.forEach((module, index) => {
            console.log(`Module ${index + 1} quiz status:`, {
              hasQuiz: !!module.quiz,
              quizLength: module.quiz?.length || 0,
              moduleTitle: module.title
            });
          });
        }
      } else {
        console.error('No JSON found in Gemini response');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Response text:', text);
      throw new Error('Failed to parse AI response');
    }

    // Validate response structure
    if (!courseData.title || !courseData.modules || !Array.isArray(courseData.modules)) {
      console.error('Invalid course structure:', {
        hasTitle: !!courseData.title,
        hasModules: !!courseData.modules,
        modulesIsArray: Array.isArray(courseData.modules)
      });
      throw new Error('Invalid course structure from AI');
    }

    // Add unique IDs to modules
    courseData.modules.forEach((module, index) => {
      if (!module.id) {
        module.id = `module-${index + 1}`;
      }
    });

    // Add YouTube videos if requested
    if (includeVideos && process.env.YOUTUBE_API_KEY) {
      console.log('Adding YouTube videos to modules...');
      
      for (const module of courseData.modules) {
        try {
          // Create enhanced search queries
          const searchQueries = [
            module.youtubeQuery || `${topic} ${module.title}`,
            `${topic} tutorial ${level.toLowerCase()}`,
            `learn ${topic} ${module.title.replace(/^Module \d+:?\s*/, '')} explained`
          ];

          let videos = [];
          for (const query of searchQueries) {
            if (videos.length === 0) { // Only get one video per module
              const searchResults = await searchYouTubeVideos(query, process.env.YOUTUBE_API_KEY, 1);
              videos = [...videos, ...searchResults];
            }
          }

          if (videos.length > 0) {
            module.videos = videos.slice(0, 1); // Limit to 1 video per module
          }
        } catch (videoError) {
          console.warn(`Failed to add videos for module ${module.title}:`, videoError);
        }
      }
    }

    // Validate and fix quiz structure if included
    if (includeQuizzes) {
      console.log('Validating and ensuring quiz questions...');
      
      courseData.modules.forEach((module, moduleIndex) => {
        // If module doesn't have quiz or quiz is empty, create fallback quiz
        if (!module.quiz || !Array.isArray(module.quiz) || module.quiz.length === 0) {
          console.warn(`Module ${moduleIndex + 1} missing quiz, creating fallback quiz`);
          module.quiz = createFallbackQuiz(module, level);
        }
        
        // Ensure we have exactly 4 questions
        if (module.quiz.length < 4) {
          console.warn(`Module ${moduleIndex + 1} has only ${module.quiz.length} questions, padding to 4`);
          while (module.quiz.length < 4) {
            module.quiz.push(createFallbackQuestion(module, level, module.quiz.length + 1));
          }
        }
        
        // Validate each question
        module.quiz.forEach((question, questionIndex) => {
          // Ensure question has all required fields
          if (!question.question) {
            question.question = `What is an important concept in ${module.title}?`;
          }
          if (!question.options || !Array.isArray(question.options) || question.options.length < 4) {
            question.options = ["Option A", "Option B", "Option C", "Option D"];
          }
          if (!question.answer) {
            question.answer = question.options[0];
          }
          if (!question.explanation) {
            question.explanation = "This is the correct answer based on the module content.";
          }
          
          // Ensure answer matches one of the options
          if (!question.options.includes(question.answer)) {
            console.warn(`Quiz question ${questionIndex + 1} in module ${moduleIndex + 1}: Answer doesn't match options`);
            question.answer = question.options[0];
          }
        });
      });
    }

    return courseData;

  } catch (error) {
    console.error('Enhanced course generation error:', error);
    throw error;
  }
}

// POST endpoint for enhanced course generation
export async function POST(request) {
  try {
    const { 
      topic, 
      level = 'Beginner',
      includeVideos = true,
      includeQuizzes = true
    } = await request.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Validate level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    console.log('Starting enhanced course generation:', { topic, level, includeVideos, includeQuizzes });

    const courseData = await generateEnhancedCourse(topic, level, includeVideos, includeQuizzes);

    // Add metadata
    courseData.metadata = {
      generatedAt: new Date().toISOString(),
      level: level,
      topic: topic,
      includeVideos: includeVideos,
      includeQuizzes: includeQuizzes,
      totalQuestions: includeQuizzes ? courseData.modules.reduce((total, module) => 
        total + (module.quiz ? module.quiz.length : 0), 0) : 0
    };

    console.log('Enhanced course generation completed successfully');
    return NextResponse.json(courseData);

  } catch (error) {
    console.error('Enhanced API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate enhanced course' }, 
      { status: 500 }
    );
  }
}
