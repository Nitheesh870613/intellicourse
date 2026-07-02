/**
 * LLM JSON Validation Utility
 * 
 * Robust cleaning and validation for LLM-generated JSON responses.
 * Handles common issues like markdown fences, extra text, and malformed JSON.
 */

// Course schema for validation
const courseSchema = {
    type: 'object',
    required: ['title', 'modules'],
    properties: {
        title: { type: 'string', minLength: 1 },
        course_title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'Beginner', 'Intermediate', 'Advanced'] },
        duration: { type: 'string' },
        modules: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['title'],
                properties: {
                    title: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    content: { type: 'string' },
                    objectives: { type: 'array', items: { type: 'string' } },
                    quiz: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                question: { type: 'string' },
                                options: { type: 'array', items: { type: 'string' } },
                                correct_answer: { type: 'string' },
                                explanation: { type: 'string' }
                            }
                        }
                    },
                    videos: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                youtubeUrl: { type: 'string' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 * Extract JSON from LLM response with multiple strategies
 * @param {string} raw - Raw LLM output
 * @returns {string} - Cleaned JSON string
 */
export function cleanLLMResponse(raw) {
    if (!raw || typeof raw !== 'string') {
        throw new Error('Invalid input: expected non-empty string');
    }

    let text = raw.trim();

    // Strategy 1: Extract from markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
        text = fenceMatch[1].trim();
    }

    // Strategy 2: Find balanced JSON object
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        // Try array format
        const arrayStart = text.indexOf('[');
        const arrayEnd = text.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd > arrayStart) {
            return text.substring(arrayStart, arrayEnd + 1);
        }
        throw new Error('No valid JSON structure found in response');
    }

    return text.substring(jsonStart, jsonEnd + 1);
}

/**
 * Extract all JSON blocks from text
 * @param {string} text - Input text
 * @returns {string[]} - Array of potential JSON strings
 */
export function extractJsonBlocks(text) {
    const blocks = [];

    // Find code-fenced JSON blocks
    const fenceMatches = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
    for (const match of fenceMatches) {
        if (match[1]?.trim()) {
            blocks.push(match[1].trim());
        }
    }

    // Find balanced brace blocks if no fenced blocks
    if (blocks.length === 0) {
        let depth = 0;
        let start = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (escapeNext) {
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (char === '{') {
                if (depth === 0) start = i;
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0 && start !== -1) {
                    blocks.push(text.substring(start, i + 1));
                    start = -1;
                }
            }
        }
    }

    return blocks;
}

/**
 * Safe JSON parse with progressive heuristics
 * @param {string} raw - Raw LLM output
 * @returns {object} - Parsed JSON object
 */
export function safeParseJSON(raw) {
    // Try direct parse first
    try {
        return JSON.parse(raw);
    } catch (e) {
        // Continue with cleaning
    }

    // Try cleaning and parse
    try {
        const cleaned = cleanLLMResponse(raw);
        return JSON.parse(cleaned);
    } catch (e) {
        // Continue with block extraction
    }

    // Try extracting blocks
    const blocks = extractJsonBlocks(raw);
    for (const block of blocks) {
        try {
            return JSON.parse(block);
        } catch (e) {
            continue;
        }
    }

    // Final attempt: aggressive cleaning
    try {
        let aggressive = raw
            .replace(/```[\s\S]*?```/g, '') // Remove code fences
            .replace(/^[^{[]*/, '') // Remove leading non-JSON
            .replace(/[^}\]]*$/, ''); // Remove trailing non-JSON

        const start = aggressive.indexOf('{');
        const end = aggressive.lastIndexOf('}');
        if (start !== -1 && end > start) {
            return JSON.parse(aggressive.substring(start, end + 1));
        }
    } catch (e) {
        // Fall through to error
    }

    throw new Error('Failed to parse JSON after all attempts');
}

/**
 * Simple schema validation (without AJV dependency)
 * @param {object} data - Parsed JSON data
 * @param {object} schema - Schema to validate against
 * @returns {object} - Validation result { valid: boolean, errors: string[] }
 */
export function validateSchema(data, schema = courseSchema) {
    const errors = [];

    function validate(value, schemaNode, path = '') {
        if (!schemaNode) return;

        // Type check
        if (schemaNode.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== schemaNode.type) {
                errors.push(`${path}: expected ${schemaNode.type}, got ${actualType}`);
                return;
            }
        }

        // Required properties for objects
        if (schemaNode.type === 'object' && schemaNode.required && value) {
            for (const req of schemaNode.required) {
                if (!(req in value)) {
                    errors.push(`${path}: missing required property '${req}'`);
                }
            }
        }

        // Validate object properties
        if (schemaNode.properties && typeof value === 'object' && value !== null) {
            for (const [key, propSchema] of Object.entries(schemaNode.properties)) {
                if (key in value) {
                    validate(value[key], propSchema, `${path}.${key}`);
                }
            }
        }

        // Validate array items
        if (schemaNode.type === 'array' && schemaNode.items && Array.isArray(value)) {
            if (schemaNode.minItems && value.length < schemaNode.minItems) {
                errors.push(`${path}: array must have at least ${schemaNode.minItems} items`);
            }
            value.forEach((item, i) => {
                validate(item, schemaNode.items, `${path}[${i}]`);
            });
        }

        // Enum validation
        if (schemaNode.enum && !schemaNode.enum.includes(value)) {
            // Soft validation for enums - just log warning
            console.log(`${path}: value '${value}' not in enum, but allowing`);
        }

        // MinLength
        if (schemaNode.minLength && typeof value === 'string' && value.length < schemaNode.minLength) {
            errors.push(`${path}: string must be at least ${schemaNode.minLength} characters`);
        }
    }

    validate(data, schema, 'root');

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Parse and validate course JSON from LLM
 * @param {string} raw - Raw LLM output
 * @param {object} options - Options { retryCallback, maxRetries }
 * @returns {Promise<object>} - { success, data, errors, rawOutput }
 */
export async function parseCourseJSON(raw, options = {}) {
    const { retryCallback, maxRetries = 2 } = options;
    let attempts = 0;
    let lastError = null;
    let lastRaw = raw;

    while (attempts <= maxRetries) {
        try {
            const parsed = safeParseJSON(lastRaw);
            const validation = validateSchema(parsed);

            if (validation.valid) {
                return {
                    success: true,
                    data: parsed,
                    errors: [],
                    rawOutput: lastRaw,
                    attempts: attempts + 1
                };
            }

            // Validation failed
            lastError = new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
            lastError.details = validation.errors;

            // If we have a retry callback and haven't exhausted retries
            if (retryCallback && attempts < maxRetries) {
                console.log(`Validation failed, attempting retry ${attempts + 1}/${maxRetries}`);
                lastRaw = await retryCallback(lastRaw, validation.errors);
                attempts++;
                continue;
            }

            // Return partial success with errors
            return {
                success: false,
                data: parsed, // Still return parsed data for debugging
                errors: validation.errors,
                rawOutput: lastRaw,
                attempts: attempts + 1
            };

        } catch (parseError) {
            lastError = parseError;

            if (retryCallback && attempts < maxRetries) {
                console.log(`Parse failed, attempting retry ${attempts + 1}/${maxRetries}: ${parseError.message}`);
                try {
                    lastRaw = await retryCallback(lastRaw, [parseError.message]);
                    attempts++;
                    continue;
                } catch (retryError) {
                    // Retry callback failed, break out
                    lastError = retryError;
                    break;
                }
            }

            break;
        }
    }

    return {
        success: false,
        data: null,
        errors: [lastError?.message || 'Unknown error'],
        rawOutput: lastRaw,
        attempts: attempts + 1
    };
}

// Export schema for external use
export { courseSchema };
