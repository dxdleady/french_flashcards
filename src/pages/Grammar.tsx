import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GrammarTopic } from '../types/database';

export function Grammar() {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('grammar_topics')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading grammar topics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grammar Reference</h1>
        <p className="mt-2 text-gray-600">Master essential B2-level grammar topics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Topics</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedTopic?.id === topic.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{topic.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{topic.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTopic ? (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTopic.title}</h2>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedTopic.difficulty}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{selectedTopic.category}</div>
              </div>

              <div className="prose max-w-none">
                <div className="text-gray-700 leading-relaxed mb-8">
                  {selectedTopic.description}
                </div>

                {selectedTopic.examples && selectedTopic.examples.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Examples</h3>
                    {selectedTopic.examples.map((example, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="font-medium text-gray-900 text-lg mb-2">
                          {example.french}
                        </div>
                        <div className="text-gray-600 mb-3 italic">
                          {example.translation}
                        </div>
                        <div className="text-sm text-gray-500 border-t border-gray-300 pt-3">
                          {example.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-600">Select a topic to view details and examples</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
