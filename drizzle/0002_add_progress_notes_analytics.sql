-- Add Module Progress Table
CREATE TABLE IF NOT EXISTS "module_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "module_id" text NOT NULL,
  "module_index" integer NOT NULL,
  "is_completed" boolean DEFAULT false,
  "completed_at" timestamp,
  "quiz_score" integer,
  "quiz_attempts" integer DEFAULT 0,
  "best_quiz_score" integer DEFAULT 0,
  "time_spent" integer DEFAULT 0,
  "last_accessed_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add User Notes Table
CREATE TABLE IF NOT EXISTS "user_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "module_id" text NOT NULL,
  "module_index" integer NOT NULL,
  "content" text NOT NULL,
  "title" text,
  "is_pinned" boolean DEFAULT false,
  "tags" jsonb DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add Course Analytics Table
CREATE TABLE IF NOT EXISTS "course_analytics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "total_time_spent" integer DEFAULT 0,
  "modules_completed" integer DEFAULT 0,
  "total_modules" integer NOT NULL,
  "progress_percentage" integer DEFAULT 0,
  "average_quiz_score" integer DEFAULT 0,
  "total_quiz_attempts" integer DEFAULT 0,
  "last_accessed_module_id" text,
  "last_accessed_module_index" integer,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "last_accessed_at" timestamp DEFAULT now(),
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add Quiz Attempts Table
CREATE TABLE IF NOT EXISTS "quiz_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "module_id" text NOT NULL,
  "module_index" integer NOT NULL,
  "score" integer NOT NULL,
  "total_questions" integer NOT NULL,
  "correct_answers" integer NOT NULL,
  "wrong_answers" integer NOT NULL,
  "skipped_answers" integer DEFAULT 0,
  "time_spent" integer,
  "answers" jsonb NOT NULL,
  "is_passed" boolean DEFAULT false,
  "attempt_number" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_module_progress_user_course" ON "module_progress" ("user_id", "course_id");
CREATE INDEX IF NOT EXISTS "idx_module_progress_module" ON "module_progress" ("course_id", "module_id");
CREATE INDEX IF NOT EXISTS "idx_user_notes_user_course" ON "user_notes" ("user_id", "course_id");
CREATE INDEX IF NOT EXISTS "idx_user_notes_module" ON "user_notes" ("course_id", "module_id");
CREATE INDEX IF NOT EXISTS "idx_course_analytics_user" ON "course_analytics" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_course_analytics_course" ON "course_analytics" ("course_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_user_course" ON "quiz_attempts" ("user_id", "course_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_module" ON "quiz_attempts" ("course_id", "module_id");
