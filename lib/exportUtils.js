// Export utilities for courses

// Export course as PDF using browser's print functionality
export const exportToPDF = (courseData) => {
  const printWindow = window.open('', '_blank');
  
  // Get modules from the correct location
  const modules = courseData.modules || courseData.structuredContent?.modules || [];
  const courseTitle = courseData.title || courseData.course_title || 'Course';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${courseTitle}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
        }
        h1 {
          color: #1e40af;
          border-bottom: 4px solid #3b82f6;
          padding-bottom: 15px;
          margin-bottom: 30px;
          font-size: 2.5em;
        }
        h2 {
          color: #7c3aed;
          margin-top: 40px;
          margin-bottom: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          font-size: 1.8em;
        }
        h3 {
          color: #059669;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 1.4em;
        }
        h4 {
          color: #dc2626;
          margin-top: 20px;
          margin-bottom: 12px;
          font-size: 1.2em;
        }
        .course-info {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin: 30px 0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .course-info p {
          margin: 10px 0;
          font-size: 1.1em;
        }
        .course-info strong {
          font-weight: 700;
          opacity: 0.9;
        }
        .module {
          margin: 30px 0;
          padding: 25px;
          border-left: 6px solid #7c3aed;
          background: linear-gradient(to right, #faf5ff 0%, #ffffff 100%);
          border-radius: 0 8px 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          page-break-inside: avoid;
        }
        .module-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .module-number {
          background: #7c3aed;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-center;
          font-weight: bold;
          margin-right: 15px;
          font-size: 1.2em;
        }
        .module-description {
          color: #6b7280;
          margin: 15px 0;
          font-style: italic;
          padding: 10px;
          background: #f9fafb;
          border-radius: 6px;
        }
        .points-list {
          margin: 20px 0;
          padding-left: 0;
          list-style: none;
        }
        .points-list li {
          padding: 12px 15px;
          margin: 8px 0;
          background: white;
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .points-list li:before {
          content: "✓ ";
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }
        .video-section {
          background: #fef3c7;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 2px solid #fbbf24;
        }
        .video-section h4 {
          color: #b45309;
          margin-top: 0;
        }
        .video-link {
          display: block;
          color: #2563eb;
          text-decoration: none;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          margin: 8px 0;
          word-break: break-all;
        }
        .quiz-section {
          background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
          padding: 25px;
          border-radius: 12px;
          margin: 25px 0;
          page-break-inside: avoid;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .quiz-section h4 {
          color: #065f46;
          margin-top: 0;
          font-size: 1.3em;
        }
        .question {
          background: white;
          padding: 20px;
          margin: 15px 0;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .question-text {
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 15px;
          font-size: 1.1em;
        }
        .options {
          margin: 12px 0;
          padding-left: 10px;
        }
        .option {
          padding: 10px 15px;
          margin: 8px 0;
          background: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #d1d5db;
        }
        .answer-box {
          background: #d1fae5;
          padding: 15px;
          border-radius: 6px;
          margin-top: 15px;
          border: 2px solid #10b981;
        }
        .answer-box strong {
          color: #065f46;
        }
        .explanation {
          color: #047857;
          font-style: italic;
          margin-top: 10px;
          padding: 10px;
          background: #ecfdf5;
          border-radius: 4px;
        }
        .page-break {
          page-break-after: always;
        }
        .toc {
          background: #f3f4f6;
          padding: 25px;
          border-radius: 10px;
          margin: 30px 0;
        }
        .toc-item {
          padding: 8px 0;
          border-bottom: 1px dashed #d1d5db;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
        }
        @media print {
          body { 
            margin: 0; 
            padding: 20px;
          }
          .no-print { display: none; }
          .module, .quiz-section, .question {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>${courseTitle}</h1>
      
      <div class="course-info">
        <p><strong>📝 Description:</strong> ${courseData.description || 'Master this topic with comprehensive, structured learning.'}</p>
        <p><strong>📊 Difficulty Level:</strong> ${courseData.difficulty || 'Beginner'}</p>
        <p><strong>⏱️ Estimated Duration:</strong> ${courseData.duration || 'Self-paced'}</p>
        <p><strong>📚 Total Modules:</strong> ${modules.length}</p>
        <p><strong>📅 Created:</strong> ${courseData.createdAt ? new Date(courseData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
        ${courseData.category ? `<p><strong>🏷️ Category:</strong> ${courseData.category}</p>` : ''}
      </div>

      ${modules.length > 0 ? `
        <div class="toc">
          <h2 style="margin-top: 0; border-top: none;">📑 Table of Contents</h2>
          ${modules.map((module, index) => `
            <div class="toc-item">
              <strong>Module ${index + 1}:</strong> ${module.title || `Module ${index + 1}`}
              ${module.quiz && module.quiz.length > 0 ? ' <span style="color: #10b981;">✓ Quiz Included</span>' : ''}
              ${module.videoUrls && module.videoUrls.length > 0 ? ' <span style="color: #f59e0b;">📹 Videos Included</span>' : ''}
            </div>
          `).join('')}
        </div>

        <div class="page-break"></div>

        <h2>📖 Course Content</h2>
        
        ${modules.map((module, index) => `
          <div class="module">
            <div class="module-header">
              <div class="module-number">${index + 1}</div>
              <h3 style="margin: 0;">${module.title || `Module ${index + 1}`}</h3>
            </div>
            
            ${module.description ? `
              <div class="module-description">
                ${module.description}
              </div>
            ` : ''}

            ${module.points && module.points.length > 0 ? `
              <h4>📌 Key Topics Covered:</h4>
              <ul class="points-list">
                ${module.points.map(point => `
                  <li>${point}</li>
                `).join('')}
              </ul>
            ` : ''}

            ${module.videoUrls && module.videoUrls.length > 0 ? `
              <div class="video-section">
                <h4>🎥 Video Resources (${module.videoUrls.length})</h4>
                <p>Watch these videos to reinforce your learning:</p>
                ${module.videoUrls.map((url, vIndex) => `
                  <a href="${url}" class="video-link" target="_blank">
                    📹 Video ${vIndex + 1}: ${url}
                  </a>
                `).join('')}
              </div>
            ` : ''}

            ${module.quiz && module.quiz.length > 0 ? `
              <div class="quiz-section">
                <h4>🎯 Module Quiz (${module.quiz.length} Questions)</h4>
                <p style="color: #065f46; margin-bottom: 20px;">Test your understanding of this module:</p>
                
                ${module.quiz.map((question, qIndex) => `
                  <div class="question">
                    <div class="question-text">
                      ${qIndex + 1}. ${question.question}
                    </div>
                    <div class="options">
                      ${question.options ? question.options.map((option, oIndex) => `
                        <div class="option">
                          <strong>${String.fromCharCode(65 + oIndex)}.</strong> ${option}
                        </div>
                      `).join('') : '<p>No options provided</p>'}
                    </div>
                    <div class="answer-box">
                      <strong>✓ Correct Answer:</strong> 
                      ${question.options && question.correctAnswer !== undefined 
                        ? `<strong style="color: #065f46;">${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}</strong>` 
                        : question.correctAnswer || 'N/A'}
                      ${question.explanation ? `
                        <div class="explanation">
                          💡 <strong>Explanation:</strong> ${question.explanation}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          ${index < modules.length - 1 ? '<div class="page-break"></div>' : ''}
        `).join('')}
      ` : '<p style="color: #6b7280; text-align: center; padding: 40px;">No modules available in this course.</p>'}

      <div class="footer">
        <p>Generated by <strong>MindCourse</strong> - AI-Powered Learning Platform</p>
        <p>Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div class="no-print" style="margin-top: 50px; text-align: center; padding: 30px; background: #f3f4f6; border-radius: 10px;">
        <button onclick="window.print()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          🖨️ Print / Save as PDF
        </button>
        <p style="color: #6b7280; margin-top: 15px; font-size: 14px;">
          Use your browser's print function and select "Save as PDF" as the destination
        </p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Auto-trigger print dialog
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Export course as Markdown
export const exportToMarkdown = (courseData) => {
  const modules = courseData.modules || courseData.structuredContent?.modules || [];
  const courseTitle = courseData.title || courseData.course_title || 'Course';
  
  let markdown = `# ${courseTitle}\n\n`;
  
  // Course Information
  markdown += `## 📝 Course Information\n\n`;
  markdown += `- **Description:** ${courseData.description || 'Master this topic with comprehensive, structured learning.'}\n`;
  markdown += `- **Difficulty Level:** ${courseData.difficulty || 'Beginner'}\n`;
  markdown += `- **Estimated Duration:** ${courseData.duration || 'Self-paced'}\n`;
  markdown += `- **Total Modules:** ${modules.length}\n`;
  markdown += `- **Created:** ${courseData.createdAt ? new Date(courseData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}\n`;
  if (courseData.category) markdown += `- **Category:** ${courseData.category}\n`;
  markdown += `\n---\n\n`;
  
  // Table of Contents
  if (modules.length > 0) {
    markdown += `## 📑 Table of Contents\n\n`;
    modules.forEach((module, index) => {
      markdown += `${index + 1}. [${module.title || `Module ${index + 1}`}](#module-${index + 1})`;
      if (module.quiz && module.quiz.length > 0) markdown += ` ✓ *Quiz Included*`;
      if (module.videoUrls && module.videoUrls.length > 0) markdown += ` 📹 *Videos Included*`;
      markdown += `\n`;
    });
    markdown += `\n---\n\n`;
    
    // Course Modules
    markdown += `## 📖 Course Content\n\n`;
    
    modules.forEach((module, index) => {
      markdown += `### Module ${index + 1}: ${module.title || `Module ${index + 1}`}\n\n`;
      
      if (module.description) {
        markdown += `> ${module.description}\n\n`;
      }
      
      if (module.points && module.points.length > 0) {
        markdown += `#### 📌 Key Topics Covered\n\n`;
        module.points.forEach(point => {
          markdown += `- ✓ ${point}\n`;
        });
        markdown += `\n`;
      }
      
      if (module.videoUrls && module.videoUrls.length > 0) {
        markdown += `#### 🎥 Video Resources\n\n`;
        markdown += `Watch these videos to reinforce your learning:\n\n`;
        module.videoUrls.forEach((url, vIndex) => {
          markdown += `${vIndex + 1}. [Video ${vIndex + 1}](${url})\n`;
        });
        markdown += `\n`;
      }
      
      if (module.quiz && module.quiz.length > 0) {
        markdown += `#### 🎯 Module Quiz (${module.quiz.length} Questions)\n\n`;
        module.quiz.forEach((question, qIndex) => {
          markdown += `**Question ${qIndex + 1}:** ${question.question}\n\n`;
          
          if (question.options) {
            question.options.forEach((option, oIndex) => {
              markdown += `   ${String.fromCharCode(65 + oIndex)}. ${option}\n`;
            });
            markdown += `\n`;
          }
          
          if (question.options && question.correctAnswer !== undefined) {
            markdown += `**✓ Correct Answer:** ${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}\n\n`;
          } else if (question.correctAnswer) {
            markdown += `**✓ Correct Answer:** ${question.correctAnswer}\n\n`;
          }
          
          if (question.explanation) {
            markdown += `💡 *Explanation:* ${question.explanation}\n\n`;
          }
          
          markdown += `---\n\n`;
        });
      }
      
      markdown += `\n`;
    });
  } else {
    markdown += `## Course Modules\n\nNo modules available in this course.\n\n`;
  }
  
  // Footer
  markdown += `---\n\n`;
  markdown += `*Generated by **MindCourse** - AI-Powered Learning Platform*\n\n`;
  markdown += `*Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}*\n`;
  
  // Download the markdown file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Export course as JSON
export const exportToJSON = (courseData) => {
  const courseTitle = courseData.title || courseData.course_title || 'Course';
  const modules = courseData.modules || courseData.structuredContent?.modules || [];
  
  const jsonData = {
    title: courseTitle,
    course_title: courseData.course_title || courseData.title,
    description: courseData.description || 'Master this topic with comprehensive, structured learning.',
    category: courseData.category,
    difficulty: courseData.difficulty || 'Beginner',
    duration: courseData.duration || 'Self-paced',
    topic: courseData.topic,
    chapterCount: courseData.chapterCount || modules.length,
    include_quiz: courseData.include_quiz || false,
    include_videos: courseData.include_videos || false,
    createdAt: courseData.createdAt,
    updatedAt: courseData.updatedAt,
    modules: modules.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      points: module.points || [],
      videoUrls: module.videoUrls || [],
      quiz: module.quiz || []
    })),
    structuredContent: courseData.structuredContent || null,
    chapters: courseData.chapters || [],
    quizzes: courseData.quizzes || [],
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'MindCourse',
      version: '2.0',
      format: 'MindCourse JSON',
      totalModules: modules.length,
      hasQuizzes: modules.some(m => m.quiz && m.quiz.length > 0),
      hasVideos: modules.some(m => m.videoUrls && m.videoUrls.length > 0)
    }
  };
  
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};







