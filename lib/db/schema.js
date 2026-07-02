// import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

// export const users = pgTable('users', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   clerkId: text('clerk_id').notNull().unique(),
//   email: text('email').notNull(),
//   firstName: text('first_name'),
//   lastName: text('last_name'),
//   createdAt: timestamp('created_at').defaultNow(),
//   updatedAt: timestamp('updated_at').defaultNow(),
// });

// export const courses = pgTable('courses', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
//   title: text('title').notNull(),
//   description: text('description'),
//   category: text('category').notNull(),
//   difficulty: text('difficulty').notNull(),
//   duration: text('duration').notNull(),
//   chapterCount: integer('chapter_count').notNull(),
//   includeVideos: boolean('include_videos').default(false),
//   thumbnail: text('thumbnail'),
//   topic: text('topic').notNull(),
//   userDescription: text('user_description'),
//   createdAt: timestamp('created_at').defaultNow(),
//   updatedAt: timestamp('updated_at').defaultNow(),
// });

// export const chapters = pgTable('chapters', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
//   title: text('title').notNull(),
//   description: text('description').notNull(),
//   duration: text('duration').notNull(),
//   content: text('content'),
//   videoUrls: jsonb('video_urls'),
//   orderIndex: integer('order_index').notNull(),
//   createdAt: timestamp('created_at').defaultNow(),
//   updatedAt: timestamp('updated_at').defaultNow(),
// });


import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

// 🧍 USERS TABLE
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(), // ✅ This ensures the DB column name is "clerk_id"
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 📘 COURSES TABLE - Updated to store modules as JSONB
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(), // Original title field (required for backward compatibility)
  course_title: text('course_title'), // New field for API response structure
  description: text('description'),
  category: text('category'),
  difficulty: text('difficulty'),
  duration: text('duration'),
  chapterCount: integer('chapter_count').notNull(), // Required field for chapter count
  modules: jsonb('modules').default('[]'), // Store complete modules with quiz data
  include_quiz: boolean('include_quiz').default(false), // Quiz inclusion flag
  include_videos: boolean('include_videos').default(false), // Video inclusion flag
  topic: text('topic'),
  thumbnail: text('thumbnail'),
  userDescription: text('user_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('courses_user_id_idx').on(table.userId),
  }
});

// 🎬 CHAPTERS TABLE
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  duration: text('duration').notNull(),
  content: text('content'),
  videoUrls: jsonb('video_urls'),
  videoUrl: text('video_url'), // Single video URL for frontend compatibility
  quiz: jsonb('quiz'), // Quiz data as JSONB array
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    courseIdIdx: index('chapters_course_id_idx').on(table.courseId),
  }
});

// 🧩 QUIZZES TABLE (Normalized structure for advanced tracking)
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: text('module_id').notNull(), // Reference to module in JSONB
  question: text('question').notNull(),
  options: jsonb('options').notNull(), // Array of answer options
  correct_answer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  question_type: text('question_type').default('mcq'), // mcq, true_false, fill_blank, etc.
  difficulty: text('difficulty'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    quizCourseIdIdx: index('quizzes_course_id_idx').on(table.courseId),
  }
});

// 📊 USER PROGRESS TABLE (for quiz scores and analytics)
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  chapterId: uuid('chapter_id')
    .references(() => chapters.id, { onDelete: 'cascade' })
    .notNull(),
  quizScore: integer('quiz_score').default(0), // Percentage score (0-100)
  totalQuestions: integer('total_questions').default(0),
  correctAnswers: integer('correct_answers').default(0),
  completedAt: timestamp('completed_at'),
  attempts: integer('attempts').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    upUserIdIdx: index('user_progress_user_id_idx').on(table.userId),
    upChapterIdIdx: index('user_progress_chapter_id_idx').on(table.chapterId),
  }
});

// 📈 MODULE PROGRESS TABLE (for module-level tracking)
export const moduleProgress = pgTable('module_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: text('module_id').notNull(), // Reference to module in course.modules JSONB
  moduleIndex: integer('module_index').notNull(), // For ordering
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  quizScore: integer('quiz_score'), // Last quiz score (0-100)
  quizAttempts: integer('quiz_attempts').default(0),
  bestQuizScore: integer('best_quiz_score').default(0),
  timeSpent: integer('time_spent').default(0), // Time in seconds
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    mpUserIdIdx: index('module_progress_user_id_idx').on(table.userId),
    mpCourseIdIdx: index('module_progress_course_id_idx').on(table.courseId),
  }
});

// 📝 USER NOTES TABLE (for module-specific notes)
export const userNotes = pgTable('user_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: text('module_id').notNull(), // Reference to module in course.modules
  moduleIndex: integer('module_index').notNull(),
  content: text('content').notNull(), // Note content (Markdown supported)
  title: text('title'), // Optional note title
  isPinned: boolean('is_pinned').default(false), // Pin important notes
  tags: jsonb('tags').default('[]'), // Array of tags for organization
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 📊 COURSE ANALYTICS TABLE (for detailed analytics)
export const courseAnalytics = pgTable('course_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  totalTimeSpent: integer('total_time_spent').default(0), // Total seconds
  modulesCompleted: integer('modules_completed').default(0),
  totalModules: integer('total_modules').notNull(),
  progressPercentage: integer('progress_percentage').default(0), // 0-100
  averageQuizScore: integer('average_quiz_score').default(0), // 0-100
  totalQuizAttempts: integer('total_quiz_attempts').default(0),
  lastAccessedModuleId: text('last_accessed_module_id'),
  lastAccessedModuleIndex: integer('last_accessed_module_index'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 🎯 QUIZ ATTEMPTS TABLE (for detailed quiz tracking)
export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: text('module_id').notNull(),
  moduleIndex: integer('module_index').notNull(),
  score: integer('score').notNull(), // Percentage (0-100)
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  wrongAnswers: integer('wrong_answers').notNull(),
  skippedAnswers: integer('skipped_answers').default(0),
  timeSpent: integer('time_spent'), // Time in seconds
  answers: jsonb('answers').notNull(), // Array of user answers with question details
  isPassed: boolean('is_passed').default(false), // If score >= passing threshold
  attemptNumber: integer('attempt_number').notNull(), // 1st, 2nd, 3rd attempt
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    qaUserIdIdx: index('quiz_attempts_user_id_idx').on(table.userId),
    qaCourseIdIdx: index('quiz_attempts_course_id_idx').on(table.courseId),
  }
});

// 📊 ACTIVITY LOG TABLE (for tracking all user activities)
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID
  type: text('type').notNull(), // COURSE_CREATED, COURSE_VIEWED, CHAPTER_VIEWED, FILE_UPLOADED, AI_MESSAGE_SENT
  meta: jsonb('meta'), // Additional metadata (courseId, chapterId, fileName, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    alUserIdIdx: index('activity_log_user_id_idx').on(table.userId),
    alTypeIdx: index('activity_log_type_idx').on(table.type),
  }
});

// 📁 FILE IMPORTS TABLE (track imported files/URLs)
export const fileImports = pgTable('file_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID
  fileName: text('file_name'),
  fileType: text('file_type'), // pdf, docx, pptx, youtube, url
  fileSize: integer('file_size'),
  sourceUrl: text('source_url'),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ⚙️ USER SETTINGS TABLE (for user preferences)
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(), // Clerk user ID
  // Notification settings
  emailUpdates: boolean('email_updates').default(true),
  quizReminders: boolean('quiz_reminders').default(true),
  aiTips: boolean('ai_tips').default(true),
  // Privacy settings
  publicProfile: boolean('public_profile').default(false),
  shareActivity: boolean('share_activity').default(true),
  // Appearance settings
  density: text('density').default('comfortable'), // comfortable, compact
  accentColor: text('accent_color').default('purple'), // purple, blue, pink
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

