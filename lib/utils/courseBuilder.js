/**
 * Course Builder Utilities for MindCourse
 * Enhanced course generation and video embedding functions
 */

/**
 * Creates proper YouTube embed HTML code
 * @param {string} videoId - YouTube video ID
 * @param {string} title - Video title
 * @returns {string} - Complete iframe HTML code
 */
export function createYouTubeEmbedHTML(videoId, title = "YouTube video player") {
  return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

/**
 * Extracts video ID from YouTube URL and creates embed HTML
 * @param {string} url - YouTube URL
 * @param {string} title - Video title
 * @returns {string|null} - Embed HTML or null if invalid
 */
export function urlToEmbedHTML(url, title = "YouTube video player") {
  if (!url) return null;
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return createYouTubeEmbedHTML(match[1], title);
    }
  }
  
  return null;
}

/**
 * Converts course data to structured JSON format as specified
 * @param {Object} courseData - Course data from AI generation
 * @returns {Object} - Structured course JSON
 */
export function formatCourseToStructuredJSON(courseData) {
  const modules = (courseData.modules || courseData.chapters || []).map(module => ({
    title: module.title,
    description: module.description,
    objectives: module.objectives || module.points || [],
    videos: (module.videoUrls || []).map((url, index) => ({
      title: `${module.title} - Video ${index + 1}`,
      embed_code: urlToEmbedHTML(url, `${module.title} - Video ${index + 1}`)
    })).filter(video => video.embed_code) // Only include valid embeds
  }));

  return {
    course_title: courseData.course_title || courseData.title,
    overview: courseData.overview || courseData.description,
    modules: modules
  };
}

/**
 * Generates enhanced course structure with video search terms
 * @param {string} topic - Course topic
 * @param {string} category - Course category
 * @param {string} difficulty - Course difficulty
 * @param {number} moduleCount - Number of modules
 * @returns {Object} - Enhanced course structure
 */
export function generateEnhancedCourseStructure(topic, category = 'General', difficulty = 'Beginner', moduleCount = 5) {
  const modules = Array.from({ length: moduleCount }, (_, i) => {
    const moduleNumber = i + 1;
    const isIntro = moduleNumber === 1;
    const isAdvanced = moduleNumber > moduleCount * 0.7;
    
    let moduleTitle, moduleDescription, objectives, keywords;
    
    if (isIntro) {
      moduleTitle = `Introduction to ${topic}`;
      moduleDescription = `This foundational module introduces you to the world of ${topic}. You'll learn what ${topic} is, why it's important, and how it fits into the broader landscape of ${category}. We'll cover the basic terminology, key concepts, and provide you with a roadmap for your learning journey.\n\nBy the end of this module, you'll have a clear understanding of what to expect from the course and the fundamental principles that underpin ${topic}. This knowledge will serve as the foundation for all subsequent modules.`;
      objectives = [
        `Define ${topic} and explain its significance in ${category}`,
        `Identify key terminology and concepts in ${topic}`,
        `Understand the scope and applications of ${topic}`,
        `Recognize the learning path and course structure`
      ];
      keywords = [topic.toLowerCase(), "introduction", "basics", "fundamentals"];
    } else if (isAdvanced) {
      moduleTitle = `Advanced ${topic} Techniques`;
      moduleDescription = `This advanced module delves into sophisticated ${topic} techniques and best practices. You'll explore complex scenarios, learn optimization strategies, and understand how to apply ${topic} in real-world professional environments.\n\nWe'll cover advanced methodologies, troubleshooting techniques, and industry standards. This module is designed to elevate your skills from intermediate to advanced level, preparing you for complex challenges in ${topic}.`;
      objectives = [
        `Apply advanced ${topic} techniques to complex problems`,
        `Optimize ${topic} implementations for better performance`,
        `Troubleshoot and debug advanced ${topic} issues`,
        `Implement industry best practices and standards`
      ];
      keywords = [topic.toLowerCase(), "advanced", "optimization", "best practices"];
    } else {
      moduleTitle = `${topic} Core Concepts - Part ${moduleNumber - 1}`;
      moduleDescription = `This module focuses on essential ${topic} concepts that every practitioner should master. You'll learn practical skills, work through hands-on examples, and build confidence in applying ${topic} principles to real scenarios.\n\nWe'll balance theoretical understanding with practical application, ensuring you can both understand the 'why' behind ${topic} concepts and implement them effectively. Each lesson builds upon previous knowledge while introducing new, more sophisticated ideas.`;
      objectives = [
        `Master core ${topic} concepts and principles`,
        `Apply ${topic} techniques to practical scenarios`,
        `Analyze and solve ${topic}-related problems`,
        `Build confidence in ${topic} implementation`
      ];
      keywords = [topic.toLowerCase(), "concepts", "practical", "implementation"];
    }
    
    return {
      id: `module-${moduleNumber}`,
      title: moduleTitle,
      description: moduleDescription,
      objectives: objectives,
      keywords: keywords,
      videoSearchTerms: `${topic} ${keywords.join(' ')} tutorial ${difficulty.toLowerCase()}`
    };
  });

  return {
    course_title: `Complete ${topic} Course - ${difficulty} Level`,
    overview: `Master ${topic} with this comprehensive ${difficulty.toLowerCase()}-level course. Learn through structured modules, practical examples, and expert guidance.`,
    category: category,
    difficulty: difficulty,
    modules: modules
  };
}

/**
 * Validates and enhances course data structure
 * @param {Object} courseData - Raw course data
 * @returns {Object} - Validated and enhanced course data
 */
export function validateAndEnhanceCourse(courseData) {
  // Ensure required fields exist
  const enhanced = {
    course_title: courseData.course_title || courseData.title || 'Untitled Course',
    overview: courseData.overview || courseData.description || 'Course description not available.',
    category: courseData.category || 'General',
    difficulty: courseData.difficulty || 'Beginner',
    duration: courseData.duration || '3-5 hours',
    modules: []
  };

  // Process modules/chapters
  const modules = courseData.modules || courseData.chapters || [];
  enhanced.modules = modules.map((module, index) => ({
    id: module.id || `module-${index + 1}`,
    title: module.title || `Module ${index + 1}`,
    description: module.description || module.content || 'Module description not available.',
    objectives: Array.isArray(module.objectives) ? module.objectives : 
                Array.isArray(module.points) ? module.points : [],
    keywords: Array.isArray(module.keywords) ? module.keywords : [],
    videoSearchTerms: module.videoSearchTerms || `${enhanced.course_title} ${module.title}`,
    videoUrls: Array.isArray(module.videoUrls) ? module.videoUrls : [],
    quiz: Array.isArray(module.quiz) ? module.quiz : [] // Preserve quiz data!
  }));

  return enhanced;
}