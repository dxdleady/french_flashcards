import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { WritingPractice } from '../types/database';

const ESSAY_TOPICS = [
  'The impact of social media on modern society',
  'Should higher education be free for all citizens?',
  'The importance of environmental protection in the 21st century',
  'Remote work vs traditional office: advantages and disadvantages',
  'The role of technology in education',
  'Cultural diversity: challenges and benefits',
  'Is work-life balance achievable in modern society?',
  'The influence of advertising on consumer behavior',
  'Public transportation vs private cars in urban areas',
  'The future of renewable energy'
];

export function Writing() {
  const user = useAuthStore(state => state.user);
  const [essays, setEssays] = useState<WritingPractice[]>([]);
  const [currentEssay, setCurrentEssay] = useState<WritingPractice | null>(null);
  const [content, setContent] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    loadEssays();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  const loadEssays = async () => {
    const { data } = await supabase
      .from('writing_practice')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setEssays(data);
  };

  const startNewEssay = async () => {
    const randomTopic = ESSAY_TOPICS[Math.floor(Math.random() * ESSAY_TOPICS.length)];

    const { data } = await supabase
      .from('writing_practice')
      .insert({
        user_id: user!.id,
        topic: randomTopic,
        content: '',
        word_count: 0,
        time_spent_seconds: 0,
        is_draft: true
      })
      .select()
      .single();

    if (data) {
      setCurrentEssay(data);
      setContent('');
      setTimeSpent(0);
      setStartTime(Date.now());
      setIsTimerRunning(true);
    }
  };

  const saveEssay = async (isDraft: boolean = true) => {
    if (!currentEssay) return;

    const wordCount = content.trim().split(/\s+/).length;

    await supabase
      .from('writing_practice')
      .update({
        content,
        word_count: wordCount,
        time_spent_seconds: timeSpent,
        is_draft: isDraft,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentEssay.id);

    setIsTimerRunning(false);
    loadEssays();

    if (!isDraft) {
      setCurrentEssay(null);
      setContent('');
      setTimeSpent(0);
    }
  };

  const loadEssay = (essay: WritingPractice) => {
    setCurrentEssay(essay);
    setContent(essay.content);
    setTimeSpent(essay.time_spent_seconds);
    setStartTime(Date.now());
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Writing Practice</h1>
          <p className="mt-2 text-gray-600">Practice argumentative essays for DELF B2</p>
        </div>
        {!currentEssay && (
          <button
            onClick={startNewEssay}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            New Essay
          </button>
        )}
      </div>

      {currentEssay ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Topic</h2>
                <p className="text-gray-700 mt-2">{currentEssay.topic}</p>
              </div>
              <div className="text-right space-y-2">
                <div className="text-2xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
                <div className="text-sm text-gray-600">
                  {wordCount} / 250 words
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((wordCount / 250) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your essay here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => saveEssay(true)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={() => saveEssay(false)}
                disabled={wordCount < 200}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Complete
              </button>
              <button
                onClick={() => {
                  setCurrentEssay(null);
                  setContent('');
                  setIsTimerRunning(false);
                }}
                className="px-6 bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for DELF B2 Writing</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Target: 250 words minimum</li>
              <li>• Include clear introduction, body paragraphs, and conclusion</li>
              <li>• Present arguments for and against</li>
              <li>• Use linking words: cependant, en revanche, par conséquent</li>
              <li>• Time limit: 60 minutes in the actual exam</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Essays</h2>
            {essays.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No essays yet. Start writing your first one!
              </div>
            ) : (
              <div className="space-y-3">
                {essays.map((essay) => (
                  <div
                    key={essay.id}
                    onClick={() => loadEssay(essay)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{essay.topic}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(essay.created_at).toLocaleDateString()} • {essay.word_count} words
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {essay.is_draft ? (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                            Draft
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
