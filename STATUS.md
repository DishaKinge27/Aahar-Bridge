# Aahar Bridge — Build Status

Progress log. Last updated: final verification pass.

## Milestone 1 — Frontend foundation ✅

- [x] UI reference analyzed; design system defined (primary green `#16a34a`, hero `#166534`, Inter, rounded-2xl cards, pill login button, tinted chips)
- [x] Vite + React 18 + TypeScript 5.7 + Tailwind 3.4 scaffold; all dependencies installed and verified
- [x] Strict `tsconfig` (strict, noUnusedLocals/Parameters), Vitest configured with env-stubbing setup
- [x] `translations.ts` — English + Marathi with compile-time key parity
- [x] Domain types mirroring the SQL schema, validators, formatters, error mapping, `cn`
- [x] Supabase client (anon key only, lazy, graceful "not configured" mode)
- [x] Contexts: Theme (light/dark), Language (EN/MR), Auth (session + profile)
- [x] 15 reusable UI components
- [x] Navbar (reference layout) + Footer + Layout shell (skip link, mobile menu, user menu)
- [x] API layer: listings (+storage upload), requests (+accept/reject RPCs), conversations (+get-or-create RPC), profiles
- [x] ListingCard + ListingImage per reference browse grid

## Milestone 2 — Pages ✅

- [x] Home (hero, mission per reference, how-it-works, provider/NGO panels, CTA, footer)
- [x] Login (validation, password toggle, setup notice, redirect-with-intent, error alerts)
- [x] Register (role cards, `?role=` deep links, role-aware org/phone fields, confirmation flow)
- [x] PostFood (reference green-header card; title/quantity/diet/photo/address/deadline/details; storage upload + insert; success/error/loading)
- [x] Browse (search + diet filter, skeletons, empty, error+retry, reference card grid, status/diet badges, Chat/Call/Manage actions)
- [x] DonationDetails (photo, meta, provider info + tel: call, NGO request form, request status)
- [x] Messages (split-pane per reference: search, previews + relative time, bubbles + timestamps, presence online/offline, tel: call, send, polling)
- [x] Provider dashboard (stats, incoming requests with Accept/Reject/Chat, listing management actions)
- [x] NGO dashboard (stats, my requests + chat, available now, recent activity)
- [x] Profile & Settings (account, org details form, language + theme preferences, logout)
- [x] NotFound + App.tsx routing (protected + role routes) + main.tsx entry

## Milestone 3 — Database ✅

- [x] `supabase/migrations/0001_initial_schema.sql` — 5 tables, constraints, indexes, triggers (signup→profile, updated_at, role immutability, conversation touch), helper predicates, 4 SECURITY DEFINER RPCs (accept/reject/cancel/conversation)
- [x] `supabase/migrations/0002_row_level_security.sql` — least-privilege grants, RLS policies, `food-photos` bucket + policies, realtime publication
- [x] `supabase/seed_demo.sql` — optional demo data on fixed UUIDs (idempotent, re-runnable, never production)
- [x] README.md with setup, Supabase configuration, scripts, security overview
- [x] .env.example with placeholders

## Milestone 4 — Verification ✅

- [x] `npm run typecheck` — exit 0
- [x] `npm test` — 43/43 passed (validators, formatters, translation parity, route smoke tests)
- [x] `npm run build` — exit 0 (production bundle built)
- [x] Browser verification (dev server, 1280px + 390px):
  - Home renders fully in light **and** dark mode (no blank page)
  - Nav links, active states, theme toggle, EN↔मराठी toggle (whole UI + `document.lang`)
  - Browse: single-line heading (fixed `w-full` toolbar bug), search + diet filter, error state with retry
  - Login: required-field errors, password visibility toggle (input type flips), failed submit → network error alert
  - Register: role cards, `?role=ngo` preselect, role-aware hints, full Marathi rendering
  - Protected route: `/post` → `/login` when signed out
  - 404 page; mobile hamburger menu with links + auth buttons
  - Console: no JS errors (only expected `ERR_CONNECTION_REFUSED` from the placeholder Supabase URL)

## Known issues / limitations

- Live end-to-end flows (sign-up, requests, accept/reject, messaging) require a real Supabase
  project with the migrations applied — not verifiable in this environment (no local
  Postgres/Docker, no credentials). SQL was written for Supabase's standard `auth`/`storage`
  schemas but has not been executed here.
- Production bundle is ~542 kB minified (React + supabase-js); only a Rollup chunk-size
  warning, not an error. Route-level code splitting would trim it if desired.
- Provider phone is snapshotted onto listings at creation time (so signed-out Browse can show
  "Call Provider" like the reference); editing the profile phone afterwards does not update
  existing listings.
- Messages update via polling (8s conversations/messages) + Realtime presence for the
  online indicator; no realtime message streaming (messages table is added to the realtime
  publication for future use).
