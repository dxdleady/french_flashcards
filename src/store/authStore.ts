import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, initialized: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        set({ user: session?.user ?? null });

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: session.user.id,
              display_name: session.user.email?.split('@')[0] || 'User',
              native_language: 'Russian',
              daily_goal: 100
            });

            await supabase.from('user_stats').insert({
              user_id: session.user.id,
              total_cards: 0,
              total_reviews: 0,
              retention_rate: 0,
              current_streak: 0,
              longest_streak: 0
            });
          }
        }
      })();
    });
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
    } finally {
      set({ loading: false });
    }
  }
}));
