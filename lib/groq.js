/**
 * Groq AI Integration for MindCourse
 * Fast, free AI for course generation with structured output
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Main Groq API call function
 */
async function callGroq(messages, temperature = 0.7, maxTokens = 8000) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not found in environment variables');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Latest 70B model (replaces deprecated 3.1)
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    })
  });

  if (!response.ok) {
    let errorMessage = `Groq API error: ${response.status} ${response.statusText}`;
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

  const response = await callGroq(messages, 0.3, 4000);
  
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
 */
export async function generateChapterContent(chapterTitle, objectives, keywords, difficulty = 'Beginner', chapterCount = 5) {
  const guidelines = {
    minWords: chapterCount > 5 ? 600 : 800,
    maxWords: chapterCount > 5 ? 800 : 1200,
  };

  const prompt = `You are a world-class educational content writer specializing in creating engaging, structured course materials.

Generate comprehensive, well-structured content for this module:

**Module Title:** ${chapterTitle}
**Learning Objectives:** ${objectives.join(', ')}
**Key Topics:** ${keywords.join(', ')}
**Difficulty Level:** ${difficulty}
**Target Length:** ${guidelines.minWords}-${guidelines.maxWords} words

⚠️ **CRITICAL STRUCTURE REQUIREMENTS - MUST FOLLOW EXACTLY:**

You MUST generate content with these EXACT 6 sections in this order:

## 📚 Introduction
[100-150 words hook and preview]

## 🎯 Core Concepts

### Concept 1: [Specific Name]
**What it is:** Clear definition
**Why it matters:** Practical importance
**How it works:** Step-by-step explanation
**Example:** Real-world scenario

### Concept 2: [Specific Name]
[Same structure as above]

## 💡 Real-World Examples
- **Example 1:** [Detailed scenario]
- **Example 2:** [Use case]
- **Example 3:** [Application]

## ✅ Best Practices
- **Practice 1:** [Actionable advice]
- **Practice 2:** [Guidance]
- **Practice 3:** [Tips]
- **Practice 4:** [Recommendations]

## ⚠ Common Mistakes to Avoid
- **Mistake 1:** [What to avoid and why]
- **Mistake 2:** [Pitfall and solution]
- **Mistake 3:** [Error and prevention]

## 🎓 Key Takeaways
- Takeaway point 1
- Takeaway point 2
- Takeaway point 3
- Takeaway point 4
- Takeaway point 5

**RULES:**
1. Use EXACT markdown headers shown above (with emojis)
2. Generate ALL 6 sections - never skip any
3. Use bold formatting for subsection labels
4. Include at least 2 Core Concepts with full structure
5. Keep total length ${guidelines.minWords}-${guidelines.maxWords} words
6. Same structure for ALL difficulty levels (only complexity changes)

Return ONLY the markdown content, no additional text.`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert educational content writer. Always follow the exact structure provided. Generate complete, engaging content with all required sections.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroq(messages, 0.7, 8000);
  return response.trim();
}

/**
 * 3. QUIZ GENERATION
 */
export async function generateQuiz(chapterTitle, content, difficulty = 'Beginner') {
  const prompt = `Generate 5 multiple-choice quiz questions for this module:

**Module:** ${chapterTitle}
**Difficulty:** ${difficulty}
**Content Summary:** ${content.substring(0, 500)}...

Requirements:
- 5 questions total
- Each question has 4 options (A, B, C, D)
- Only one correct answer per question
- Include explanation for correct answer
- Questions should test understanding, not just memorization

Return valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "A",
    "explanation": "Why this is correct"
  }
]

Return ONLY the JSON array, no other text.`;

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

  const response = await callGroq(messages, 0.3, 2000);
  
  // Clean up markdown code blocks
  let cleanedResponse = response.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const firstBracket = cleanedResponse.indexOf('[');
  const lastBracket = cleanedResponse.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleanedResponse = cleanedResponse.substring(firstBracket, lastBracket + 1);
  }
  
  return JSON.parse(cleanedResponse);
}

/**
 * 4. COURSE GENERATION FROM ARBITRARY SOURCE TEXT
 * Takes a large body of input text (from PDF, PPT, DOCX, web pages, etc.) and
 * asks Groq to design a course outline + module content + quizzes grounded in
 * that material. This intentionally mirrors the structure returned by other
 * course generation helpers so it can pass through existing validation and
 * persistence logic.
 */
export async function generateCourseFromSourceText(sourceText, options = {}) {
  const {
    maxModules = 8,
    minModules = 4,
    includeQuiz = true,
    defaultCategory = 'General',
    defaultDifficulty = 'Beginner'
  } = options;

  if (!sourceText || typeof sourceText !== 'string') {
    throw new Error('Source text is required to generate a course');
  }

  // Truncate very long inputs to keep the prompt within model limits
  const maxChars = 16000;
  const truncated = sourceText.length > maxChars
    ? sourceText.slice(0, maxChars)
    : sourceText;

  const prompt = `You are an expert course designer and technical educator with deep subject knowledge.

Your job is to convert raw input content into a fully structured, industry-level course
that is clear, accurate, and easy for learners to understand without oversimplifying.

Tone & style rules:
- Professional, technical, and academically correct.
- No childish language, no generic definitions.
- Teach like a real university lecturer or senior engineer.
- Use examples that mirror real-life applications.
- Keep explanations concise but insightful.

When producing module content:
- Explain core ideas with clarity and technical accuracy.
- Provide intuition and real-world context.
- Avoid unnecessary storytelling or filler.
- Break concepts down logically and progressively.

When producing quiz questions:
- Do NOT make them obvious or trivial.
- Require understanding, application, or analysis (Bloom's taxonomy).
- Use 4 strong options with plausible distractors.
- Include the correct answer and a short, high-quality explanation.

Convert the following content into a high-quality technical course while keeping it simple
enough for motivated beginners to understand. Use professional language and accurate
technical depth, and do NOT generate childish, shallow, or overly basic content.

================ SOURCE MATERIAL (TRUNCATED) ================
${truncated}
=============================================================

Using ONLY the material above (do not add unrelated topics), design a course and return
**ONLY** valid JSON with the following structure:

{
  "course_title": "Engaging, accurate course title grounded in the source",
  "title": "Same as course_title for convenience",
  "overview": "2-3 line course overview based on the source material",
  "category": "${defaultCategory}",
  "difficulty": "${defaultDifficulty}",
  "duration": "3-5 hours",
  "modules": [
    {
      "id": "module-1",
      "title": "Module title derived from a coherent section of the source",
      "description": "Clear, technically accurate module content that explains the ideas, adds intuition, and uses concise real-world examples.",
      "content": "Same as description (full teaching content for this module)",
      "objectives": [
        "Concrete learning objective derived from the source",
        "Another specific skill or understanding based on the material"
      ],
      "keywords": ["keyword1", "keyword2"],
      "quiz": ${includeQuiz ? `[
        {
          "question": "Non-trivial question that tests understanding, application, or analysis of this module.",
          "options": [
            "Plausible option A",
            "Plausible option B",
            "Plausible option C",
            "Plausible option D"
          ],
          "correct_answer": "Exactly one of the options above",
          "correctIndex": 0,
          "explanation": "Short explanation grounded in the module content, clarifying why the correct answer is right and others are wrong."
        }
      ]` : '[]'}
    }
  ]
}

REQUIREMENTS:
- Create between ${minModules} and ${maxModules} modules, based on logical sections or themes in the source text.
- All module content and quizzes must be grounded in the source material.
- Write in a professional, technically accurate style without filler.
- Quiz questions must require understanding or application, not memorization or trivia.
- Return ONLY the JSON object, with no commentary, no markdown code fences,
  and no additional text before or after.`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert course designer and technical educator. Always respond with valid JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroq(messages, 0.35, 6000);

  // Clean up markdown code blocks or extra text if the model ignored
  // instructions and wrapped the JSON in fences.
  let cleanedResponse = response.trim();
  cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  const firstBrace = cleanedResponse.indexOf('{');
  const lastBrace = cleanedResponse.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleanedResponse);

  // Ensure a minimal, predictable structure for downstream code
  if (!parsed.course_title && !parsed.title) {
    parsed.course_title = 'Untitled Course from Source Material';
  }
  if (!Array.isArray(parsed.modules)) {
    parsed.modules = [];
  }

  return {
    ...parsed,
    // Helpful flag for callers so they know quizzes were requested
    include_quiz: includeQuiz
  };
}

/**
 * COMPLETE COURSE GENERATION PIPELINE
 */
export async function generateCompleteCourse(topic, category = 'General', difficulty = 'Beginner', includeQuiz = false, chapterCount = 5) {
  console.log(`🚀 Starting Groq course generation for: ${topic}`);
  
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
        module.subTopics.slice(0, 3),
        difficulty,
        chapterCount
      );
      
      const moduleData = {
        id: `module-${i + 1}`,
        title: module.title,
        description: content,
        objectives: module.subTopics,
        keywords: module.subTopics.slice(0, 3),
        quiz: []
      };

      // Step 3: Generate quiz if requested
      if (includeQuiz) {
        console.log(`   🧩 Generating quiz for: ${module.title}`);
        const quiz = await generateQuiz(module.title, content, difficulty);
        moduleData.quiz = quiz;
      }

      modules.push(moduleData);
    }

    console.log('✅ Groq course generation completed!');

    return {
      course_title: `${topic} - Complete ${difficulty} Course`,
      title: `${topic} - Complete ${difficulty} Course`,
      overview: `Master ${topic} with this comprehensive ${difficulty.toLowerCase()}-level course. Learn through structured modules, practical examples, and hands-on exercises.`,
      category: category,
      difficulty: difficulty,
      modules: modules,
      topic: topic
    };
  } catch (error) {
    console.error('❌ Groq course generation failed:', error.message);
    throw error;
  }
}
