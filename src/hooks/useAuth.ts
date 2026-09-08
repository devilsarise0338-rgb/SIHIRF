import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check admin status whenever user changes
  useEffect(() => {
    if (!user?.email) { setIsAdmin(false); return; }
    supabase.from('admin_emails').select('email').eq('email', user.email).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user?.email]);

  const signInWithOtp = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    return { data, error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/register` }
    });
    return { data, error };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return { session, user, loading, isAdmin, signInWithOtp, verifyOtp, signInWithGoogle, signOut };
}

