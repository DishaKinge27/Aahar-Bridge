/**
 * Application types.
 *
 * These mirror the Supabase/PostgreSQL schema defined in
 * `supabase/migrations` using snake_case field names, so rows returned by
 * Supabase queries can be assigned directly without mapping layers.
 */

export type Role = 'provider' | 'ngo';
export type DietType = 'vegetarian' | 'non_vegetarian' | 'mixed';
export type ListingStatus = 'available' | 'reserved' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type LanguageCode = 'en' | 'mr';

/** `public.profiles` row. */
export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  org_name: string | null;
  phone: string | null;
  address: string | null;
  language: LanguageCode;
  created_at: string;
  updated_at: string;
}

/** Minimal profile shape used when displaying other users. */
export interface ProfileBrief {
  id: string;
  full_name: string | null;
  org_name: string | null;
  role: Role;
  phone: string | null;
}

/** `public.food_listings` row. */
export interface FoodListing {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_phone: string | null;
  title: string;
  quantity: number;
  diet_type: DietType;
  image_url: string | null;
  address: string;
  deadline: string;
  details: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

/** `public.donation_requests` row. */
export interface DonationRequest {
  id: string;
  listing_id: string;
  ngo_id: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
}

/** Request joined with its listing (used on both dashboards). */
export interface RequestWithListing extends DonationRequest {
  listing: FoodListing | null;
}

/** `public.conversations` row. */
export interface Conversation {
  id: string;
  listing_id: string;
  provider_id: string;
  ngo_id: string;
  last_message_at: string;
  created_at: string;
}

/** Conversation joined with its listing. */
export interface ConversationWithListing extends Conversation {
  listing: FoodListing | null;
}

/** Conversation enriched with the counterparty's profile for the chat UI. */
export interface ConversationView {
  conversation: Conversation;
  listing: FoodListing | null;
  counterparty: ProfileBrief | null;
}

/** `public.messages` row. */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** Input payload for creating a listing (after validation). */
export interface CreateListingInput {
  title: string;
  quantity: number;
  diet_type: DietType;
  address: string;
  deadline: string;
  details: string | null;
  image_url: string | null;
}
