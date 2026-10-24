import type { DonationRequest, RequestWithListing } from '../../types';
import { getSupabase } from '../supabase';

const REQUEST_WITH_LISTING = '*, listing:food_listings!donation_requests_listing_id_fkey(*)';
const REQUEST_WITH_LISTING_INNER =
  '*, listing:food_listings!donation_requests_listing_id_fkey!inner(*)';

/**
 * NGO submits a request. The DB enforces uniqueness on (listing_id, ngo_id)
 * and RLS requires an available, not-owned listing — duplicates fail with 23505.
 */
export async function createDonationRequest(
  listingId: string,
  ngoId: string,
  message: string | null,
): Promise<DonationRequest> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('donation_requests')
    .insert({ listing_id: listingId, ngo_id: ngoId, message, status: 'pending' })
    .select('*')
    .single();
  if (error) throw error;
  return data as DonationRequest;
}

/** The signed-in NGO's request for one listing, if any. */
export async function fetchMyRequestForListing(
  listingId: string,
  ngoId: string,
): Promise<DonationRequest | null> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('donation_requests')
    .select('*')
    .eq('listing_id', listingId)
    .eq('ngo_id', ngoId)
    .maybeSingle();
  if (error) throw error;
  return (data as DonationRequest | null) ?? null;
}

/** Requests against the provider's listings, newest first (with listings joined). */
export async function fetchProviderRequests(providerId: string): Promise<RequestWithListing[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  // Inner-join filter: only requests whose listing belongs to this provider.
  const { data, error } = await sb
    .from('donation_requests')
    .select(REQUEST_WITH_LISTING_INNER)
    .eq('listing.provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as RequestWithListing[];
}

/** Requests submitted by the NGO, newest first (with listings joined). */
export async function fetchNgoRequests(ngoId: string): Promise<RequestWithListing[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('donation_requests')
    .select(REQUEST_WITH_LISTING)
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as RequestWithListing[];
}

/**
 * Provider accepts a request. Runs the SECURITY DEFINER Postgres function
 * which locks the listing, verifies ownership and availability, marks this
 * request accepted and rejects the other pending ones — race-free.
 */
export async function acceptRequest(requestId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { error } = await sb.rpc('accept_donation_request', { p_request_id: requestId });
  if (error) throw error;
}

/** Provider rejects a request (SECURITY DEFINER function checks ownership). */
export async function rejectRequest(requestId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { error } = await sb.rpc('reject_donation_request', { p_request_id: requestId });
  if (error) throw error;
}
