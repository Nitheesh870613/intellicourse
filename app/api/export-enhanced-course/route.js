import { NextResponse } from 'next/server';

/**
 * Enhanced Course Export API
 * 
 * Exports complete course content including:
 * - All module content (key points, explanations, examples)
 * - Quiz questions and answers
 * - Quiz results and scores
 * - Video links and resources
 * - Progress tracking information
 */

// Generate comprehensive HTML for enhanced course export
function generateEnhancedCourseHTML(course, quizResults = {}) {
  const { title, overview, level, estimatedDuration, modules, metadata } = course;
  
  // Calculate overall quiz performance
  const totalQuestions = modules.reduce((total, module) => 
    total + (module.quiz ? module.quiz.length : 0), 0);
  const totalCorrect = Object.values(quizResults).reduce((total, result) => 
    total + (result.correctAnswers || 0), 0);
  const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Complete Course Notes</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 25px;
          margin-bottom: 35px;
        }
        .course-title {
          font-size: 32px;
          font-weight: bold;
          color: #4F46E5;
          margin-bottom: 10px;
        }
        .course-meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 15px;
        }
        .score-summary {
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }
        .score-summary h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .score-number {
          font-size: 36px;
          font-weight: bold;
          margin: 10px 0;
        }
        .overview {
          background: #F8FAFC;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 35px;
          border-left: 5px solid #4F46E5;
        }
        .overview h3 {
          margin-top: 0;
          color: #4F46E5;
          display: flex;
          align-items: center;
        }
        .module {
          margin-bottom: 50px;
          page-break-inside: avoid;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
        }
        .module-header {
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          color: white;
          padding: 20px 25px;
          display: flex;
          align-items: center;
        }
        .module-number {
          background: rgba(255,255,255,0.2);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          font-weight: bold;
          font-size: 18px;
        }
        .module-content {
          padding: 25px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: bold;
          color: #374151;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          font-size: 16px;
        }
        .section-icon {
          margin-right: 10px;
          font-size: 18px;
        }
        .key-points {
          background: #EFF6FF;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3B82F6;
        }
        .key-points ul {
          margin: 0;
          padding-left: 20px;
        }
        .key-points li {
          margin-bottom: 8px;
          font-weight: 500;
        }
        .explanation {
          background: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #6B7280;
        }
        .example {
          background: #FFFBEB;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #F59E0B;
        }
        .videos {
          background: #F0F9FF;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #0EA5E9;
        }
        .video-link {
          display: block;
          color: #0EA5E9;
          text-decoration: none;
          margin-bottom: 8px;
          font-weight: 500;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #E0F2FE;
        }
        .video-link:hover {
          background: #E0F2FE;
        }
        .quiz-section {
          background: #F3E8FF;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #8B5CF6;
          margin-top: 20px;
        }
        .quiz-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 15px;
        }
        .quiz-score {
          background: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          color: #8B5CF6;
          border: 2px solid #8B5CF6;
        }
        .question {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          border: 1px solid #E5E7EB;
        }
        .question-text {
          font-weight: 600;
          margin-bottom: 10px;
          color: #374151;
        }
        .options {
          margin-left: 15px;
        }
        .option {
          margin: 5px 0;
          padding: 5px 0;
        }
        .correct-answer {
          color: #059669;
          font-weight: bold;
        }
        .wrong-answer {
          color: #DC2626;
          text-decoration: line-through;
        }
        .explanation-text {
          background: #F0FDF4;
          padding: 10px;
          border-radius: 6px;
          margin-top: 8px;
          font-style: italic;
          color: #166534;
          border-left: 3px solid #22C55E;
        }
        .footer {
          margin-top: 60px;
          padding-top: 25px;
          border-top: 2px solid #E5E7EB;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
        }
        @media print {
          body { font-size: 11px; }
          .module { page-break-inside: avoid; }
          .score-summary { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="course-title">${title}</div>
        <div class="course-meta">
          Level: ${level} | Duration: ${estimatedDuration || 'Self-paced'} | 
          Generated: ${new Date(metadata?.generatedAt || Date.now()).toLocaleDateString()}
        </div>
      </div>
  `;

  // Add quiz score summary if there are results
  if (Object.keys(quizResults).length > 0) {
    html += `
      <div class="score-summary">
        <h3>📊 Quiz Performance Summary</h3>
        <div class="score-number">${overallScore}%</div>
        <p>Overall Score: ${totalCorrect}/${totalQuestions} questions correct</p>
        <p>Modules Completed: ${Object.keys(quizResults).length}/${modules.length}</p>
      </div>
    `;
  }

  // Course overview
  html += `
    <div class="overview">
      <h3><span class="section-icon">📋</span>Course Overview</h3>
      <p>${overview}</p>
    </div>
  `;

  // Add modules
  modules?.forEach((module, index) => {
    const moduleResult = quizResults[module.id];
    
    html += `
      <div class="module">
        <div class="module-header">
          <div class="module-number">${index + 1}</div>
          <div>
            <div style="font-size: 20px; font-weight: bold;">${module.title}</div>
            ${moduleResult ? `<div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Quiz Score: ${moduleResult.correctAnswers}/${moduleResult.total}</div>` : ''}
          </div>
        </div>
        <div class="module-content">
    `;

    // Key Points
    if (module.keyPoints && module.keyPoints.length > 0) {
      html += `
        <div class="section">
          <div class="key-points">
            <div class="section-title">
              <span class="section-icon">✅</span>
              Key Learning Points
            </div>
            <ul>
              ${module.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    // Detailed Explanation
    if (module.explanation) {
      html += `
        <div class="section">
          <div class="explanation">
            <div class="section-title">
              <span class="section-icon">📖</span>
              Detailed Explanation
            </div>
            <p>${module.explanation}</p>
          </div>
        </div>
      `;
    }

    // Example
    if (module.example) {
      html += `
        <div class="section">
          <div class="example">
            <div class="section-title">
              <span class="section-icon">💡</span>
              Practical Example
            </div>
            <p>${module.example}</p>
          </div>
        </div>
      `;
    }

    // Videos
    if (module.videos && module.videos.length > 0) {
      html += `
        <div class="section">
          <div class="videos">
            <div class="section-title">
              <span class="section-icon">🎥</span>
              Related Videos
            </div>
            ${module.videos.map(video => `
              <a href="${video.url}" class="video-link" target="_blank">
                📺 ${video.title} (${video.channelTitle || 'YouTube'})
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Quiz Section
    if (module.quiz && module.quiz.length > 0) {
      html += `
        <div class="quiz-section">
          <div class="quiz-header">
            <div class="section-title">
              <span class="section-icon">🧠</span>
              Quiz Questions & Answers
            </div>
            ${moduleResult ? `<div class="quiz-score">Score: ${moduleResult.correctAnswers}/${moduleResult.total}</div>` : ''}
          </div>
      `;

      module.quiz.forEach((question, qIndex) => {
        const questionResult = moduleResult?.results[`${module.id}_${qIndex}`];
        
        html += `
          <div class="question">
            <div class="question-text">${qIndex + 1}. ${question.question}</div>
            <div class="options">
        `;

        question.options.forEach((option, optIndex) => {
          const isCorrect = option === question.answer;
          const wasSelected = questionResult?.userAnswer === option;
          
          let optionClass = '';
          let prefix = String.fromCharCode(65 + optIndex) + '. '; // A, B, C, D
          
          if (questionResult) {
            if (isCorrect) {
              optionClass = 'correct-answer';
              prefix += '✓ ';
            } else if (wasSelected && !isCorrect) {
              optionClass = 'wrong-answer';
              prefix += '✗ ';
            }
          } else if (isCorrect) {
            optionClass = 'correct-answer';
            prefix += '✓ ';
          }

          html += `<div class="option ${optionClass}">${prefix}${option}</div>`;
        });

        html += `
            </div>
            <div class="explanation-text">
              <strong>Explanation:</strong> ${question.explanation}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `
        </div>
      </div>
    `;
  });

  html += `
      <div class="footer">
        <p><strong>Generated by Enhanced AI Course Generator | IntelliCourse Platform</strong></p>
        <p>This document contains complete course materials including content, quizzes, and performance results.</p>
        <p>Total Questions: ${totalQuestions} | Questions Attempted: ${totalCorrect} | Overall Score: ${overallScore}%</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// Generate text content for alternative formats
function generateEnhancedCourseText(course, quizResults = {}) {
  const { title, overview, level, estimatedDuration, modules, metadata } = course;
  
  let content = `${title}\n`;
  content += `${'='.repeat(title.length)}\n\n`;
  content += `Level: ${level}\n`;
  content += `Duration: ${estimatedDuration || 'Self-paced'}\n`;
  content += `Generated: ${new Date(metadata?.generatedAt || Date.now()).toLocaleDateString()}\n\n`;

  // Quiz summary
  if (Object.keys(quizResults).length > 0) {
    const totalQuestions = modules.reduce((total, module) => 
      total + (module.quiz ? module.quiz.length : 0), 0);
    const totalCorrect = Object.values(quizResults).reduce((total, result) => 
      total + (result.correctAnswers || 0), 0);
    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    content += `QUIZ PERFORMANCE SUMMARY\n`;
    content += `${'-'.repeat(25)}\n`;
    content += `Overall Score: ${overallScore}% (${totalCorrect}/${totalQuestions})\n`;
    content += `Modules Completed: ${Object.keys(quizResults).length}/${modules.length}\n\n`;
  }
  
  content += `COURSE OVERVIEW\n`;
  content += `${'-'.repeat(15)}\n`;
  content += `${overview}\n\n`;

  modules?.forEach((module, index) => {
    const moduleResult = quizResults[module.id];
    
    content += `MODULE ${index + 1}: ${module.title.toUpperCase()}\n`;
    content += `${'='.repeat(60)}\n`;
    
    if (moduleResult) {
      content += `Quiz Score: ${moduleResult.correctAnswers}/${moduleResult.total}\n`;
    }
    content += `\n`;

    if (module.keyPoints && module.keyPoints.length > 0) {
      content += `KEY LEARNING POINTS:\n`;
      module.keyPoints.forEach(point => {
        content += `• ${point}\n`;
      });
      content += `\n`;
    }

    if (module.explanation) {
      content += `DETAILED EXPLANATION:\n`;
      content += `${module.explanation}\n\n`;
    }

    if (module.example) {
      content += `PRACTICAL EXAMPLE:\n`;
      content += `${module.example}\n\n`;
    }

    if (module.videos && module.videos.length > 0) {
      content += `RELATED VIDEOS:\n`;
      module.videos.forEach(video => {
        content += `• ${video.title}\n`;
        content += `  Link: ${video.url}\n`;
        content += `  Channel: ${video.channelTitle || 'YouTube'}\n\n`;
      });
    }

    // Quiz content
    if (module.quiz && module.quiz.length > 0) {
      content += `QUIZ QUESTIONS & ANSWERS:\n`;
      content += `${'-'.repeat(25)}\n`;
      
      module.quiz.forEach((question, qIndex) => {
        const questionResult = moduleResult?.results[`${module.id}_${qIndex}`];
        
        content += `${qIndex + 1}. ${question.question}\n`;
        
        question.options.forEach((option, optIndex) => {
          const isCorrect = option === question.answer;
          const wasSelected = questionResult?.userAnswer === option;
          const letter = String.fromCharCode(65 + optIndex);
          
          let marker = '';
          if (questionResult) {
            if (isCorrect) marker = ' ✓ (Correct)';
            else if (wasSelected) marker = ' ✗ (Your answer)';
          } else if (isCorrect) {
            marker = ' ✓ (Correct Answer)';
          }
          
          content += `   ${letter}. ${option}${marker}\n`;
        });
        
        content += `   Explanation: ${question.explanation}\n\n`;
      });
    }

    content += `\n`;
  });

  content += `\n${'='.repeat(60)}\n`;
  content += `Generated by Enhanced AI Course Generator | IntelliCourse Platform\n`;
  content += `Complete course materials with quizzes and performance tracking.\n`;

  return content;
}

export async function POST(request) {
  try {
    const { course, quizResults = {}, format = 'pdf' } = await request.json();

    if (!course) {
      return NextResponse.json({ error: 'Course data is required' }, { status: 400 });
    }

    if (!['pdf', 'html', 'txt'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use pdf, html, or txt' }, { status: 400 });
    }

    let content, mimeType, filename;

    switch (format) {
      case 'pdf':
      case 'html':
        content = generateEnhancedCourseHTML(course, quizResults);
        mimeType = 'text/html';
        filename = `${course.title || 'course'}-complete.html`;
        break;

      case 'txt':
        content = generateEnhancedCourseText(course, quizResults);
        mimeType = 'text/plain';
        filename = `${course.title || 'course'}-complete.txt`;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Enhanced export error:', error);
    return NextResponse.json(
      { error: 'Failed to export enhanced course notes' },
      { status: 500 }
    );
  }
}
