import type { Profile, ProfileBrief } from '../../types';
import { getSupabase } from '../supabase';

export interface ProfileUpdate {
  full_name?: string;
  org_name?: string | null;
  phone?: string | null;
  address?: string | null;
  language?: 'en' | 'mr';
}

/** Updates the current user's own profile row (RLS restricts it to `auth.uid()`). */
export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Fetches display-safe profile fields for several users (chat, request lists). */
export async function fetchProfilesByIds(ids: string[]): Promise<ProfileBrief[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];
  const { data, error } = await sb
    .from('profiles')
    .select('id, full_name, org_name, role, phone')
    .in('id', unique);
  if (error) throw error;
  return (data ?? []) as ProfileBrief[];
}
