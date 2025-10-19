import { useState, useEffect } from 'react';
import { useFlashcards } from '../hooks/useFlashcards';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Flashcard } from '../types/database';
import { calculateSRS, getQualityFromPerformance } from '../lib/srs';

type StudyMode = 'study' | 'test';

export function Study() {
  const user = useAuthStore(state => state.user);
  const { getDueCards } = useFlashcards();
  const [mode, setMode] = useState<StudyMode>('study');
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 });

  useEffect(() => {
    loadDueCards();
    createSession();
  }, []);

  const loadDueCards = async () => {
    const cards = await getDueCards(20);
    setDueCards(cards);
  };

  const createSession = async () => {
    const { data } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user!.id,
        session_type: mode,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (data) setSessionId(data.id);
  };

  const currentCard = dueCards[currentIndex];

  const handleAnswer = async (wasCorrect: boolean) => {
    if (!currentCard) return;

    const responseTime = Date.now() - startTime;
    const quality = getQualityFromPerformance(wasCorrect, responseTime);
    const srsResult = calculateSRS(
      quality,
      currentCard.ease_factor,
      currentCard.interval,
      currentCard.repetitions
    );

    await supabase
      .from('flashcards')
      .update({
        ease_factor: srsResult.ease_factor,
        interval: srsResult.interval,
        repetitions: srsResult.repetitions,
        last_reviewed: new Date().toISOString(),
        next_review: srsResult.next_review.toISOString()
      })
      .eq('id', currentCard.id);

    await supabase.from('card_reviews').insert({
      user_id: user!.id,
      flashcard_id: currentCard.id,
      session_id: sessionId,
      quality,
      response_time_ms: responseTime,
      was_correct: wasCorrect,
      reviewed_at: new Date().toISOString()
    });

    setStats({
      reviewed: stats.reviewed + 1,
      correct: stats.correct + (wasCorrect ? 1 : 0)
    });

    setCurrentIndex(currentIndex + 1);
    setFlipped(false);
    setUserAnswer('');
    setShowResult(false);
    setStartTime(Date.now());
  };

  const handleTestSubmit = () => {
    if (!currentCard) return;

    const isCorrect = userAnswer.trim().toLowerCase() === currentCard.translation.toLowerCase();
    setShowResult(true);

    if (isCorrect) {
      setTimeout(() => handleAnswer(true), 1500);
    }
  };

  const finishSession = async () => {
    if (sessionId) {
      await supabase
        .from('study_sessions')
        .update({
          ended_at: new Date().toISOString(),
          cards_reviewed: stats.reviewed,
          cards_correct: stats.correct,
          duration_seconds: Math.floor((Date.now() - startTime) / 1000)
        })
        .eq('id', sessionId);

      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (userStats) {
        const retentionRate = stats.reviewed > 0 ? stats.correct / stats.reviewed : 0;
        await supabase
          .from('user_stats')
          .update({
            total_reviews: userStats.total_reviews + stats.reviewed,
            retention_rate: (userStats.retention_rate + retentionRate) / 2,
            last_study_date: new Date().toISOString().split('T')[0]
          })
          .eq('user_id', user!.id);
      }
    }

    loadDueCards();
    setCurrentIndex(0);
    setStats({ reviewed: 0, correct: 0 });
    createSession();
  };

  if (dueCards.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No cards due!</h2>
        <p className="text-gray-600 mb-8">Come back later or add more flashcards</p>
      </div>
    );
  }

  if (currentIndex >= dueCards.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Session Complete!</h2>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 mb-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600">{stats.reviewed}</div>
              <div className="text-gray-600 mt-2">Cards Reviewed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">
                {stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0}%
              </div>
              <div className="text-gray-600 mt-2">Accuracy</div>
            </div>
          </div>
        </div>
        <button
          onClick={finishSession}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Start New Session
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Session</h1>
          <p className="text-gray-600 mt-1">
            Card {currentIndex + 1} of {dueCards.length}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('study')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'study'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Study Mode
          </button>
          <button
            onClick={() => setMode('test')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'test'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Test Mode
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {mode === 'study' ? (
          <div className="space-y-8">
            <div
              onClick={() => setFlipped(!flipped)}
              className="min-h-[300px] flex items-center justify-center cursor-pointer"
            >
              {!flipped ? (
                <div className="text-center">
                  <div className="text-3xl font-semibold text-gray-900 mb-4">
                    {currentCard.french_text}
                  </div>
                  {currentCard.context_sentence && (
                    <div className="text-lg text-gray-500 italic">
                      {currentCard.context_sentence}
                    </div>
                  )}
                  <div className="mt-8 text-sm text-gray-400">Click to reveal translation</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-3xl text-gray-900 mb-8">
                    {currentCard.translation}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnswer(false);
                      }}
                      className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Need Practice
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnswer(true);
                      }}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      I Know This
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center min-h-[200px] flex items-center justify-center">
              <div className="text-3xl font-semibold text-gray-900">
                {currentCard.french_text}
              </div>
            </div>

            {!showResult ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTestSubmit()}
                  placeholder="Type translation..."
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleTestSubmit}
                  disabled={!userAnswer.trim()}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                {userAnswer.trim().toLowerCase() === currentCard.translation.toLowerCase() ? (
                  <div className="text-2xl font-bold text-green-600">Correct!</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">Incorrect</div>
                    <div className="text-lg text-gray-900">
                      Correct answer: <span className="font-semibold">{currentCard.translation}</span>
                    </div>
                    <button
                      onClick={() => handleAnswer(false)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continue
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-gray-600">Progress: </span>
            <span className="font-medium text-gray-900">{stats.reviewed} reviewed</span>
          </div>
          <div>
            <span className="text-gray-600">Accuracy: </span>
            <span className="font-medium text-gray-900">
              {stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
