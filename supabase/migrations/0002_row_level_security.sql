-- ============================================================================
-- Aahar Bridge — 0002 grants + Row Level Security + storage
--
-- Least privilege: revoke everything from client roles, then grant only what
-- each surface needs. Request mutations go exclusively through SECURITY
-- DEFINER functions (accept/reject/cancel/conversation), so clients cannot
-- rewrite request states directly and conflicting claims are impossible.
-- ============================================================================

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Table grants
-- ---------------------------------------------------------------------------
-- profiles: read (display names/contact), update own row. No insert/delete —
-- rows are created by the signup trigger; role changes are blocked by trigger.
grant select, update on public.profiles to authenticated;

-- food_listings: public read of visible listings; providers insert/update own.
grant select on public.food_listings to anon, authenticated;
grant insert, update on public.food_listings to authenticated;

-- donation_requests: read for participants, insert for NGOs; NO update/delete
-- grants — status only changes inside accept/reject functions.
grant select, insert on public.donation_requests to authenticated;

-- conversations: read only; creation happens in get_or_create_conversation.
grant select on public.conversations to authenticated;

-- messages: participants read + insert; no update/delete (immutable history).
grant select, insert on public.messages to authenticated;

grant execute on function public.is_own_listing(uuid) to anon, authenticated;
grant execute on function public.has_request_from(uuid, uuid) to anon, authenticated;
grant execute on function public.accept_donation_request(uuid) to authenticated;
grant execute on function public.reject_donation_request(uuid) to authenticated;
grant execute on function public.cancel_reservation(uuid) to authenticated;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.food_listings enable row level security;
alter table public.donation_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists profiles_read_authenticated on public.profiles;
create policy profiles_read_authenticated
  on public.profiles for select to authenticated
  using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- food_listings ----------------------------------------------------------
-- Visible: available listings (signed-out Browse), your own listings, and
-- listings you have requested (so reserved results stay visible to the NGO).
drop policy if exists listings_read_visible on public.food_listings;
create policy listings_read_visible
  on public.food_listings for select to anon, authenticated
  using (
    status = 'available'
    or provider_id = auth.uid()
    or public.has_request_from(id, auth.uid())
  );

-- Only authenticated providers may create listings, and only as themselves.
drop policy if exists listings_insert_own_provider on public.food_listings;
create policy listings_insert_own_provider
  on public.food_listings for insert to authenticated
  with check (
    provider_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'provider'
    )
  );

-- Only the owning provider may update a listing, and may not reassign it.
drop policy if exists listings_update_own on public.food_listings;
create policy listings_update_own
  on public.food_listings for update to authenticated
  using (provider_id = auth.uid())
  with check (provider_id = auth.uid());

-- donation_requests ------------------------------------------------------
-- Read: the NGO who filed it, or the provider who owns the listing.
drop policy if exists requests_read_participants on public.donation_requests;
create policy requests_read_participants
  on public.donation_requests for select to authenticated
  using (
    ngo_id = auth.uid()
    or public.is_own_listing(listing_id)
  );

-- Insert: your own request, pending, against someone else's AVAILABLE listing
-- whose deadline has not passed. Duplicate (listing, ngo) pairs are rejected
-- by the unique constraint (SQLSTATE 23505).
drop policy if exists requests_insert_own_ngo on public.donation_requests;
create policy requests_insert_own_ngo
  on public.donation_requests for insert to authenticated
  with check (
    ngo_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.food_listings l
      where l.id = listing_id
        and l.status = 'available'
        and l.deadline > now()
        and l.provider_id <> auth.uid()
    )
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ngo'
    )
  );

-- No UPDATE/DELETE policies + no grants: request state changes happen only
-- inside accept_donation_request / reject_donation_request (definer functions).

-- conversations ----------------------------------------------------------
drop policy if exists conversations_read_participants on public.conversations;
create policy conversations_read_participants
  on public.conversations for select to authenticated
  using (provider_id = auth.uid() or ngo_id = auth.uid());

-- No insert/update/delete policies: creation via get_or_create_conversation.

-- messages ---------------------------------------------------------------
drop policy if exists messages_read_participants on public.messages;
create policy messages_read_participants
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.provider_id = auth.uid() or c.ngo_id = auth.uid())
    )
  );

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.provider_id = auth.uid() or c.ngo_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for food photos, writes restricted to the
-- uploader's own folder (`{user-id}/{uuid}.{ext}`), 5 MB image limit.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-photos',
  'food-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "food photos are publicly readable" on storage.objects;
create policy "food photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'food-photos');

drop policy if exists "owners upload their own food photos" on storage.objects;
create policy "owners upload their own food photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owners delete their own food photos" on storage.objects;
create policy "owners delete their own food photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Realtime: allow future postgres_changes subscribers on messages.
-- The app currently polls, so this is forward-looking and safe either way.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object or undefined_object then
    null;
end;
$$;
