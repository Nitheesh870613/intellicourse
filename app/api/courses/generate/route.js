import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndEnhanceCourse, formatCourseToStructuredJSON } from '@/lib/utils/courseBuilder';
import { generateCompleteCourse as generateGroqCourse } from '@/lib/groq';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced course generation function with structured output
async function generateCourseWithAI(topic, category, difficulty, duration, chapterCount, includeVideos = false, includeQuiz = false) {
  console.log('Generating course with AI:', { topic, category, difficulty, duration, chapterCount, includeVideos, includeQuiz });
  
  // Try Groq first (fast and free!)
  if (process.env.GROQ_API_KEY) {
    console.log('⚡ Using Groq AI - Lightning Fast & Free!');
    try {
      const groqCourse = await generateGroqCourse(topic, category, difficulty, includeQuiz, chapterCount);
      console.log('✅ Groq course generated successfully');
      console.log(`   📚 Title: ${groqCourse.course_title}`);
      console.log(`   📖 Modules: ${groqCourse.modules.length} (requested: ${chapterCount})`);
      if (includeQuiz) {
        const totalQuizzes = groqCourse.modules.reduce((sum, m) => sum + (m.quiz?.length || 0), 0);
        console.log(`   🧩 Total Quiz Questions: ${totalQuizzes}`);
      }
      return groqCourse;
    } catch (groqError) {
      console.error('❌ Groq failed, falling back to Gemini:', groqError.message);
      // Fall through to Gemini
    }
  } else {
    console.log('⚠️ Groq API key not found, using Gemini AI');
  }
  
  // Helper function to generate fallback course with enhanced structure
  const generateFallbackCourse = () => {
    console.log('Generating enhanced fallback course data');
    return {
      course_title: `${topic} - Complete ${difficulty} Course`,
      overview: `A comprehensive ${difficulty.toLowerCase()} course covering all essential aspects of ${topic}. Learn through structured modules, practical examples, and hands-on exercises.`,
      category: category || 'General',
      difficulty: difficulty || 'Beginner',
      duration: duration || '3-5 hours',
      modules: Array.from({ length: parseInt(chapterCount) || 5 }, (_, i) => ({
        id: `module-${i + 1}`,
        title: `Module ${i + 1}: Fundamentals of ${topic}`,
        description: `This module introduces you to the core concepts of ${topic}. You'll learn the essential principles, understand key terminology, and explore practical applications. By the end of this module, you'll have a solid foundation to build upon in subsequent lessons.\n\nWe'll cover both theoretical concepts and practical implementations, ensuring you understand not just the 'what' but also the 'why' and 'how' of ${topic}. Real-world examples and case studies will help you connect the learning to practical scenarios.`,
        objectives: [
          `Understand the fundamental concepts and principles of ${topic}`,
          `Identify key terminology and definitions in the ${topic} domain`,
          `Apply basic ${topic} concepts to real-world scenarios`,
          `Evaluate different approaches and methodologies in ${topic}`,
          `Create simple projects or solutions using ${topic} knowledge`
        ],
        keywords: [topic.toLowerCase(), "fundamentals", "basics", "introduction"],
        videoSearchTerms: `${topic} tutorial basics fundamentals introduction ${difficulty.toLowerCase()}`
      }))
    };
  };

  // If no API key, return fallback response
  if (!process.env.GEMINI_API_KEY) {
    console.log('No Gemini API key found, using fallback response');
    return generateFallbackCourse();
  }

  try {
    // Create the enhanced prompt for Gemini AI Course Builder
    const prompt = `You are an AI Course Builder assistant for "IntelliCourse". Generate a complete educational course outline.

🎓 COURSE TOPIC: ${topic}
📚 CATEGORY: ${category || 'General'}
⚡ DIFFICULTY: ${difficulty || 'Beginner'}
⏱️ DURATION: ${duration || '3-5 hours'}
📖 MODULES: ${chapterCount || 5}
${includeQuiz ? '🧠 INCLUDE QUIZZES: Generate 5 quiz questions per module' : ''}

Generate a JSON response with this EXACT structure:
{
  "course_title": "Engaging Course Title",
  "overview": "Brief 2-3 line course description explaining what students will learn",
  "category": "${category || 'General'}",
  "difficulty": "${difficulty || 'Beginner'}",
  "duration": "${duration || '3-5 hours'}",
  "modules": [
    {
      "id": "module-1",
      "title": "Module Title",
      "description": "Generate comprehensive structured content with EXACT markdown formatting:\n\n## 📚 Introduction\nWrite 100-150 words with a relatable hook, explain importance, and preview outcomes.\n\n## 🎯 Core Concepts\n\n### Concept 1: [Specific Name]\n**What it is:** Clear definition in simple terms\n**Why it matters:** Real-world relevance\n**How it works:** Step-by-step explanation\n**Example:** Detailed real-world example\n\n### Concept 2: [Specific Name]\n**What it is:** Clear definition\n**Why it matters:** Practical application\n**How it works:** Detailed explanation\n**Example:** Concrete example with context\n\n## 💡 Real-World Examples\n- **Example 1:** [Scenario] - Explain application\n- **Example 2:** [Different use case]\n- **Example 3:** [Practical demonstration]\n\n## ✅ Best Practices\n- **Practice 1:** Explanation of why important\n- **Practice 2:** Do's and don'ts\n- **Practice 3:** Practical tip\n- **Practice 4:** Implementation advice\n\n## ⚠ Common Mistakes to Avoid\n- **Mistake 1:** Why it happens and how to avoid\n- **Mistake 2:** Prevention strategy\n- **Mistake 3:** Solution approach\n\n## 🎓 Key Takeaways\n- Key point 1\n- Key point 2\n- Key point 3\n- Key point 4\n- Key point 5",
      "objectives": [
        "Clear learning objective 1",
        "Specific skill or knowledge objective 2",
        "Practical application objective 3",
        "Assessment or evaluation objective 4"
      ],
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "videoSearchTerms": "specific search terms for finding relevant YouTube videos"${includeQuiz ? `,
      "quiz": [
        {
          "question": "Clear, specific question testing understanding (not just memorization)",
          "options": ["Plausible option A", "Plausible option B", "Plausible option C", "Plausible option D"],
          "correct_answer": "Plausible option A",
          "explanation": "Detailed explanation of why this answer is correct and why others are incorrect"
        }
      ]` : ''}
    }
  ]
}

🧩 REQUIREMENTS:
1. **Course Title**: Make it catchy, SEO-friendly, and clearly indicate the subject and level
2. **Overview**: 2-3 lines explaining the course value proposition
3. **Modules**: Create exactly ${chapterCount || 5} comprehensive modules
4. **Module Content**: ⚠️ CRITICAL - YOU MUST GENERATE COMPLETE CONTENT WITH ALL SECTIONS. DO NOT STOP AFTER JUST THE INTRODUCTION!
5. **Content Length**: ${chapterCount > 5 ? 'Keep content concise (600-800 words per module) to fit all modules' : 'Generate comprehensive content (800-1200 words per module)'} 

**EXAMPLE OF REQUIRED MARKDOWN FORMAT:**

## 📚 Introduction
This module introduces you to the core concepts of [topic]. You'll learn the essential principles, understand key terminology, and explore practical applications. By the end of this module, you'll have a solid foundation to build upon in subsequent lessons.

## 🎯 Core Concepts

### Concept 1: [Specific Name]
**What it is:** Clear definition in simple terms explaining what this concept means.
**Why it matters:** Real-world relevance and importance of understanding this concept.
**How it works:** Step-by-step explanation of the underlying mechanics or process.
**Example:** Detailed real-world example showing this concept in action.

### Concept 2: [Specific Name]  
**What it is:** Another clear definition with practical context.
**Why it matters:** Practical applications and use cases.
**How it works:** Detailed explanation of implementation.
**Example:** Concrete example with specific details.

## 💡 Real-World Examples
- **Example 1: [Scenario Name]** - Detailed explanation of how this is applied in a real scenario with specific context.
- **Example 2: [Different Use Case]** - Another practical application showing versatility.
- **Example 3: [Industry Application]** - Professional or industry-specific example.

## ✅ Best Practices
- **Practice 1: [Specific Practice]** - Explanation of why this is important and how to implement it correctly.
- **Practice 2: [Another Practice]** - Do's and don'ts with practical guidance.
- **Practice 3: [Third Practice]** - Implementation advice with examples.
- **Practice 4: [Fourth Practice]** - Additional tips and recommendations.

## ⚠ Common Mistakes to Avoid
- **Mistake 1: [Common Error]** - Why this happens and how to avoid it with prevention strategies.
- **Mistake 2: [Another Mistake]** - Warning signs and solutions.
- **Mistake 3: [Third Mistake]** - Best approaches to prevent this issue.

## 🎓 Key Takeaways
- Key point 1: Main learning outcome
- Key point 2: Important concept to remember
- Key point 3: Practical application
- Key point 4: Critical understanding
- Key point 5: Next steps

**NOW GENERATE CONTENT WITH THIS EXACT STRUCTURE FOR EACH MODULE:**

⚠️ **CRITICAL STRUCTURE RULES - APPLY TO ALL DIFFICULTY LEVELS (Beginner/Intermediate/Advanced):**
   - **SAME FORMAT FOR ALL**: Whether Beginner, Intermediate, or Advanced, use the EXACT SAME structure
   - **ONLY CONTENT CHANGES**: Difficulty affects complexity of explanations, NOT the format or sections
   - **ALL 6 SECTIONS REQUIRED**: Every module must have all 6 sections regardless of difficulty/duration
   - **MUST use markdown headers**: ## 📚 Introduction, ## 🎯 Core Concepts, etc.
   - **MUST use markdown formatting**: **bold text**, bullet points, numbered lists
   - **MUST follow the exact template structure** - do not write plain paragraphs
   - **Content length** (${chapterCount} modules total): 
     * ${chapterCount > 5 ? 'Concise mode: 600-800 words per module (many chapters)' : 'Standard mode: 800-1200 words per module'}
   - **Structure sections (SAME FOR ALL LEVELS)**:
     * Introduction with hook and preview (100-150 words)
     * Core Concepts with subsections using ### headers (400-500 words)
     * Real-World Examples with bullet points (200-300 words)
     * Best Practices with numbered/bulleted list (100-150 words)
     * Common Mistakes with explanations (100-150 words)
     * Key Takeaways with bullet points (50-100 words)
5. **Learning Objectives**: 3-5 specific, measurable learning outcomes using action verbs
6. **Keywords**: 2-4 relevant terms for video searching
7. **Video Search Terms**: Specific phrases to find educational YouTube content${includeQuiz ? `
8. **Quiz Questions**: Generate exactly 5 high-quality quiz questions per module:
   - Questions must test UNDERSTANDING, not just memorization
   - All 4 options must be plausible and reasonable (avoid obvious wrong answers)
   - Options should be similar in length and structure
   - correct_answer must EXACTLY match one of the options (copy the exact text)
   - Explanations should be detailed and educational (2-3 sentences):
     * Explain WHY the correct answer is right
     * Briefly mention why other options are incorrect
     * Reinforce the learning concept
   - Mix question types: conceptual, application-based, and scenario-based
   - Appropriate difficulty for ${difficulty || 'Beginner'} level students
   - Cover different aspects of the module content` : ''}

🎯 WRITING STYLE FOR ${difficulty || 'Beginner'} LEVEL:
${difficulty === 'Beginner' ? `
- Use everyday language and analogies
- Avoid technical jargon or explain it immediately
- Use "you" to make it personal and engaging
- Include phrases like "Think of it like..." or "Imagine..."
- Break complex ideas into simple, digestible steps
- Provide plenty of context and background
- Use relatable examples from daily life
` : difficulty === 'Intermediate' ? `
- Balance technical terms with clear explanations
- Assume basic knowledge but explain advanced concepts thoroughly
- Use practical, industry-relevant examples
- Include some technical details and best practices
- Reference common tools and methodologies
- Show connections between concepts
` : `
- Use precise technical terminology appropriately
- Focus on advanced patterns, optimization, and edge cases
- Include complex scenarios and real-world challenges
- Assume strong foundational knowledge
- Discuss trade-offs and decision-making criteria
- Reference industry standards and advanced techniques
`}

📋 CONTENT FOCUS AREAS:
- Make content progressive (fundamentals to advanced concepts)
- Include practical applications and real-world examples
- Ensure each module builds upon previous knowledge
- Structure content for comprehensive ${duration || '3-5 hours'} of learning
- Provide actionable insights and takeaways
${includeQuiz ? `
📝 QUIZ QUALITY EXAMPLE:
GOOD Question:
{
  "question": "When choosing between a list and a tuple in Python, which scenario would most appropriately require using a tuple?",
  "options": [
    "Storing student grades that will be updated frequently throughout the semester",
    "Storing the RGB color values (255, 128, 0) for a UI element that won't change",
    "Creating a shopping cart where items can be added or removed",
    "Maintaining a dynamic queue of tasks to be processed"
  ],
  "correct_answer": "Storing the RGB color values (255, 128, 0) for a UI element that won't change",
  "explanation": "Tuples are immutable, making them perfect for storing fixed data like RGB values that shouldn't change. Lists are better for the other scenarios because they allow modification. This tests understanding of when to use immutable vs mutable data structures, not just definitions."
}

BAD Question (avoid this):
{
  "question": "What is a tuple?",
  "options": ["A mutable sequence", "An immutable sequence", "A dictionary", "A function"],
  "correct_answer": "An immutable sequence",
  "explanation": "A tuple is immutable."
}
` : ''}

⚠️⚠️⚠️ FINAL CRITICAL REMINDER ⚠️⚠️⚠️

**THE STRUCTURE BELOW IS MANDATORY FOR ALL COURSES:**
- ✅ Applies to: Beginner, Intermediate, AND Advanced difficulty
- ✅ Applies to: 1-2 hours, 3-5 hours, AND 6+ hours duration
- ✅ Applies to: 3 chapters, 5 chapters, AND 10+ chapters
- ✅ ONLY the content complexity changes - NEVER the structure!

Each module's "description" field MUST contain ALL 6 sections with complete content:
1. ## 📚 Introduction (100-150 words) - REQUIRED FOR ALL LEVELS
2. ## 🎯 Core Concepts (400-500 words with at least 2 concept subsections) - REQUIRED FOR ALL LEVELS
3. ## 💡 Real-World Examples (200-300 words with at least 3 examples) - REQUIRED FOR ALL LEVELS
4. ## ✅ Best Practices (100-150 words with at least 4 practices) - REQUIRED FOR ALL LEVELS
5. ## ⚠ Common Mistakes to Avoid (100-150 words with at least 3 mistakes) - REQUIRED FOR ALL LEVELS
6. ## 🎓 Key Takeaways (50-100 words with at least 5 points) - REQUIRED FOR ALL LEVELS

**Difficulty Level: ${difficulty || 'Beginner'}** - Adjust CONTENT complexity, NOT structure!
**Duration: ${duration || '3-5 hours'}** - Affects total depth, NOT section structure!
**Chapter Count: ${chapterCount || 5}** - Number of modules, NOT their structure!

DO NOT generate only the Introduction section. Generate the COMPLETE content for each module (${chapterCount > 5 ? '600-800' : '800-1200'} words per module).

⚠️ CRITICAL FOR ${chapterCount} MODULES: Keep each module ${chapterCount > 5 ? 'concise but complete' : 'comprehensive'} to stay within response limits!

Return ONLY valid JSON, no additional text or explanations.`;

    // Generate content with Gemini
    // Configure model with maximum output tokens to prevent JSON truncation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text();

    console.log('🤖 Raw Gemini response length:', rawText.length);
    
    // Clean up any code block markers and extra text
    rawText = rawText.replace(/```json|```/g, '').trim();
    
    // Remove any text before the first { and after the last }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    console.log('🧹 Cleaned Gemini response:', rawText.substring(0, 500) + '...');

    // Parse the JSON response
    let courseData;
    try {
      courseData = JSON.parse(rawText);
      console.log('✅ Successfully parsed Gemini JSON response');
      
      // Debug: Check if quizzes were generated
      if (includeQuiz) {
        const quizCount = courseData.modules?.reduce((sum, m) => sum + (m.quiz?.length || 0), 0) || 0;
        console.log(`🧩 Total quizzes generated: ${quizCount}`);
        
        if (quizCount === 0) {
          console.warn('⚠️ No quizzes found in Gemini response despite includeQuiz=true');
        } else {
          console.log('📝 Quiz generation successful!');
          courseData.modules.forEach((module, index) => {
            if (module.quiz && module.quiz.length > 0) {
              console.log(`   Module ${index + 1} (${module.title}): ${module.quiz.length} questions`);
            }
          });
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError.message);
      console.error('Raw response preview:', rawText.substring(0, 500));
      console.log('Falling back to fallback response due to parsing error');
      return generateFallbackCourse();
    }

    // Validate the enhanced response structure
    if (!courseData.course_title && !courseData.title) {
      console.log('Invalid AI response structure, falling back to fallback response');
      return generateFallbackCourse();
    }

    // Handle both old and new response formats
    const title = courseData.course_title || courseData.title;
    const overview = courseData.overview || `Learn ${topic} with this comprehensive course.`;
    const modules = courseData.modules || courseData.chapters || [];

    if (!Array.isArray(modules)) {
      console.log('Invalid modules structure, falling back to fallback response');
      return generateFallbackCourse();
    }

    // Use the validation utility to ensure proper structure
    const rawCourse = {
      course_title: title,
      overview: overview,
      category: courseData.category || category || 'General',
      difficulty: courseData.difficulty || difficulty || 'Beginner',
      duration: courseData.duration || duration || '3-5 hours',
      modules: modules
    };

    // Validate and enhance the course structure
    const normalizedCourse = validateAndEnhanceCourse(rawCourse);
    
    return normalizedCourse;

    // YouTube integration disabled - videos will be null
    // if (includeVideos) {
    //   const apiKey = process.env.YOUTUBE_API_KEY;
    //   if (apiKey) {
    //     const courseTitleForQuery = courseData.title || topic;
    //     const enriched = await Promise.all(courseData.chapters.map(async (ch) => {
    //       if (ch.videoUrl) return ch;
    //       const query = `${courseTitleForQuery} ${ch.title}`;
    //       const videoId = await searchYouTubeCached(query, apiKey);
    //       if (videoId) {
    //         return { ...ch, videoUrl: `https://www.youtube.com/watch?v=${videoId}` };
    //       }
    //       return ch; // leave without video when none found
    //     }));
    //     courseData.chapters = enriched;
    //   }
    // }

    return courseData;

  } catch (geminiError) {
    console.error('Gemini API error:', geminiError);
    console.log('Falling back to fallback response due to Gemini API error');
    return generateFallbackCourse();
  }
}

// Search YouTube for top N video IDs
async function searchYouTubeVideoIds(query, apiKey, max = 3) {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: String(Math.min(Math.max(max, 1), 5)),
      safeSearch: 'moderate'
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const ids = (data.items || [])
      .map((item) => item?.id?.videoId)
      .filter(Boolean);
    return ids;
  } catch (e) {
    return [];
  }
}

// Search YouTube and return single video ID (cached wrapper)
async function searchYouTubeCached(query, apiKey) {
  try {
    const videoIds = await searchYouTubeVideoIds(query, apiKey, 1);
    return videoIds.length > 0 ? videoIds[0] : null;
  } catch (e) {
    console.error('Error in searchYouTubeCached:', e);
    return null;
  }
}

// Legacy mock courses generator (moved into a function to avoid top-level returns)
function generateLegacyCourse(topic) {
  const mockCourses = {
    'machine learning': {
      title: 'Introduction to Machine Learning for Beginners',
      description: 'A comprehensive introduction to machine learning concepts, algorithms, and practical applications for beginners.',
      difficulty: 'Beginner',
      duration: '8 weeks',
      outline: `# Introduction to Machine Learning for Beginners

## Course Overview
A comprehensive introduction to machine learning concepts, algorithms, and practical applications designed for beginners with no prior experience in AI or data science.

## Learning Objectives
By the end of this course, students will be able to:
- Understand fundamental machine learning concepts and terminology
- Implement basic ML algorithms using Python
- Evaluate and improve model performance
- Deploy ML models for real-world applications
- Continue learning advanced ML topics independently

## Prerequisites
- Basic programming knowledge (Python recommended)
- High school level mathematics
- No prior machine learning experience required

---

## Module 1: Foundations of Machine Learning

### Learning Objectives
- Define machine learning and its applications
- Understand different types of machine learning
- Compare ML with traditional programming approaches

### Key Topics
- **What is Machine Learning?**
  - Definition and core concepts
  - Historical development and milestones
  - Current applications in various industries

- **Types of Machine Learning**
  - Supervised Learning: Classification and Regression
  - Unsupervised Learning: Clustering and Dimensionality Reduction
  - Reinforcement Learning: Decision Making and Control

- **Machine Learning vs Traditional Programming**
  - Rule-based vs Data-driven approaches
  - When to use machine learning
  - Limitations and considerations

- **Real-world Applications**
  - Healthcare and medical diagnosis
  - Finance and fraud detection
  - E-commerce and recommendation systems
  - Autonomous vehicles and robotics

### Practical Exercise
Create a simple decision tree to classify emails as spam or not spam using sample data.

---

## Module 2: Mathematics Fundamentals

### Learning Objectives
- Understand essential mathematical concepts for ML
- Apply linear algebra in machine learning contexts
- Use statistics for data analysis and model evaluation

### Key Topics
- **Linear Algebra Basics**
  - Vectors and matrices
  - Matrix operations and properties
  - Eigenvalues and eigenvectors
  - Applications in ML algorithms

- **Statistics and Probability**
  - Descriptive statistics (mean, median, mode, variance)
  - Probability distributions
  - Hypothesis testing
  - Correlation and covariance

- **Calculus Concepts for ML**
  - Derivatives and gradients
  - Optimization techniques
  - Gradient descent algorithm
  - Chain rule and backpropagation

- **Mathematical Notation**
  - Common symbols and conventions
  - Reading ML papers and documentation
  - Communicating mathematical concepts

### Practical Exercise
Implement gradient descent from scratch to find the minimum of a simple function.

---

## Module 3: Python for Machine Learning

### Learning Objectives
- Master essential Python libraries for ML
- Manipulate and visualize data effectively
- Set up a proper ML development environment

### Key Topics
- **Python Basics Review**
  - Data types and structures
  - Functions and classes
  - Error handling and debugging
  - Code organization and best practices

- **Essential Libraries**
  - **NumPy**: Numerical computing and array operations
  - **Pandas**: Data manipulation and analysis
  - **Matplotlib/Seaborn**: Data visualization
  - **Scikit-learn**: Machine learning algorithms

- **Jupyter Notebooks**
  - Interactive development environment
  - Markdown and code cells
  - Data exploration and prototyping
  - Sharing and collaboration

- **Data Manipulation**
  - Loading and saving data
  - Data cleaning and preprocessing
  - Feature engineering
  - Handling missing values

### Practical Exercise
Analyze a real dataset using Pandas and create visualizations with Matplotlib.

---

## Module 4: Supervised Learning

### Learning Objectives
- Implement and evaluate supervised learning algorithms
- Understand when to use different algorithms
- Optimize model performance

### Key Topics
- **Linear Regression**
  - Simple and multiple linear regression
  - Assumptions and limitations
  - Regularization (Ridge, Lasso)
  - Model evaluation metrics

- **Logistic Regression**
  - Binary and multiclass classification
  - Sigmoid function and decision boundaries
  - Maximum likelihood estimation
  - Performance metrics for classification

- **Decision Trees**
  - Tree construction algorithms
  - Splitting criteria (Gini, Entropy)
  - Pruning and overfitting prevention
  - Random Forests and ensemble methods

- **Support Vector Machines**
  - Maximum margin classifier
  - Kernel trick and non-linear boundaries
  - Hyperparameter tuning
  - Advantages and limitations

- **Model Evaluation Metrics**
  - Cross-validation techniques
  - Confusion matrix and classification metrics
  - ROC curves and AUC
  - Bias-variance tradeoff

### Practical Exercise
Build a complete supervised learning pipeline to predict house prices using multiple algorithms.

---

## Module 5: Unsupervised Learning

### Learning Objectives
- Apply unsupervised learning techniques to real data
- Understand clustering and dimensionality reduction
- Discover hidden patterns in data

### Key Topics
- **Clustering Algorithms**
  - K-means clustering
  - Hierarchical clustering
  - DBSCAN and density-based clustering
  - Choosing the right number of clusters

- **Dimensionality Reduction**
  - Principal Component Analysis (PCA)
  - Linear Discriminant Analysis (LDA)
  - t-SNE and UMAP for visualization
  - Feature selection techniques

- **Association Rules**
  - Market basket analysis
  - Apriori algorithm
  - Support, confidence, and lift
  - Applications in recommendation systems

- **Anomaly Detection**
  - Statistical methods
  - Isolation Forest
  - One-class SVM
  - Applications in fraud detection

### Practical Exercise
Perform customer segmentation using clustering algorithms on e-commerce data.

---

## Module 6: Neural Networks Basics

### Learning Objectives
- Understand neural network architecture and training
- Implement basic neural networks
- Apply neural networks to classification and regression

### Key Topics
- **Introduction to Neural Networks**
  - Perceptron and multilayer perceptron
  - Network architecture and layers
  - Forward and backward propagation
  - Activation functions

- **Activation Functions**
  - Sigmoid, Tanh, and ReLU
  - Choosing appropriate activation functions
  - Vanishing gradient problem
  - Modern activation functions (Leaky ReLU, ELU)

- **Backpropagation**
  - Chain rule and gradient computation
  - Weight updates and learning rate
  - Batch vs stochastic gradient descent
  - Common optimization algorithms

- **Building Simple Neural Networks**
  - Architecture design principles
  - Hyperparameter tuning
  - Regularization techniques
  - Debugging neural networks

### Practical Exercise
Build a neural network to classify handwritten digits using the MNIST dataset.

---

## Module 7: Model Deployment

### Learning Objectives
- Deploy machine learning models to production
- Create APIs for model serving
- Monitor and maintain deployed models

### Key Topics
- **Model Serialization**
  - Pickle and joblib for Python models
  - ONNX for cross-platform deployment
  - Model versioning and management
  - Best practices for model storage

- **Web APIs with Flask/FastAPI**
  - RESTful API design principles
  - Request/response handling
  - Input validation and error handling
  - API documentation and testing

- **Cloud Deployment Options**
  - AWS SageMaker and Azure ML
  - Google Cloud AI Platform
  - Docker containerization
  - Serverless deployment options

- **Model Monitoring**
  - Performance monitoring and alerting
  - Data drift detection
  - Model retraining strategies
  - A/B testing for models

### Practical Exercise
Deploy a trained model as a web API and create a simple frontend to interact with it.

---

## Module 8: Capstone Project

### Learning Objectives
- Apply all learned concepts in a comprehensive project
- Demonstrate end-to-end ML workflow
- Present findings and insights effectively

### Key Topics
- **End-to-End ML Project**
  - Problem definition and business understanding
  - Data collection and exploration
  - Feature engineering and selection
  - Model development and evaluation

- **Data Collection and Preprocessing**
  - Data sources and APIs
  - Data quality assessment
  - Cleaning and transformation
  - Feature scaling and encoding

- **Model Training and Evaluation**
  - Algorithm selection and comparison
  - Hyperparameter optimization
  - Cross-validation and testing
  - Performance analysis and interpretation

- **Presentation and Documentation**
  - Technical documentation
  - Visualization and storytelling
  - Code organization and version control
  - Future improvements and extensions

### Capstone Project Requirements
- Choose a real-world problem
- Collect and analyze relevant data
- Implement at least 3 different algorithms
- Compare and evaluate model performance
- Deploy the best model
- Create comprehensive documentation
- Present findings to peers

---

## Assessment Methods

### Weekly Quizzes (30%)
- Multiple choice questions on concepts
- Coding challenges and mini-projects
- Peer review and discussion participation

### Hands-on Projects (40%)
- Module-specific practical exercises
- Data analysis and visualization projects
- Algorithm implementation assignments
- Code review and best practices

### Final Capstone Project (30%)
- End-to-end machine learning project
- Technical presentation and documentation
- Peer evaluation and feedback
- Portfolio development

---

## Learning Resources

### Required Materials
- Jupyter Notebooks with course content
- Sample datasets and code examples
- Online documentation and tutorials
- Community forums and discussion boards

### Recommended Reading
- "Hands-On Machine Learning" by Aurélien Géron
- "Python Machine Learning" by Sebastian Raschka
- "The Elements of Statistical Learning" by Hastie, Tibshirani, and Friedman
- "Pattern Recognition and Machine Learning" by Christopher Bishop

### Tools and Software
- Python 3.8+ with Anaconda distribution
- Jupyter Notebook or JupyterLab
- Git for version control
- Cloud platforms (AWS, Google Cloud, or Azure)

---

## Course Schedule

| Week | Module | Topics | Assignment Due |
|------|--------|--------|----------------|
| 1 | Module 1 | ML Foundations | Quiz 1 |
| 2 | Module 2 | Mathematics | Quiz 2, Project 1 |
| 3 | Module 3 | Python for ML | Quiz 3, Project 2 |
| 4 | Module 4 | Supervised Learning | Quiz 4, Project 3 |
| 5 | Module 5 | Unsupervised Learning | Quiz 5, Project 4 |
| 6 | Module 6 | Neural Networks | Quiz 6, Project 5 |
| 7 | Module 7 | Model Deployment | Quiz 7, Project 6 |
| 8 | Module 8 | Capstone Project | Final Project |

---

## Support and Community

### Instructor Support
- Office hours: Tuesdays and Thursdays, 2-4 PM
- Email response within 24 hours
- One-on-one consultations available

### Peer Learning
- Study groups and collaboration
- Code review sessions
- Project showcase events
- Alumni network access

### Technical Support
- Installation and setup assistance
- Debugging help and troubleshooting
- Performance optimization guidance
- Career advice and mentorship`
    },
    'web development': {
      title: 'Complete Web Development Bootcamp',
      outline: `Course Title: Complete Web Development Bootcamp

Module 1: Web Fundamentals
- How the Internet Works
- Client-Server Architecture
- HTTP Protocol
- Web Browsers and Developer Tools

Module 2: HTML5 & CSS3
- Semantic HTML Structure
- CSS Layouts (Flexbox, Grid)
- Responsive Design Principles
- CSS Animations and Transitions
- Modern CSS Features

Module 3: JavaScript Fundamentals
- Variables, Data Types, and Functions
- DOM Manipulation
- Event Handling
- Asynchronous Programming (Promises, async/await)
- ES6+ Features

Module 4: Frontend Frameworks
- React.js Fundamentals
- Component Architecture
- State Management (useState, useContext)
- Hooks and Custom Hooks
- React Router

Module 5: Backend Development
- Node.js and Express.js
- RESTful API Design
- Database Integration (MongoDB/PostgreSQL)
- Authentication and Authorization
- API Security Best Practices

Module 6: Full-Stack Integration
- Connecting Frontend and Backend
- State Management (Redux, Zustand)
- API Integration
- Error Handling
- Loading States

Module 7: Advanced Topics
- TypeScript
- Testing (Jest, React Testing Library)
- Performance Optimization
- SEO Best Practices
- Progressive Web Apps

Module 8: Deployment & DevOps
- Version Control with Git
- CI/CD Pipelines
- Cloud Deployment (Vercel, Netlify, AWS)
- Domain Management
- Performance Monitoring

Assessment Methods:
- Weekly Coding Challenges (25%)
- Mini Projects (35%)
- Final Full-Stack Project (40%)

Learning Outcomes:
By the end of this course, students will be able to:
- Build responsive, modern web applications
- Create RESTful APIs and integrate with databases
- Deploy applications to production
- Work with modern development tools and workflows
- Continue learning advanced web technologies`
    },
    'digital marketing': {
      title: 'Digital Marketing Mastery',
      outline: `Course Title: Digital Marketing Mastery

Module 1: Digital Marketing Fundamentals
- Evolution of Marketing
- Digital vs Traditional Marketing
- Customer Journey Mapping
- Marketing Funnel Stages
- Digital Marketing Strategy

Module 2: Content Marketing
- Content Strategy Development
- Blog Writing and SEO
- Video Content Creation
- Social Media Content
- Content Calendar Planning

Module 3: Search Engine Optimization (SEO)
- On-Page SEO Techniques
- Keyword Research and Analysis
- Technical SEO
- Local SEO
- SEO Analytics and Reporting

Module 4: Social Media Marketing
- Platform-Specific Strategies
- Content Creation for Each Platform
- Community Management
- Influencer Marketing
- Social Media Advertising

Module 5: Email Marketing
- Email List Building
- Email Design and Copywriting
- Automation and Segmentation
- A/B Testing
- Email Analytics

Module 6: Pay-Per-Click Advertising
- Google Ads Fundamentals
- Facebook/Instagram Ads
- Ad Copywriting
- Landing Page Optimization
- Campaign Management

Module 7: Analytics and Data
- Google Analytics Setup
- Key Performance Indicators (KPIs)
- Data Analysis and Reporting
- Conversion Tracking
- Marketing Attribution

Module 8: Marketing Automation
- CRM Systems
- Marketing Automation Tools
- Lead Nurturing
- Customer Retention Strategies
- Marketing Technology Stack

Assessment Methods:
- Marketing Plan Development (30%)
- Campaign Creation and Execution (40%)
- Analytics and Reporting (30%)

Learning Outcomes:
By the end of this course, students will be able to:
- Develop comprehensive digital marketing strategies
- Execute campaigns across multiple channels
- Analyze and optimize marketing performance
- Use marketing automation tools effectively
- Stay current with digital marketing trends`
    }
  };

  // Find the best matching topic or generate a generic course
  const lowerTopic = topic.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, course] of Object.entries(mockCourses)) {
    if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
      const score = Math.max(lowerTopic.length, key.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = course;
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // Generate a generic course if no specific match
  return {
    title: `Complete Course on ${topic}`,
    outline: `Course Title: Complete Course on ${topic}

Module 1: Introduction to ${topic}
- What is ${topic}?
- Why is ${topic} important?
- Historical context and evolution
- Current trends and applications

Module 2: Fundamentals
- Core concepts and principles
- Basic terminology and definitions
- Essential frameworks and models
- Key theories and approaches

Module 3: Practical Applications
- Real-world examples and case studies
- Industry applications
- Best practices and methodologies
- Common challenges and solutions

Module 4: Advanced Concepts
- Complex topics and advanced techniques
- Emerging trends and innovations
- Research and development
- Future directions

Module 5: Tools and Technologies
- Essential tools and software
- Technology stack overview
- Platform selection criteria
- Integration strategies

Module 6: Implementation
- Step-by-step implementation guide
- Project planning and management
- Risk assessment and mitigation
- Quality assurance

Module 7: Evaluation and Optimization
- Performance measurement
- Key performance indicators
- Continuous improvement strategies
- Optimization techniques

Module 8: Capstone Project
- End-to-end project implementation
- Real-world application
- Documentation and presentation
- Future development planning

Assessment Methods:
- Weekly Assignments (30%)
- Mid-term Project (30%)
- Final Capstone Project (40%)

Learning Outcomes:
By the end of this course, students will be able to:
- Understand fundamental concepts of ${topic}
- Apply knowledge to real-world scenarios
- Use relevant tools and technologies
- Develop and implement ${topic}-related projects
- Continue learning and growing in the field`
  };
}

// Function to generate quiz questions for a module
function generateQuizQuestions(moduleTitle, keyTopics, difficulty = 'Beginner') {
  const questionTemplates = {
    'Foundations of Machine Learning': [
      {
        question: "What is the primary difference between supervised and unsupervised learning?",
        options: [
          "Supervised learning uses labeled data, unsupervised learning uses unlabeled data",
          "Supervised learning is faster than unsupervised learning",
          "Unsupervised learning requires more computational power",
          "There is no difference between the two approaches"
        ],
        correct: 0,
        explanation: "Supervised learning uses labeled training data to learn patterns, while unsupervised learning finds hidden patterns in unlabeled data."
      },
      {
        question: "Which of the following is NOT a type of machine learning?",
        options: [
          "Supervised Learning",
          "Unsupervised Learning", 
          "Reinforcement Learning",
          "Deterministic Learning"
        ],
        correct: 3,
        explanation: "Deterministic Learning is not a recognized type of machine learning. The three main types are supervised, unsupervised, and reinforcement learning."
      }
    ],
    'Mathematics Fundamentals': [
      {
        question: "What is the purpose of gradient descent in machine learning?",
        options: [
          "To increase the learning rate",
          "To find the minimum of a cost function",
          "To normalize the data",
          "To visualize the data"
        ],
        correct: 1,
        explanation: "Gradient descent is an optimization algorithm used to minimize the cost function by iteratively moving in the direction of steepest descent."
      }
    ]
  };

  // Return questions for the specific module or generate generic ones
  return questionTemplates[moduleTitle] || [
    {
      question: `What is the main focus of ${moduleTitle}?`,
      options: [
        "Advanced theoretical concepts",
        "Practical applications and implementation",
        "Historical background only",
        "Mathematical proofs exclusively"
      ],
      correct: 1,
      explanation: `This module focuses on practical applications and hands-on implementation of ${moduleTitle.toLowerCase()} concepts.`
    }
  ];
}

// POST /api/courses/generate - Generate a new course using AI
export async function POST(request) {
  try {
    // Use Clerk authentication
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      topic, 
      category = 'General',
      difficulty = 'Beginner',
      duration,
      chapterCount: rawChapterCount = 5,
      includeVideos = false,
      includeQuiz = false 
    } = await request.json();
    
    // Duration is only relevant when videos are included
    const finalDuration = includeVideos && duration ? duration : 'Not specified';

    // Parse chapterCount: '6-8' -> 6, '3-5' -> 3, or use number directly
    let chapterCount = 5;
    let requestedCount = 5;
    
    if (typeof rawChapterCount === 'string') {
      const match = rawChapterCount.match(/^\d+/);
      requestedCount = match ? parseInt(match[0]) : 5;
    } else {
      requestedCount = parseInt(rawChapterCount) || 5;
    }
    
    // Token limit configuration (prevents JSON truncation)
    const TOKEN_SAFE_LIMITS = {
      max_chapters: 8,
      words_per_chapter: {
        '1-5': 1000,   // Comprehensive content
        '6-8': 700,    // Concise but complete
        '9+': 500      // Very concise (safety limit)
      }
    };
    
    // Auto-limit to safe maximum
    chapterCount = Math.min(requestedCount, TOKEN_SAFE_LIMITS.max_chapters);
    
    // Log if we're auto-limiting
    if (chapterCount < requestedCount) {
      console.log(`⚠️ Auto-limited chapters: ${requestedCount} requested → ${chapterCount} (token limit)`);
    }

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log('Generating course with AI:', { 
      topic, 
      category, 
      difficulty, 
      duration: finalDuration,
      chapterCount, 
      includeVideos, 
      includeQuiz 
    });

    // Generate course using AI (use finalDuration for consistency)
    const generatedCourse = await generateCourseWithAI(
      topic, 
      category, 
      difficulty, 
      finalDuration, 
      chapterCount, 
      includeVideos, 
      includeQuiz
    );

    // Enhanced YouTube video search using keywords and search terms
    if (includeVideos && Array.isArray(generatedCourse.modules)) {
      console.log('🎥 YouTube video integration requested for', generatedCourse.modules.length, 'modules');
      const apiKey = process.env.YOUTUBE_API_KEY;
      const rateLimited = (arr, size = 3) => {
        // Smaller chunks to avoid rate limits
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
        return chunks;
      };

      if (apiKey) {
        console.log('✅ YouTube API key found, searching for videos...');
        const moduleChunks = rateLimited(generatedCourse.modules, 3);
        
        for (const chunk of moduleChunks) {
          // Enhanced parallel video search with multiple search strategies
          const results = await Promise.all(
            chunk.map(async (module) => {
              try {
                console.log(`🔍 Searching videos for module: ${module.title}`);
                // Use multiple search strategies for better results
                const searchQueries = [
                  module.videoSearchTerms || `${topic} ${module.title}`,
                  `${topic} tutorial ${module.keywords?.[0] || ''}`,
                  `learn ${topic} ${module.title.split(':')[1] || module.title}`
                ].filter(Boolean);

                console.log(`📝 Search queries for "${module.title}":`, searchQueries);
                let allVideoIds = [];
                
                // Try each search query to get diverse results
                for (const query of searchQueries.slice(0, 2)) { // Limit to 2 queries per module
                  try {
                    console.log(`🔎 Searching YouTube for: "${query}"`);
                    const videoId = await searchYouTubeCached(query.trim(), apiKey);
                    if (videoId) {
                      console.log(`✅ Found video ID: ${videoId} for query: "${query}"`);
                      allVideoIds.push(videoId);
                    } else {
                      console.log(`❌ No video found for query: "${query}"`);
                    }
                    // Small delay to respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                  } catch (error) {
                    console.warn(`❌ Failed to search for: ${query}`, error);
                  }
                }

                // Remove duplicates and limit to 3 videos per module
                const uniqueIds = [...new Set(allVideoIds)].slice(0, 3);
                const embedUrls = uniqueIds.map((id) => `https://www.youtube.com/embed/${id}`);
                
                return { module, embedUrls };
              } catch (error) {
                console.error(`Error searching videos for module: ${module.title}`, error);
                return { module, embedUrls: [] };
              }
            })
          );
          
          // Assign video URLs back to modules
          results.forEach(({ module, embedUrls }) => {
            if (embedUrls.length > 0) {
              // Convert embed URL back to watch URL for frontend compatibility
              const firstVideoId = embedUrls[0].split('/').pop();
              module.videoUrl = `https://www.youtube.com/watch?v=${firstVideoId}`;
              module.videoUrls = embedUrls; // Keep array for potential future use
              console.log(`✅ Found ${embedUrls.length} videos for module: ${module.title}, using: ${module.videoUrl}`);
            } else {
              console.log(`❌ No videos found for module: ${module.title}`);
            }
          });
          
          // Delay between chunks to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Log summary of video integration
        const modulesWithVideos = generatedCourse.modules.filter(m => m.videoUrl);
        console.log(`🎥 YouTube Integration Summary: ${modulesWithVideos.length}/${generatedCourse.modules.length} modules have videos`);
        modulesWithVideos.forEach(m => console.log(`   ✅ ${m.title}: ${m.videoUrl}`));
        
      } else {
        console.log('❌ YouTube API key not found, skipping video search');
        console.log('   Add YOUTUBE_API_KEY to your environment variables to enable video integration');
      }
    } else if (includeVideos) {
      console.log('❌ No modules found for video integration');
    }

    // Extract quiz data from Gemini-generated modules
    let quizzes = [];
    if (includeQuiz && generatedCourse.modules) {
      quizzes = generatedCourse.modules
        .filter(module => module.quiz && module.quiz.length > 0)
        .map(module => ({
          chapterId: module.id,
          chapterTitle: module.title,
          questions: module.quiz.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation
          }))
        }));
      console.log(`📝 Generated ${quizzes.length} quizzes from Gemini AI`);
    }

    // Convert to new JSONB structure for database storage
    const compatibleCourse = {
      course_title: generatedCourse.course_title || generatedCourse.title || `${topic} Course`,
      description: generatedCourse.overview || `Learn ${topic} with this comprehensive course.`,
      category: generatedCourse.category || category || 'General',
      difficulty: generatedCourse.difficulty || difficulty || 'Beginner',
      duration: generatedCourse.duration || finalDuration,
      topic,
      modules: generatedCourse.modules || [], // Store complete modules as JSONB
      include_quiz: includeQuiz,
      include_videos: includeVideos,
      id: 'generated-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Legacy format for backward compatibility (if needed)
      chapters: (generatedCourse.modules || generatedCourse.chapters || []).map((module, index) => ({
        id: module.id || `chapter-${index + 1}`,
        title: module.title,
        description: module.description,
        content: module.description,
        points: module.objectives || module.points || [],
        keywords: module.keywords || [],
        videoSearchTerms: module.videoSearchTerms || '',
        videoUrl: module.videoUrl || null,
        videoUrls: module.videoUrls || [],
        quiz: module.quiz || [],
        orderIndex: index + 1
      })),
      
      // Quiz data for separate tracking (if using normalized table)
      quizzes: includeQuiz ? quizzes : undefined
    };

    // Debug: Log what we're returning
    console.log('🚀 Returning course data:', {
      hasModules: !!compatibleCourse.modules,
      modulesCount: compatibleCourse.modules?.length || 0,
      hasChapters: !!compatibleCourse.chapters,
      chaptersCount: compatibleCourse.chapters?.length || 0,
      includeQuiz: compatibleCourse.include_quiz,
      modulesSample: compatibleCourse.modules?.[0] ? {
        title: compatibleCourse.modules[0].title,
        hasQuiz: !!compatibleCourse.modules[0].quiz,
        quizLength: compatibleCourse.modules[0].quiz?.length || 0,
        quizKeys: compatibleCourse.modules[0].quiz ? Object.keys(compatibleCourse.modules[0].quiz) : [],
        rawQuizData: compatibleCourse.modules[0].quiz
      } : null,
      chaptersSample: compatibleCourse.chapters?.[0] ? {
        title: compatibleCourse.chapters[0].title,
        hasQuiz: !!compatibleCourse.chapters[0].quiz,
        quizLength: compatibleCourse.chapters[0].quiz?.length || 0
      } : null
    });

    // Debug: Log raw generated course modules
    if (generatedCourse.modules && generatedCourse.modules[0]) {
      console.log('🔍 Raw Gemini module sample:', {
        title: generatedCourse.modules[0].title,
        hasQuiz: !!generatedCourse.modules[0].quiz,
        quizLength: generatedCourse.modules[0].quiz?.length || 0
      });
      
      // Show actual quiz question to verify prompt quality
      if (generatedCourse.modules[0].quiz && generatedCourse.modules[0].quiz[0]) {
        console.log('📝 Sample Quiz Question (to verify prompt quality):');
        console.log('   Q:', generatedCourse.modules[0].quiz[0].question);
        console.log('   Options:', generatedCourse.modules[0].quiz[0].options);
        console.log('   Correct:', generatedCourse.modules[0].quiz[0].correct_answer);
        console.log('   Explanation:', generatedCourse.modules[0].quiz[0].explanation);
      }
    }

    // Build response with optional warning
    const response = { 
      course: compatibleCourse  // Frontend expects 'course' key
    };
    
    // Add warning if chapters were auto-limited
    if (chapterCount < requestedCount) {
      response.warning = {
        type: 'auto_limited',
        message: `Chapters auto-limited from ${requestedCount} to ${chapterCount} to prevent content truncation`,
        requested: requestedCount,
        generated: chapterCount,
        reason: 'Token limit safety - ensures complete structured content for all modules'
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json({ 
      error: 'Failed to generate course: ' + error.message 
    }, { status: 500 });
  }
}


