-- ============================================================================
-- Aahar Bridge — DEMO SEED (OPTIONAL — NOT FOR PRODUCTION)
--
-- Creates three demo accounts, three listings, one pending request and one
-- conversation with sample messages matching the UI reference.
--
--   provider@demo.aahar.local  / DemoProvider123!   (Hotel Grand Palace)
--   mess@demo.aahar.local      / DemoMess123!       (Engineering College Mess)
--   ngo@demo.aahar.local       / DemoNgo123!        (Sahyog Foundation NGO)
--
-- DEMO PASSWORDS ARE PUBLIC BY DESIGN. Never seed real user data this way.
--
-- Safe to re-run: previous demo rows (identified by the fixed UUIDs below)
-- are deleted first; all other data is untouched. Runs in the Supabase SQL
-- editor or via `supabase db reset`.
-- ============================================================================

create extension if not exists pgcrypto;

-- Fixed demo UUIDs -----------------------------------------------------------
--   provider = aaaaaaaaaaaa-...  mess = bbbbbbbbbbbb-...  ngo = cccccccccccc-...

-- Clean previous demo run (cascades to profiles/listings/requests/messages) --
delete from auth.users
 where id in (
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
 );

-- Demo auth users (the handle_new_user trigger creates their profiles) -------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated',
    'provider@demo.aahar.local',
    crypt('DemoProvider123!', gen_salt('bf')),
    now(),
    '{"provider":"email"}'::jsonb,
    '{"role":"provider","full_name":"Ravi Patil","org_name":"Hotel Grand Palace","phone":"+91 90000 00001"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated',
    'mess@demo.aahar.local',
    crypt('DemoMess123!', gen_salt('bf')),
    now(),
    '{"provider":"email"}'::jsonb,
    '{"role":"provider","full_name":"Anita Deshmukh","org_name":"Engineering College Mess","phone":"+91 90000 00002"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated', 'authenticated',
    'ngo@demo.aahar.local',
    crypt('DemoNgo123!', gen_salt('bf')),
    now(),
    '{"provider":"email"}'::jsonb,
    '{"role":"ngo","full_name":"Sunita Rao","org_name":"Sahyog Foundation","phone":"+91 90000 00003"}'::jsonb,
    now(), now()
  );

-- Demo listings --------------------------------------------------------------
insert into public.food_listings (
  id, provider_id, provider_name, provider_phone, title, quantity, diet_type,
  image_url, address, deadline, details, status
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Engineering College Mess', '+91 90000 00002',
    'Dal, Rice & Chapati', 40, 'vegetarian',
'https://www.shutterstock.com/shutterstock/photos/1599437662/display_1500/stock-photo-indian-village-food-dal-chapati-rice-healthy-food-for-human-1599437662.jpg',
'North Campus, University Road, Pune',
    now() + interval '3 hours',
    'Freshly prepared in the college mess kitchen. Packed hot in clean steel boxes; contains wheat and pulses.',
    'available'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Hotel Grand Palace', '+91 90000 00001',
    'Assorted Buffet', 60, 'mixed',
'https://thumbs.dreamstime.com/b/feast-array-captivating-view-assorted-dishes-buffet-generative-ai-feast-array-captivating-view-assorted-dishes-304800132.jpg',
'Downtown, MG Road, Pune',
    now() + interval '4 hours',
    'Leftover banquet spread — biryani, tandoori items, salads and desserts. Collect from the service gate.',
    'available'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Hotel Grand Palace', '+91 90000 00001',
    'Fresh Rotis & Sabzi', 25, 'vegetarian',
'https://i.pinimg.com/736x/fa/57/15/fa571553e0dd615c7861fd4b54efbc80.jpg',
'Downtown, MG Road, Pune',

    now() + interval '2 hours',
    'Evening kitchen surplus, packed and labelled. Vegetarian only.',
    'available'
  )
on conflict (id) do nothing;

-- Demo pending request + conversation + messages -----------------------------
insert into public.donation_requests (id, listing_id, ngo_id, message, status)
values (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'We can collect this with our van before the deadline.',
  'pending'
)
on conflict (listing_id, ngo_id) do nothing;

insert into public.conversations (id, listing_id, provider_id, ngo_id, last_message_at)
values (
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  now()
)
on conflict (id) do nothing;

insert into public.messages (id, conversation_id, sender_id, body, created_at)
values
  (
    '66666666-6666-4666-8666-666666666661',
    '55555555-5555-4555-8555-555555555555',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Hello! We saw you are interested in claiming the 40 servings of Dal and Rice.',
    now() - interval '10 minutes'
  ),
  (
    '66666666-6666-4666-8666-666666666662',
    '55555555-5555-4555-8555-555555555555',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Yes, our NGO van is in the North Campus area right now. When is the earliest we can come?',
    now() - interval '8 minutes'
  ),
  (
    '66666666-6666-4666-8666-666666666663',
    '55555555-5555-4555-8555-555555555555',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'I can have it securely packed and ready by 3 PM at Gate no. 2.',
    now() - interval '7 minutes'
  )
on conflict (id) do nothing;
