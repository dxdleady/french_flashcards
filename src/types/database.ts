export interface Profile {
  id: string;
  display_name: string;
  native_language: string;
  target_exam_date: string | null;
  daily_goal: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardCollection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  collection_id: string | null;
  french_text: string;
  translation: string;
  context_sentence: string;
  audio_url: string;
  difficulty_level: string;
  topic: string;
  source: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  last_reviewed: string | null;
  next_review: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  cards_reviewed: number;
  cards_correct: number;
  duration_seconds: number;
}

export interface CardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  session_id: string | null;
  quality: number;
  response_time_ms: number;
  was_correct: boolean;
  reviewed_at: string;
}

export interface GrammarTopic {
  id: string;
  category: string;
  title: string;
  description: string;
  difficulty: string;
  examples: Array<{
    french: string;
    translation: string;
    explanation: string;
  }>;
  order_index: number;
}

export interface GrammarExercise {
  id: string;
  user_id: string;
  topic_id: string | null;
  exercise_type: string;
  question: string;
  correct_answer: string;
  options: string[];
  completed: boolean;
  user_answer: string;
  completed_at: string | null;
  created_at: string;
}

export interface WritingPractice {
  id: string;
  user_id: string;
  topic: string;
  content: string;
  word_count: number;
  time_spent_seconds: number;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  unlocked_at: string;
}

export interface UserStats {
  user_id: string;
  total_cards: number;
  total_reviews: number;
  retention_rate: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  updated_at: string;
}
