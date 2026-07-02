import { z } from 'zod';

export const courseGenerationSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters").max(100, "Topic must be less than 100 characters"),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
    modules: z.number().int().min(1, "Minimum 1 module").max(20, "Maximum 20 modules").default(5),
    includeQuiz: z.boolean().default(false),
    includeVideos: z.boolean().default(false),
});

export const extractedTextSchema = z.object({
    text: z.string().min(50, "Extracted text is too short"),
    fileType: z.string().optional(),
});

export const courseOutputSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional().default(""), // Allow empty description initially as it might be generated later
    category: z.string().optional(),
    difficulty: z.string().optional(),
    modules: z.array(z.object({
        title: z.string(),
        description: z.string(),
        content: z.array(z.object({
            section: z.string(),
            text: z.string()
        })),
        videos: z.array(z.object({
            title: z.string(),
            url: z.string(),
        })).optional().default([]),
        quiz: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            answer: z.string(),
        })).optional().default([])
    })).min(1)
});
