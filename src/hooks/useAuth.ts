import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../data/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

const isSupabaseBackend = import.meta.env.VITE_DATA_BACKEND === 'supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkOwnerStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('owners')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    } catch {
      setIsOwner(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseBackend) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOwnerStatus(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkOwnerStatus(session.user.id);
      } else {
        setIsOwner(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkOwnerStatus]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setIsOwner(false);
  };

  return {
    user,
    session,
    isOwner,
    loading,
    signIn,
    signOut,
    isSupabaseBackend,
  };
}
