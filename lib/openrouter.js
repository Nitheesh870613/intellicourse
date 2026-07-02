/**
 * OpenRouter API Integration for MindCourse
 * Three specialized models for different course generation tasks
 */

// Model configurations
const MODELS = {
  SYLLABUS: {
    name: 'openai/gpt-3.5-turbo',
    apiKey: process.env.OPENROUTER_SYLLABUS_API_KEY,
    purpose: 'Generate course structure and modules'
  },
  CONTENT: {
    name: 'openai/gpt-3.5-turbo', // Using GPT-3.5 for reliable content generation
    apiKey: process.env.OPENROUTER_CONTENT_API_KEY,
    purpose: 'Generate detailed chapter content (800-1200+ words)'
  },
  QUIZ: {
    name: 'openai/gpt-3.5-turbo', // Using GPT-3.5 for quiz generation
    apiKey: process.env.OPENROUTER_QUIZ_API_KEY,
    purpose: 'Generate structured quiz questions with explanations'
  }
};

/**
 * Generic OpenRouter API call function
 */
async function callOpenRouter(model, messages, temperature = 0.7) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${model.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      'X-Title': 'MindCourse - AI Course Builder'
    },
    body: JSON.stringify({
      model: model.name,
      messages: messages,
      temperature: temperature,
      // Increased tokens to allow full structured content generation
      max_tokens: model.purpose.includes('detailed chapter') || model.purpose.includes('content') ? 8000 : 2000
    })
  });

  if (!response.ok) {
    let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage += ` - ${JSON.stringify(errorData.error)}`;
      }
    } catch (e) {
      // Response not JSON, use status text
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 1. SYLLABUS GENERATION
 * Model: OpenAI GPT-3.5 Turbo
 * Purpose: Generate course structure and modules
 */
export async function generateSyllabus(topic, category = 'General', difficulty = 'Beginner', chapterCount = 5) {
  const prompt = `You are an expert curriculum designer and a world-class subject matter expert on ${topic}.

Your task is to generate a complete, structured, and pedagogically sound course syllabus for a ${difficulty} student.

Think step-by-step to create a logical progression of modules. The modules must start from the absolute fundamentals and gradually build up to more complex, applied concepts.

Topic: ${topic}
Category: ${category}
Difficulty Level: ${difficulty}

⚠️ CRITICAL: Generate EXACTLY ${chapterCount} modules (chapters). No more, no less. This is a strict requirement.

The output MUST be a valid JSON array. Do not include any other text, pre-amble, or explanation outside of the JSON structure.

The exact format must be:
[
  {
    "title": "Module 1: [Module Title]",
    "subTopics": [
      "[Sub-topic 1]",
      "[Sub-topic 2]",
      "..."
    ]
  },
  {
    "title": "Module 2: [Module Title]",
    "subTopics": [
      "[Sub-topic 1]",
      "[Sub-topic 2]",
      "..."
    ]
  }
]

Requirements:
- Generate EXACTLY ${chapterCount} modules (this is mandatory, not a suggestion)
- Each module title should be clear and descriptive
- Include 3-5 sub-topics per module
- Ensure logical progression from fundamentals to advanced concepts
- Sub-topics should be specific and actionable learning points
- Number of modules must be ${chapterCount} (verify before responding!)`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert curriculum designer. Always respond with valid JSON only. Think step-by-step to create logical course structures.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callOpenRouter(MODELS.SYLLABUS, messages, 0.3);

  // Clean up markdown code blocks if present
  let cleanedResponse = response.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  // Extract JSON from response
  const firstBracket = cleanedResponse.indexOf('[');
  const lastBracket = cleanedResponse.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleanedResponse = cleanedResponse.substring(firstBracket, lastBracket + 1);
  }

  return JSON.parse(cleanedResponse);
}

/**
 * 2. CONTENT GENERATION
 * Model: Meituan LongCat Flash Chat
 * Purpose: Generate detailed chapter content (800-1200+ words)
 */
export async function generateChapterContent(chapterTitle, objectives, keywords, difficulty = 'Beginner') {
  const guidelines = {
    minWords: difficulty === 'Beginner' ? 800 : difficulty === 'Intermediate' ? 1000 : 1200,
    style: difficulty === 'Beginner' ? 'Use simple language and analogies' :
      difficulty === 'Intermediate' ? 'Balance technical terms with explanations' :
        'Use precise technical terminology',
    examples: difficulty === 'Beginner' ? 'Include relatable, everyday examples' :
      difficulty === 'Intermediate' ? 'Use industry-relevant examples' :
        'Focus on complex scenarios and edge cases'
  };

  const prompt = `You are an expert educator creating comprehensive learning content for a ${difficulty} level student.

*Chapter Title*: ${chapterTitle}
*Learning Objectives*: ${objectives.join(', ')}
*Key Topics*: ${keywords.join(', ')}
*Difficulty Level*: ${difficulty}

*CONTENT REQUIREMENTS*:
- Minimum ${guidelines.minWords} words
- ${guidelines.style}
- ${guidelines.examples}

⚠️ CRITICAL: You MUST generate ALL sections below. Do NOT stop after the introduction. Generate the COMPLETE content including ALL sections from Introduction through Key Takeaways.

*STRUCTURE YOUR CONTENT AS FOLLOWS*:

## 📚 Introduction (100-150 words)
- Start with a relatable hook or real-world scenario
- Explain why this topic is important
- Preview what the learner will understand by the end

## 🎯 Core Concepts (400-500 words)
Break down the main concepts into clear, digestible sections:

### Concept 1: [Name]
- *What it is*: Clear definition in simple terms
- *Why it matters*: Real-world relevance
- *How it works*: Step-by-step explanation
- *Example*: Detailed real-world example

### Concept 2: [Name]
- *What it is*: Clear definition
- *Why it matters*: Practical application
- *How it works*: Detailed explanation
- *Example*: Concrete example with context

[Continue for all key concepts from the objectives]

## 💡 Real-World Examples (200-300 words)
Provide 2-3 detailed, relatable examples:
- *Example 1*: [Scenario] - Explain how the concept applies
- *Example 2*: [Scenario] - Show different use case
- *Example 3*: [Scenario] - Demonstrate practical application

## ✅ Best Practices (100-150 words)
- List 4-6 practical tips and best practices
- Explain WHY each practice is important
- Provide do's and don'ts

## ⚠ Common Mistakes to Avoid (100-150 words)
- List 3-5 common pitfalls
- Explain why they happen
- Show how to avoid or fix them

## 🎓 Key Takeaways (50-100 words)
- Summarize the 5-7 most important points
- Use bullet points for clarity
- Reinforce the learning objectives

*WRITING STYLE*:
${difficulty === 'Beginner' ? `
- Use everyday language and analogies
- Avoid technical jargon or explain it immediately
- Use "you" to make it personal
- Include phrases like "Think of it like..." or "Imagine..."
- Break complex ideas into simple steps
` : difficulty === 'Intermediate' ? ` 
- Balance technical terms with clear explanations
- Assume basic knowledge but explain advanced concepts
- Use practical, industry-relevant examples
- Include some code snippets or technical details
` : ` 
- Use precise technical terminology
- Focus on advanced patterns and optimization
- Include edge cases and complex scenarios
- Assume strong foundational knowledge
`}

⚠️ FINAL REMINDER: Generate the COMPLETE content with ALL 6 sections:

**THIS STRUCTURE IS MANDATORY FOR ${difficulty} LEVEL:**
- ✅ Use the SAME 6-section structure for Beginner, Intermediate, AND Advanced
- ✅ ONLY adjust content complexity/depth, NEVER change the structure
- ✅ ALL difficulty levels get: Introduction, Core Concepts, Examples, Best Practices, Mistakes, Takeaways

1. ## 📚 Introduction - REQUIRED FOR ${difficulty}
2. ## 🎯 Core Concepts (with at least 2 concept subsections) - REQUIRED FOR ${difficulty}
3. ## 💡 Real-World Examples (at least 3 examples) - REQUIRED FOR ${difficulty}
4. ## ✅ Best Practices (at least 4 practices) - REQUIRED FOR ${difficulty}
5. ## ⚠ Common Mistakes to Avoid (at least 3 mistakes) - REQUIRED FOR ${difficulty}
6. ## 🎓 Key Takeaways (at least 5 points) - REQUIRED FOR ${difficulty}

**Current Level: ${difficulty}** - Complexity changes, structure does NOT!

Do NOT stop after just the introduction. Write the FULL ${guidelines.minWords}+ word content now:`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert educator who creates detailed, engaging educational content. CRITICAL: Use the SAME 6-section structure for ALL difficulty levels (Beginner/Intermediate/Advanced). Only the content complexity changes, NEVER the format. Always generate COMPLETE content with ALL sections: Introduction, Core Concepts, Real-World Examples, Best Practices, Common Mistakes, and Key Takeaways. Never stop after just the introduction.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  return await callOpenRouter(MODELS.CONTENT, messages, 0.7);
}

/**
 * 3. QUIZ GENERATION
 * Model: OpenAI GPT-OSS-20B
 * Purpose: Generate structured quiz questions with explanations
 */
export async function generateQuiz(chapterTitle, keyTopics, difficulty = 'Beginner', questionCount = 5) {
  const prompt = `Generate ${questionCount} multiple-choice quiz questions for:

Chapter: ${chapterTitle}
Topics: ${keyTopics.join(', ')}
Difficulty: ${difficulty}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}

Requirements:
- Questions should test understanding, not just memorization
- All 4 options should be plausible
- correctAnswer is the index (0-3) of the correct option
- Include brief explanations that reinforce learning
- Mix question types: conceptual, application-based, and scenario-based
- Appropriate difficulty for ${difficulty} level students`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert quiz creator. Always respond with valid JSON only. Create questions that test understanding, not just memorization.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callOpenRouter(MODELS.QUIZ, messages, 0.3);
  return JSON.parse(response);
}

/**
 * COMPLETE COURSE GENERATION PIPELINE
 * Orchestrates all three models to create a comprehensive course
 */
export async function generateCompleteCourse(topic, category = 'General', difficulty = 'Beginner', includeQuiz = true, chapterCount = 5) {
  console.log(`🚀 Starting OpenRouter course generation for: ${topic}`);

  try {
    // Step 1: Generate syllabus structure
    console.log(`📋 Step 1: Generating course syllabus with ${chapterCount} modules...`);
    const syllabus = await generateSyllabus(topic, category, difficulty, chapterCount);
    console.log(`✅ Generated ${syllabus.length} modules (requested: ${chapterCount})`);

    // Step 2: Generate detailed content for each module
    console.log('📝 Step 2: Generating detailed content...');
    const modules = [];

    for (let i = 0; i < syllabus.length; i++) {
      const module = syllabus[i];
      console.log(`   📖 Generating content for: ${module.title}`);

      const content = await generateChapterContent(
        module.title,
        module.subTopics,
        module.subTopics.slice(0, 3), // Use first 3 subtopics as keywords
        difficulty
      );

      let quiz = null;
      if (includeQuiz) {
        console.log(`   🧩 Generating quiz for: ${module.title}`);
        const quizData = await generateQuiz(
          module.title,
          module.subTopics.slice(0, 3),
          difficulty,
          5
        );
        quiz = quizData.questions;
      }

      modules.push({
        id: `module-${i + 1}`,
        title: module.title,
        description: content,
        objectives: module.subTopics,
        keywords: module.subTopics.slice(0, 3),
        quiz: quiz || []
      });
    }

    console.log('✅ OpenRouter course generation completed!');

    return {
      course_title: `${topic} - Complete ${difficulty} Course`,
      overview: `Master ${topic} with this comprehensive ${difficulty.toLowerCase()}-level course. Learn through structured modules, practical examples, and expert guidance.`,
      category: category,
      difficulty: difficulty,
      duration: `${Math.max(2, syllabus.length)} hours`,
      modules: modules,
      include_quiz: includeQuiz,
      include_videos: false
    };

  } catch (error) {
    console.error('❌ OpenRouter course generation failed:', error);
    throw error;
  }
}
