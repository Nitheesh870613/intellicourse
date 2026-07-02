import { NextResponse } from 'next/server';

/**
 * Course Export API
 * 
 * Exports generated course content as PDF or DOCX files
 * Includes all text content, video links, and structured formatting
 * 
 * Note: This is a simplified implementation. For production, consider using:
 * - PDFKit or jsPDF for PDF generation
 * - docx library for DOCX generation
 * - Puppeteer for HTML-to-PDF conversion
 */

// Generate HTML content for the course
function generateCourseHTML(course) {
  const { title, overview, level, estimatedDuration, modules, metadata } = course;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Course Notes</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .course-title {
          font-size: 28px;
          font-weight: bold;
          color: #4F46E5;
          margin-bottom: 10px;
        }
        .course-meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 15px;
        }
        .overview {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #4F46E5;
        }
        .module {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .module-header {
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          color: white;
          padding: 15px 20px;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
        }
        .module-number {
          background: rgba(255,255,255,0.2);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: bold;
        }
        .module-content {
          border: 1px solid #E5E7EB;
          border-top: none;
          padding: 20px;
          border-radius: 0 0 8px 8px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        .section-icon {
          margin-right: 8px;
        }
        .key-points {
          background: #EFF6FF;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #3B82F6;
        }
        .key-points ul {
          margin: 0;
          padding-left: 20px;
        }
        .key-points li {
          margin-bottom: 5px;
        }
        .explanation {
          background: #F9FAFB;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #6B7280;
        }
        .example {
          background: #FFFBEB;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #F59E0B;
        }
        .videos {
          background: #F0F9FF;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0EA5E9;
        }
        .video-link {
          display: block;
          color: #0EA5E9;
          text-decoration: none;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .video-link:hover {
          text-decoration: underline;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
        }
        @media print {
          body { font-size: 12px; }
          .module { page-break-inside: avoid; }
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

      <div class="overview">
        <div class="section-title">
          <span class="section-icon">📋</span>
          Course Overview
        </div>
        <p>${overview}</p>
      </div>
  `;

  // Add modules
  modules?.forEach((module, index) => {
    html += `
      <div class="module">
        <div class="module-header">
          <div class="module-number">${index + 1}</div>
          <div>
            <div style="font-size: 18px; font-weight: bold;">${module.title}</div>
            ${module.description ? `<div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">${module.description}</div>` : ''}
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
              Example & Analogy
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
                ${video.title} (${video.channelTitle || 'YouTube'})
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  });

  html += `
      <div class="footer">
        <p>Generated by AI Course Generator | IntelliCourse Platform</p>
        <p>This document contains course notes and video links for educational purposes.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// Generate simple text content for DOCX (simplified implementation)
function generateCourseText(course) {
  const { title, overview, level, estimatedDuration, modules, metadata } = course;
  
  let content = `${title}\n`;
  content += `${'='.repeat(title.length)}\n\n`;
  content += `Level: ${level}\n`;
  content += `Duration: ${estimatedDuration || 'Self-paced'}\n`;
  content += `Generated: ${new Date(metadata?.generatedAt || Date.now()).toLocaleDateString()}\n\n`;
  
  content += `COURSE OVERVIEW\n`;
  content += `${'-'.repeat(15)}\n`;
  content += `${overview}\n\n`;

  modules?.forEach((module, index) => {
    content += `MODULE ${index + 1}: ${module.title.toUpperCase()}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    if (module.description) {
      content += `Description: ${module.description}\n\n`;
    }

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
      content += `EXAMPLE & ANALOGY:\n`;
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

    content += `\n`;
  });

  content += `\n${'='.repeat(50)}\n`;
  content += `Generated by AI Course Generator | IntelliCourse Platform\n`;
  content += `This document contains course notes and video links for educational purposes.\n`;

  return content;
}

export async function POST(request) {
  try {
    const { course, format = 'pdf', includeVideoLinks = true } = await request.json();

    if (!course) {
      return NextResponse.json({ error: 'Course data is required' }, { status: 400 });
    }

    if (!['pdf', 'docx', 'txt'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use pdf, docx, or txt' }, { status: 400 });
    }

    let content, mimeType, filename;

    switch (format) {
      case 'pdf':
        // For production, use a proper PDF library like PDFKit or Puppeteer
        // This is a simplified implementation that returns HTML
        content = generateCourseHTML(course);
        mimeType = 'text/html';
        filename = `${course.title || 'course'}-notes.html`;
        break;

      case 'docx':
        // For production, use the 'docx' npm package
        // This is a simplified implementation that returns plain text
        content = generateCourseText(course);
        mimeType = 'text/plain';
        filename = `${course.title || 'course'}-notes.txt`;
        break;

      case 'txt':
        content = generateCourseText(course);
        mimeType = 'text/plain';
        filename = `${course.title || 'course'}-notes.txt`;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Return the file content
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export course notes' },
      { status: 500 }
    );
  }
}
