import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { auth } from "@clerk/nextjs/server";

import { extractTextFromPdf } from "@/lib/extract/pdf";
import { extractTextFromOffice } from "@/lib/extract/office";
import { extractTextFromImage } from "@/lib/extract/image";
import { extractTextFromWebPage } from "@/lib/extract/url";
import { extractTextFromYouTube } from "@/lib/extract/youtube";
import { normalizeExtractedText } from "@/lib/extract/normalize";
import { generateCourseFromSourceText } from "@/lib/groq";
import { validateAndEnhanceCourse } from "@/lib/utils/courseBuilder";

export const runtime = "nodejs";

async function saveUploadedFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function extractFromMultipart(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sourceType = (formData.get("sourceType") || "auto").toString();
  const websiteUrl = formData.get("url")?.toString() || null;
  const youtubeUrl = formData.get("youtubeUrl")?.toString() || null;

  const textChunks = [];

  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const filePath = await saveUploadedFile(file);
    const lowerName = file.name.toLowerCase();

    if (sourceType === "pdf" || lowerName.endsWith(".pdf")) {
      textChunks.push(await extractTextFromPdf(filePath));
    } else if (
      sourceType === "ppt" ||
      sourceType === "pptx" ||
      lowerName.endsWith(".ppt") ||
      lowerName.endsWith(".pptx") ||
      sourceType === "docx" ||
      lowerName.endsWith(".docx")
    ) {
      textChunks.push(await extractTextFromOffice(filePath));
    } else {
      // Fallback: treat as image for common formats
      textChunks.push(await extractTextFromImage(filePath));
    }
  }

  if (websiteUrl) {
    textChunks.push(await extractTextFromWebPage(websiteUrl));
  }

  if (youtubeUrl) {
    textChunks.push(await extractTextFromYouTube(youtubeUrl));
  }

  if (textChunks.length === 0) {
    throw new Error("No valid file or URL provided for ingestion");
  }

  return textChunks.join("\n\n");
}

async function extractFromJson(request) {
  const body = await request.json();
  const url = (body?.url || "").toString().trim();

  if (!url) {
    throw new Error("Missing url in request body");
  }

  if (/youtube\.com|youtu\.be/.test(url)) {
    return extractTextFromYouTube(url);
  }

  return extractTextFromWebPage(url);
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let rawText;
    if (contentType.includes("multipart/form-data")) {
      rawText = await extractFromMultipart(request);
    } else {
      rawText = await extractFromJson(request);
    }

    const normalized = normalizeExtractedText(rawText);

    if (!normalized || normalized.length < 500) {
      return NextResponse.json(
        {
          error: "Not enough textual content to build a course",
          length: normalized ? normalized.length : 0,
        },
        { status: 400 }
      );
    }

    const rawCourse = await generateCourseFromSourceText(normalized, {
      includeQuiz: true,
    });

    const course = validateAndEnhanceCourse(rawCourse);

    // NOTE: This endpoint intentionally does NOT persist the course.
    // The frontend is expected to call the existing /api/courses POST
    // endpoint with this data when the user confirms and clicks "Save".

    return NextResponse.json({
      success: true,
      sourceCharCount: normalized.length,
      course,
    });
  } catch (error) {
    console.error("Error in ingest API:", error);
    return NextResponse.json(
      { error: "Failed to ingest content", details: error.message },
      { status: 500 }
    );
  }
}
