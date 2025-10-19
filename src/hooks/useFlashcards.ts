import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Flashcard } from '../types/database';
import { useAuthStore } from '../store/authStore';

export function useFlashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [user]);

  const loadFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDueCards = async (limit: number = 100): Promise<Flashcard[]> => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const createFlashcard = async (flashcard: Partial<Flashcard>) => {
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: user!.id,
        ...flashcard,
        next_review: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    await loadFlashcards();

    const { data: stats } = await supabase
      .from('user_stats')
      .select('total_cards')
      .eq('user_id', user!.id)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({ total_cards: stats.total_cards + 1 })
        .eq('user_id', user!.id);
    }

    return data;
  };

  const updateFlashcard = async (id: string, updates: Partial<Flashcard>) => {
    const { error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await loadFlashcards();
  };

  const deleteFlashcard = async (id: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadFlashcards();
  };

  return {
    flashcards,
    loading,
    getDueCards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    refresh: loadFlashcards
  };
}
