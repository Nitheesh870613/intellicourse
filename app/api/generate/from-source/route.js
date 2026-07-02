import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import { Readable } from 'stream';

// Helper to convert Web ReadableStream to Node stream
async function webStreamToBuffer(readableStream) {
  const reader = readableStream.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

// Extract YouTube transcript
async function extractYouTubeTranscript(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcriptData.map(item => item.text).join(' ');
    
    return {
      success: true,
      text: fullText,
      metadata: {
        videoId,
        duration: transcriptData.length,
        source: 'youtube'
      }
    };
  } catch (error) {
    console.error('YouTube transcript error:', error);
    throw new Error(`Failed to extract YouTube transcript: ${error.message}`);
  }
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Extract article text from URL
async function extractArticleText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
    
    // Try to find main content area
    let text = '';
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        text = element.text();
        break;
      }
    }
    
    // Fallback to body if no content area found
    if (!text) {
      text = $('body').text();
    }
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    if (!text || text.length < 100) {
      throw new Error('Could not extract sufficient text from URL');
    }
    
    return {
      success: true,
      text,
      metadata: {
        url,
        title: $('title').text() || 'Unknown',
        length: text.length,
        source: 'article'
      }
    };
  } catch (error) {
    console.error('Article extraction error:', error);
    throw new Error(`Failed to extract article text: ${error.message}`);
  }
}

// Extract text from PDF
async function extractPDFText(fileBuffer) {
  try {
    const data = await pdfParse(fileBuffer);
    
    return {
      success: true,
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        length: data.text.length,
        source: 'pdf'
      }
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let sourceType = null;
    let sourceData = null;
    let extractedText = null;
    
    // Handle JSON body (YouTube or Article URL)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      
      if (body.youtubeUrl) {
        sourceType = 'youtube';
        sourceData = body.youtubeUrl;
        extractedText = await extractYouTubeTranscript(body.youtubeUrl);
      } else if (body.articleUrl) {
        sourceType = 'article';
        sourceData = body.articleUrl;
        extractedText = await extractArticleText(body.articleUrl);
      } else {
        return NextResponse.json(
          { error: 'Invalid request. Provide youtubeUrl or articleUrl' },
          { status: 400 }
        );
      }
    }
    // Handle multipart/form-data (PDF file)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      // Check if it's a PDF
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are supported' },
          { status: 400 }
        );
      }
      
      sourceType = 'pdf';
      sourceData = file.name;
      
      // Convert file to buffer
      const buffer = await webStreamToBuffer(file.stream());
      extractedText = await extractPDFText(buffer);
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Use application/json or multipart/form-data' },
        { status: 400 }
      );
    }
    
    // Validate extracted text
    if (!extractedText || !extractedText.text || extractedText.text.length < 100) {
      return NextResponse.json(
        { error: 'Insufficient text extracted from source' },
        { status: 400 }
      );
    }
    
    // Return extracted text (ready to be sent to GORQ)
    return NextResponse.json({
      success: true,
      sourceType,
      sourceData,
      extractedText: extractedText.text,
      metadata: extractedText.metadata,
      message: 'Text extracted successfully. Ready for course generation.'
    });
    
  } catch (error) {
    console.error('Source ingestion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process source',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
