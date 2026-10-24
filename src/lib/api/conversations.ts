import type {
  Conversation,
  ConversationView,
  ConversationWithListing,
  Message,
  ProfileBrief,
} from '../../types';
import { getSupabase } from '../supabase';
import { fetchProfilesByIds } from './profiles';

const CONVERSATION_WITH_LISTING =
  '*, listing:food_listings!conversations_listing_id_fkey(*)';

/** Opens (or returns) the conversation for a listing; RLS+RPC verify participation. */
export async function startConversation(listingId: string): Promise<Conversation> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb.rpc('get_or_create_conversation', {
    p_listing_id: listingId,
  });
  if (error) throw error;
  return data as Conversation;
}

export async function fetchConversationById(id: string): Promise<ConversationWithListing | null> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('conversations')
    .select(CONVERSATION_WITH_LISTING)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as ConversationWithListing | null) ?? null;
}

/** All conversations for the signed-in user, newest activity first, with counterparty profiles. */
export async function fetchConversations(userId: string): Promise<ConversationView[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('conversations')
    .select(CONVERSATION_WITH_LISTING)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as ConversationWithListing[];

  const counterpartyIds = rows.map((row) =>
    row.provider_id === userId ? row.ngo_id : row.provider_id,
  );
  const profiles = await fetchProfilesByIds(counterpartyIds);
  const byId = new Map<string, ProfileBrief>(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => ({
    conversation: row,
    listing: row.listing,
    counterparty:
      byId.get(row.provider_id === userId ? row.ngo_id : row.provider_id) ?? null,
  }));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Message[];
}

/**
 * Latest messages across the user's conversations (capped), used to render
 * chat-list previews like the reference ("I can have it ready by 3 PM.").
 */
export async function fetchRecentMessages(conversationIds: string[]): Promise<Message[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  if (conversationIds.length === 0) return [];
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<Message> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select('*')
    .single();
  if (error) throw error;
  return data as Message;
}
