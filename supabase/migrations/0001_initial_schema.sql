-- ============================================================================
-- Aahar Bridge — 0001 initial schema
-- Tables, constraints, indexes, triggers, and SECURITY DEFINER RPC functions.
-- RLS/grants live in 0002_row_level_security.sql
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row (created by trigger, see below)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('provider', 'ngo')),
  full_name   text,
  org_name    text,
  phone       text,
  address     text,
  language    text not null default 'en' check (language in ('en', 'mr')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- food_listings: provider surplus-food listings
-- provider_name / provider_phone are snapshots so signed-out Browse (per the
-- reference UI) can show the provider and offer "Call Provider".
-- ---------------------------------------------------------------------------
create table public.food_listings (
  id             uuid primary key default gen_random_uuid(),
  provider_id    uuid not null references public.profiles (id) on delete cascade,
  provider_name  text not null check (char_length(provider_name) between 1 and 160),
  provider_phone text,
  title          text not null check (char_length(title) between 3 and 160),
  quantity       integer not null check (quantity >= 1 and quantity <= 100000),
  diet_type      text not null check (diet_type in ('vegetarian', 'non_vegetarian', 'mixed')),
  image_url      text,
  address        text not null check (char_length(address) >= 5),
  deadline       timestamptz not null,
  details        text check (details is null or char_length(details) <= 1000),
  status         text not null default 'available'
                 check (status in ('available', 'reserved', 'completed', 'cancelled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint deadline_after_creation check (deadline > created_at)
);

-- ---------------------------------------------------------------------------
-- donation_requests: one NGO request per listing (DB-level duplicate guard)
-- ---------------------------------------------------------------------------
create table public.donation_requests (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.food_listings (id) on delete cascade,
  ngo_id       uuid not null references public.profiles (id) on delete cascade,
  message      text check (message is null or char_length(message) <= 2000),
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint one_request_per_ngo unique (listing_id, ngo_id)
);

-- ---------------------------------------------------------------------------
-- conversations + messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.food_listings (id) on delete cascade,
  provider_id     uuid not null references public.profiles (id) on delete cascade,
  ngo_id          uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint one_conversation_per_pair unique (listing_id, ngo_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the hot query paths
-- ---------------------------------------------------------------------------
create index food_listings_provider_idx on public.food_listings (provider_id);
create index food_listings_status_created_idx on public.food_listings (status, created_at desc);
create index donation_requests_listing_idx on public.donation_requests (listing_id, created_at desc);
create index donation_requests_ngo_idx on public.donation_requests (ngo_id, created_at desc);
create index conversations_provider_idx on public.conversations (provider_id);
create index conversations_ngo_idx on public.conversations (ngo_id);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at maintenance + role immutability
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger food_listings_set_updated_at
  before update on public.food_listings
  for each row execute function public.set_updated_at();

create or replace function public.profiles_prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Account role cannot be changed after registration';
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable
  before update on public.profiles
  for each row execute function public.profiles_prevent_role_change();

-- ---------------------------------------------------------------------------
-- New auth user -> profile (reads role/name/phone from signup metadata)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, org_name, phone)
  values (
    new.id,
    case
      when new.raw_app_meta_data ->> 'role' in ('provider', 'ngo')
        then new.raw_app_meta_data ->> 'role'
      else 'provider'
    end,
    nullif(new.raw_app_meta_data ->> 'full_name', ''),
    nullif(new.raw_app_meta_data ->> 'org_name', ''),
    nullif(new.raw_app_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep conversations.last_message_at fresh (definer bypasses messages RLS)
-- ---------------------------------------------------------------------------
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- RLS-safe helper predicates (SECURITY DEFINER so policies never cross-evaluate
-- each other's row policies — avoids Postgres policy recursion).
-- ---------------------------------------------------------------------------
create or replace function public.is_own_listing(p_listing_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.food_listings
    where id = p_listing_id and provider_id = auth.uid()
  );
$$;

create or replace function public.has_request_from(p_listing_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.donation_requests
    where listing_id = p_listing_id and ngo_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: accept a request atomically (locks listing, prevents conflicting claims)
-- ---------------------------------------------------------------------------
create or replace function public.accept_donation_request(p_request_id uuid)
returns public.donation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.donation_requests;
  v_listing public.food_listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.donation_requests
   where id = p_request_id
     for update;
  if not found then
    raise exception 'Request not found';
  end if;

  select * into v_listing
    from public.food_listings
   where id = v_request.listing_id
     for update;
  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.provider_id <> auth.uid() then
    raise exception 'Only the listing owner can respond to requests';
  end if;

  if v_listing.status <> 'available' or v_listing.deadline <= now() then
    raise exception 'This donation is no longer available';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request has already been resolved';
  end if;

  update public.food_listings
     set status = 'reserved'
   where id = v_listing.id;

  update public.donation_requests
     set status = 'accepted', responded_at = now()
   where id = v_request.id
  returning * into v_request;

  -- Any other pending claims are superseded in the same transaction.
  update public.donation_requests
     set status = 'rejected', responded_at = now()
   where listing_id = v_listing.id
     and id <> v_request.id
     and status = 'pending';

  return v_request;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: reject a request (owner-only, pending-only)
-- ---------------------------------------------------------------------------
create or replace function public.reject_donation_request(p_request_id uuid)
returns public.donation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.donation_requests;
  v_listing public.food_listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.donation_requests
   where id = p_request_id
     for update;
  if not found then
    raise exception 'Request not found';
  end if;

  select * into v_listing
    from public.food_listings
   where id = v_request.listing_id;
  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.provider_id <> auth.uid() then
    raise exception 'Only the listing owner can respond to requests';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request has already been resolved';
  end if;

  update public.donation_requests
     set status = 'rejected', responded_at = now()
   where id = v_request.id
  returning * into v_request;

  return v_request;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: cancel a reservation and release the listing (accepted request reset)
-- ---------------------------------------------------------------------------
create or replace function public.cancel_reservation(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.food_listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_listing
    from public.food_listings
   where id = p_listing_id
     for update;
  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.provider_id <> auth.uid() then
    raise exception 'Only the listing owner can manage this listing';
  end if;

  if v_listing.status <> 'reserved' then
    raise exception 'Only reserved listings can be cancelled';
  end if;

  update public.food_listings
     set status = 'available'
   where id = p_listing_id;

  update public.donation_requests
     set status = 'rejected', responded_at = now()
   where listing_id = p_listing_id
     and status = 'accepted';
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: open or fetch the conversation for a listing
-- NGO callers become the ngo side; provider callers must have an NGO request.
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_conversation(p_listing_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.food_listings;
  v_ngo     uuid;
  v_conv    public.conversations;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_listing
    from public.food_listings
   where id = p_listing_id;
  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.provider_id = auth.uid() then
    select ngo_id into v_ngo
      from public.donation_requests
     where listing_id = p_listing_id
     order by created_at desc
     limit 1;
    if v_ngo is null then
      raise exception 'No NGO has requested this listing yet';
    end if;
  else
    if not exists (
      select 1 from public.profiles where id = auth.uid() and role = 'ngo'
    ) then
      raise exception 'Only NGOs can start conversations on listings they do not own';
    end if;
    v_ngo := auth.uid();
  end if;

  select * into v_conv
    from public.conversations
   where listing_id = p_listing_id
     and provider_id = v_listing.provider_id
     and ngo_id = v_ngo;
  if found then
    return v_conv;
  end if;

  insert into public.conversations (listing_id, provider_id, ngo_id)
  values (p_listing_id, v_listing.provider_id, v_ngo)
  returning * into v_conv;

  return v_conv;
end;
$$;
