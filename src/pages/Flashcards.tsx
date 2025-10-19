import { useState } from 'react';
import { useFlashcards } from '../hooks/useFlashcards';
import { Flashcard } from '../types/database';

export function Flashcards() {
  const { flashcards, loading, createFlashcard, deleteFlashcard } = useFlashcards();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    french_text: '',
    translation: '',
    context_sentence: '',
    difficulty_level: 'B2',
    topic: '',
    source: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFlashcard(formData);
      setFormData({
        french_text: '',
        translation: '',
        context_sentence: '',
        difficulty_level: 'B2',
        topic: '',
        source: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating flashcard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <p className="mt-2 text-gray-600">Manage your vocabulary collection</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Card'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Flashcard</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  French Text
                </label>
                <input
                  type="text"
                  value={formData.french_text}
                  onChange={(e) => setFormData({ ...formData, french_text: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="le mot, la phrase..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Translation
                </label>
                <input
                  type="text"
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="word, phrase..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context Sentence
              </label>
              <input
                type="text"
                value={formData.context_sentence}
                onChange={(e) => setFormData({ ...formData, context_sentence: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Example sentence in French..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Work, Travel..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Class 5, Book..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Flashcard
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((card) => (
          <FlashcardItem
            key={card.id}
            card={card}
            onDelete={() => deleteFlashcard(card.id)}
          />
        ))}
      </div>

      {flashcards.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600 mb-4">No flashcards yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            Create your first card
          </button>
        </div>
      )}
    </div>
  );
}

interface FlashcardItemProps {
  card: Flashcard;
  onDelete: () => void;
}

function FlashcardItem({ card, onDelete }: FlashcardItemProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this flashcard?')) onDelete();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors"
      >
        ✕
      </button>

      <div className="min-h-[120px] flex flex-col justify-center">
        {!flipped ? (
          <>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              {card.french_text}
            </div>
            {card.context_sentence && (
              <div className="text-sm text-gray-500 italic">
                {card.context_sentence}
              </div>
            )}
          </>
        ) : (
          <div className="text-lg text-gray-900">{card.translation}</div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
          {card.difficulty_level}
        </span>
        {card.topic && <span>{card.topic}</span>}
        <span>Rep: {card.repetitions}</span>
      </div>
    </div>
  );
}
