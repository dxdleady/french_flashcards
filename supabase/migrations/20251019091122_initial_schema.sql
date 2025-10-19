/*
  # DELF B2 Preparation App - Initial Database Schema

  ## Overview
  This migration creates the complete database structure for a DELF B2 French learning app
  with flashcards, spaced repetition, grammar exercises, writing practice, and progress tracking.

  ## New Tables

  ### 1. profiles
  User profile information extending Supabase auth.users
  - `id` (uuid, FK to auth.users) - User identifier
  - `display_name` (text) - User's display name
  - `native_language` (text) - User's native language (Russian/English)
  - `target_exam_date` (date) - When they plan to take DELF B2
  - `daily_goal` (integer) - Cards to review daily
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. flashcard_collections
  Organized groups of flashcards (by topic, source, etc.)
  - `id` (uuid, PK) - Collection identifier
  - `user_id` (uuid, FK) - Owner of collection
  - `name` (text) - Collection name
  - `description` (text) - Collection description
  - `color` (text) - UI color for organization
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. flashcards
  Individual vocabulary/phrase cards with SRS data
  - `id` (uuid, PK) - Card identifier
  - `user_id` (uuid, FK) - Card owner
  - `collection_id` (uuid, FK) - Parent collection
  - `french_text` (text) - French content (front)
  - `translation` (text) - Russian/English translation (back)
  - `context_sentence` (text) - Example sentence
  - `audio_url` (text) - URL to pronunciation audio
  - `difficulty_level` (text) - A2/B1/B2 classification
  - `topic` (text) - Auto-categorized topic
  - `source` (text) - Where card came from
  - `ease_factor` (real) - SRS ease (default 2.5)
  - `interval` (integer) - Days until next review
  - `repetitions` (integer) - Number of successful reviews
  - `last_reviewed` (timestamptz) - Last review timestamp
  - `next_review` (timestamptz) - Next scheduled review
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. study_sessions
  Records of each study session for analytics
  - `id` (uuid, PK) - Session identifier
  - `user_id` (uuid, FK) - User who studied
  - `session_type` (text) - study/test/listening/writing
  - `started_at` (timestamptz) - Session start
  - `ended_at` (timestamptz) - Session end
  - `cards_reviewed` (integer) - Number of cards reviewed
  - `cards_correct` (integer) - Number answered correctly
  - `duration_seconds` (integer) - Session duration

  ### 5. card_reviews
  Individual card review results for detailed tracking
  - `id` (uuid, PK) - Review identifier
  - `user_id` (uuid, FK) - User who reviewed
  - `flashcard_id` (uuid, FK) - Card reviewed
  - `session_id` (uuid, FK) - Parent session
  - `quality` (integer) - Performance rating 0-5
  - `response_time_ms` (integer) - Time to answer
  - `was_correct` (boolean) - Whether answer was correct
  - `reviewed_at` (timestamptz) - Review timestamp

  ### 6. grammar_topics
  B2-level grammar topics and explanations
  - `id` (uuid, PK) - Topic identifier
  - `category` (text) - Verb tenses/pronouns/etc
  - `title` (text) - Topic name
  - `description` (text) - Explanation in simple language
  - `difficulty` (text) - B1/B2 level
  - `examples` (jsonb) - Array of example sentences
  - `order_index` (integer) - Display order

  ### 7. grammar_exercises
  User-specific grammar practice exercises
  - `id` (uuid, PK) - Exercise identifier
  - `user_id` (uuid, FK) - Exercise owner
  - `topic_id` (uuid, FK) - Related grammar topic
  - `exercise_type` (text) - fill-blank/mcq/conjugation
  - `question` (text) - Exercise question
  - `correct_answer` (text) - Correct answer
  - `options` (jsonb) - Multiple choice options
  - `completed` (boolean) - Whether completed
  - `user_answer` (text) - User's answer
  - `completed_at` (timestamptz) - Completion timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### 8. writing_practice
  Essay practice and drafts
  - `id` (uuid, PK) - Essay identifier
  - `user_id` (uuid, FK) - Essay author
  - `topic` (text) - Essay topic/prompt
  - `content` (text) - Essay text
  - `word_count` (integer) - Number of words
  - `time_spent_seconds` (integer) - Time spent writing
  - `is_draft` (boolean) - Draft vs completed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 9. user_achievements
  Gamification: track user milestones
  - `id` (uuid, PK) - Achievement identifier
  - `user_id` (uuid, FK) - User who earned it
  - `achievement_type` (text) - Type of achievement
  - `unlocked_at` (timestamptz) - When earned

  ### 10. user_stats
  Aggregated user statistics (updated via triggers)
  - `user_id` (uuid, PK, FK) - User identifier
  - `total_cards` (integer) - Total flashcards created
  - `total_reviews` (integer) - Total reviews completed
  - `retention_rate` (real) - % cards remembered
  - `current_streak` (integer) - Days studied consecutively
  - `longest_streak` (integer) - Best streak ever
  - `last_study_date` (date) - Last study session date
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Grammar topics are publicly readable
  - Profiles are readable by authenticated users but only editable by owner
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  native_language text DEFAULT 'Russian',
  target_exam_date date,
  daily_goal integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create flashcard_collections table
CREATE TABLE IF NOT EXISTS flashcard_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcard_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON flashcard_collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON flashcard_collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON flashcard_collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON flashcard_collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES flashcard_collections(id) ON DELETE SET NULL,
  french_text text NOT NULL,
  translation text NOT NULL,
  context_sentence text DEFAULT '',
  audio_url text DEFAULT '',
  difficulty_level text DEFAULT 'B2',
  topic text DEFAULT '',
  source text DEFAULT '',
  ease_factor real DEFAULT 2.5,
  interval integer DEFAULT 1,
  repetitions integer DEFAULT 0,
  last_reviewed timestamptz,
  next_review timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards"
  ON flashcards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON flashcards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for next review queries
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(user_id, next_review);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text DEFAULT 'study',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  cards_reviewed integer DEFAULT 0,
  cards_correct integer DEFAULT 0,
  duration_seconds integer DEFAULT 0
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create card_reviews table
CREATE TABLE IF NOT EXISTS card_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  quality integer NOT NULL CHECK (quality >= 0 AND quality <= 5),
  response_time_ms integer DEFAULT 0,
  was_correct boolean DEFAULT false,
  reviewed_at timestamptz DEFAULT now()
);

ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews"
  ON card_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON card_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance analytics
CREATE INDEX IF NOT EXISTS idx_card_reviews_flashcard ON card_reviews(flashcard_id, reviewed_at);

-- Create grammar_topics table
CREATE TABLE IF NOT EXISTS grammar_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text DEFAULT 'B2',
  examples jsonb DEFAULT '[]'::jsonb,
  order_index integer DEFAULT 0
);

ALTER TABLE grammar_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grammar topics"
  ON grammar_topics FOR SELECT
  TO authenticated
  USING (true);

-- Create grammar_exercises table
CREATE TABLE IF NOT EXISTS grammar_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES grammar_topics(id) ON DELETE SET NULL,
  exercise_type text DEFAULT 'fill-blank',
  question text NOT NULL,
  correct_answer text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  user_answer text DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grammar_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercises"
  ON grammar_exercises FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON grammar_exercises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON grammar_exercises FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create writing_practice table
CREATE TABLE IF NOT EXISTS writing_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  content text DEFAULT '',
  word_count integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  is_draft boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE writing_practice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own essays"
  ON writing_practice FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own essays"
  ON writing_practice FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own essays"
  ON writing_practice FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own essays"
  ON writing_practice FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cards integer DEFAULT 0,
  total_reviews integer DEFAULT 0,
  retention_rate real DEFAULT 0.0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_study_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert initial grammar topics
INSERT INTO grammar_topics (category, title, description, difficulty, examples, order_index) VALUES
  ('Verb Tenses', 'Le Subjonctif Présent', 'The present subjunctive is used to express doubt, necessity, desire, emotion, or subjective opinions.', 'B2', 
   '[{"french": "Il faut que tu viennes demain.", "translation": "You must come tomorrow.", "explanation": "Subjunctive after ''il faut que''"}]'::jsonb, 1),
  
  ('Verb Tenses', 'Le Conditionnel', 'The conditional is used to express wishes, hypothetical situations, or polite requests.', 'B2',
   '[{"french": "Je voudrais un café, s''il vous plaît.", "translation": "I would like a coffee, please.", "explanation": "Polite request using conditional"}]'::jsonb, 2),
  
  ('Verb Tenses', 'Le Plus-que-parfait', 'The pluperfect describes actions that happened before another past action.', 'B2',
   '[{"french": "J''avais déjà mangé quand il est arrivé.", "translation": "I had already eaten when he arrived.", "explanation": "Action completed before another past action"}]'::jsonb, 3),
  
  ('Pronouns', 'Les Pronoms Relatifs', 'Relative pronouns (qui, que, dont, où, lequel) connect clauses and avoid repetition.', 'B2',
   '[{"french": "C''est la maison dont je t''ai parlé.", "translation": "This is the house I told you about.", "explanation": "''dont'' replaces ''de + noun''"}]'::jsonb, 4),
  
  ('Advanced Structures', 'La Voix Passive', 'The passive voice emphasizes the action or its recipient rather than the doer.', 'B2',
   '[{"french": "Cette maison a été construite en 1920.", "translation": "This house was built in 1920.", "explanation": "Passive construction with être + past participle"}]'::jsonb, 5),
  
  ('Advanced Structures', 'Le Discours Indirect', 'Indirect speech reports what someone said without quoting directly.', 'B2',
   '[{"french": "Il a dit qu''il viendrait demain.", "translation": "He said he would come tomorrow.", "explanation": "Direct: ''Je viendrai demain'' becomes indirect with tense change"}]'::jsonb, 6);
