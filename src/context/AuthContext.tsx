import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, Role } from '../types';
import { logError } from '../utils/errors';

export interface SignUpInput {
  email: string;
  password: string;
  role: Role;
  fullName: string;
  orgName: string;
  phone: string;
}

export interface AuthResult {
  error: unknown | null;
}

export interface SignUpResult extends AuthResult {
  needsConfirmation: boolean;
}

export interface SignInResult extends AuthResult {
  profile: Profile | null;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configMissing: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    logError('fetch profile', error);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const signedInUserId = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const userId = signedInUserId.current;
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfile(await loadProfile(userId));
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    sb.auth.getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        const nextSession = data.session;
        setSession(nextSession);
        signedInUserId.current = nextSession?.user.id ?? null;
        if (nextSession) {
          setProfile(await loadProfile(nextSession.user.id));
        }
        if (!cancelled) setLoading(false);
      })
      .catch((error: unknown) => {
        logError('get session', error);
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      signedInUserId.current = nextSession?.user.id ?? null;
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (nextSession) {
        // Deferred so table reads never run inside the auth callback itself.
        window.setTimeout(() => {
          void loadProfile(nextSession.user.id).then((nextProfile) => {
            setProfile(nextProfile);
            setLoading(false);
          });
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Supabase is not configured'), profile: null };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error, profile: null };
    signedInUserId.current = data.user.id;
    const nextProfile = await loadProfile(data.user.id);
    setProfile(nextProfile);
    return { error: null, profile: nextProfile };
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<SignUpResult> => {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Supabase is not configured'), needsConfirmation: false };
    const { data, error } = await sb.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          role: input.role,
          full_name: input.fullName,
          org_name: input.orgName,
          phone: input.phone,
        },
      },
    });
    if (error) return { error, needsConfirmation: false };
    if (data.session && data.user) {
      signedInUserId.current = data.user.id;
      setProfile(await loadProfile(data.user.id));
      return { error: null, needsConfirmation: false };
    }
    return { error: null, needsConfirmation: true };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.auth.signOut();
      if (error) logError('sign out', error);
    }
    signedInUserId.current = null;
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      configMissing: !isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
