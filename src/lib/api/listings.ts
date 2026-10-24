import type { CreateListingInput, DietType, FoodListing, ListingStatus, Profile } from '../../types';
import { getSupabase } from '../supabase';

/** Public storage bucket for food photographs. */
export const FOOD_IMAGE_BUCKET = 'food-photos';

/** Listings visible on Browse: claimable plus reserved ones an NGO already has a request for. */
export async function fetchBrowseListings(): Promise<FoodListing[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('food_listings')
    .select('*')
    .in('status', ['available', 'reserved'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FoodListing[];
}

export async function fetchListingById(id: string): Promise<FoodListing | null> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb.from('food_listings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as FoodListing | null) ?? null;
}

export async function fetchListingsByProvider(providerId: string): Promise<FoodListing[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('food_listings')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FoodListing[];
}

/**
 * Uploads a food photograph to Supabase Storage under the owner's folder
 * (`{userId}/{uuid}.{ext}` — storage policies enforce folder ownership).
 */
export async function uploadFoodImage(userId: string, file: File): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const extension =
    file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : file.type === 'image/gif'
            ? 'gif'
            : 'img';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await sb.storage
    .from(FOOD_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(FOOD_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Creates a listing, snapshotting the provider's display name and phone so
 * Browse works for signed-out visitors (matches the reference "Call Provider").
 */
export async function createListing(
  providerId: string,
  input: CreateListingInput,
): Promise<FoodListing> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');

  const { data: profileRow, error: profileError } = await sb
    .from('profiles')
    .select('full_name, org_name, phone')
    .eq('id', providerId)
    .maybeSingle();
  if (profileError) throw profileError;
  const profile = profileRow as Pick<Profile, 'full_name' | 'org_name' | 'phone'> | null;

  const providerName = (profile?.org_name || profile?.full_name || '').trim() || 'Provider';

  const { data, error } = await sb
    .from('food_listings')
    .insert({
      provider_id: providerId,
      provider_name: providerName,
      provider_phone: profile?.phone ?? null,
      title: input.title,
      quantity: input.quantity,
      diet_type: input.diet_type,
      image_url: input.image_url,
      address: input.address,
      deadline: input.deadline,
      details: input.details,
      status: 'available',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as FoodListing;
}

/** Direct status update — RLS allows only the listing's provider. */
export async function updateListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<FoodListing> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { data, error } = await sb
    .from('food_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select('*')
    .single();
  if (error) throw error;
  return data as FoodListing;
}

/**
 * Cancels a reservation atomically in the database (also rejects the accepted
 * request) so listing and request states never diverge.
 */
export async function cancelReservation(listingId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');
  const { error } = await sb.rpc('cancel_reservation', { p_listing_id: listingId });
  if (error) throw error;
}

/** Client-side diet filter helper shared by Browse. */
export function matchesDiet(listing: FoodListing, diet: '' | DietType): boolean {
  return diet === '' || listing.diet_type === diet;
}
