# Aahar Bridge

A modern, responsive food-donation platform that connects **food providers** (restaurants,
hotels, caterers, event organizers, individuals) with **NGOs** that collect and distribute
surplus food to people in need — reducing food waste and making surplus-food donation
simple, transparent, and accessible.

Built to match the supplied UI reference: white sticky navbar with the green leaf wordmark,
deep-green hero, green-header form cards, two-column browse grid, and a split-pane messenger —
in light **and** dark mode, in **English and Marathi**.

---

## Tech stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 18, TypeScript (strict), Vite 5                  |
| Styling   | Tailwind CSS 3.4                                       |
| Routing   | React Router 6 (protected + role-based routes)         |
| Backend   | Supabase — Auth, PostgreSQL, Storage, RPCs             |
| Icons     | lucide-react                                           |
| Testing   | Vitest + Testing Library (43 tests)                    |

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    → fill in your Supabase project URL and anon key

# 3. Run the dev server
npm run dev
```

The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` through Vite's environment
configuration. **Never** put the service-role key in this project — the frontend only ever
uses the public anon key, and all access is guarded by Row Level Security.

If the variables are missing or are still the placeholders, every Supabase-backed page shows
a clear "Connect Supabase to go live" notice instead of failing silently.

---

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server             |
| `npm run typecheck` | `tsc --noEmit` (strict)               |
| `npm test`          | Run the Vitest suite once             |
| `npm run build`     | Typecheck + production build          |
| `npm run preview`   | Serve the production build            |

---

## Configuring Supabase

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the migrations** in order, in the SQL Editor (or with `supabase db push`):
   - [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
     — tables, constraints, indexes, triggers, SECURITY DEFINER RPC functions
   - [`supabase/migrations/0002_row_level_security.sql`](supabase/migrations/0002_row_level_security.sql)
     — least-privilege grants, RLS policies, the `food-photos` storage bucket and its
     policies, realtime publication

   The `food-photos` storage bucket is created by migration 0002 — no manual setup needed.

3. **(Optional) Seed demo data** by running
   [`supabase/seed_demo.sql`](supabase/seed_demo.sql). It is clearly separated from
   production data, only touches its own fixed UUIDs, and is safe to re-run.
   Demo accounts (passwords are public by design):

   | Role     | Email                     | Password         |
   | -------- | ------------------------- | ---------------- |
   | Provider | `provider@demo.aahar.local` | `DemoProvider123!` |
   | Provider | `mess@demo.aahar.local`     | `DemoMess123!`     |
   | NGO      | `ngo@demo.aahar.local`      | `DemoNgo123!`      |

4. **Auth settings**: Authentication → Providers → Email. For the fastest local loop you can
   disable *Confirm email*; if you leave it on, registration shows a "check your email"
   confirmation step before sign-in (the UI handles both flows).

5. **Environment**: Project Settings → API → copy the Project URL and `anon public` key
   into your `.env` file.

---

## Feature overview

**Both roles**

- Email/password registration and login via Supabase Auth, with role selection
  (Food Provider / NGO), validation, password visibility toggle, and understandable errors
- Protected routes + role-based routes (`/post` is provider-only), logout everywhere
- Light/dark theme toggle (persisted) and English/Marathi language toggle (persisted to profile)
- Profile & settings: account info, organization details, language/theme preferences, logout

**Food provider**

- Post surplus food: title, servings, diet type (veg/non-veg/mixed), photograph upload to
  Supabase Storage, pickup address, collection deadline, additional details — validated
  before submission, with loading/success/failure states
- Dashboard: total/available listings, pending/accepted request stats, incoming requests
  with **Accept / Reject**, chat with requesters, and listing management
  (mark unavailable, make available, mark collected, cancel reservation)
- Own-listings view with status badges (Available / Reserved / Completed / Unavailable / Deadline passed)

**NGO**

- Browse donations: photo cards with diet + status badges, provider, servings, location,
  collection deadline, search + diet filter, loading skeletons, empty and error states
- Donation detail page with provider information, phone call action, and a request form
- One request per listing (DB unique constraint), status tracking (pending/accepted/rejected)
- Dashboard: available donations, submitted/accepted request stats, request history,
  recent activity, and chat with providers
- Messenger: chat list with previews and relative timestamps, message bubbles with times,
  real online/offline presence (Supabase Realtime presence), tel: call action

---

## Database & security

Tables: `profiles`, `food_listings`, `donation_requests`, `conversations`, `messages`
(UUID PKs, foreign keys, CHECK constraints, timestamps, and indexes on every hot path).

- **RLS everywhere.** Listings are readable when available, owned, or requested by you;
  profile writes are restricted to your own row (role is immutable via trigger);
  requests are readable only by their NGO and the listing's provider; conversations and
  messages only by their participants; public reads of listings work signed-out (matching
  the reference UI) while writes always require auth.
- **No client-side request mutation.** `donation_requests` has no UPDATE grant or policy —
  status only changes inside `accept_donation_request` / `reject_donation_request`
  (`SECURITY DEFINER`, row-locked). Accepting atomically reserves the listing and rejects
  competing pending claims, so conflicting claims are impossible.
- **Duplicate requests blocked** by `unique (listing_id, ngo_id)` plus insert-policy checks
  (available, not owned, deadline in the future, NGO role).
- **Ownership on listings**: inserts must target your own `provider_id` as a provider;
  updates are limited to the owning provider and cannot reassign `provider_id`.
- **Storage**: `food-photos` bucket, public read, writes restricted to the uploader's own
  `{user-id}/` folder, 5 MB image cap with a MIME allow-list.
- Policy cross-checks use `SECURITY DEFINER` helper predicates (`is_own_listing`,
  `has_request_from`) to avoid Postgres policy recursion.

---

## Project structure

```
src/
  components/
    layout/        Navbar, Footer, Layout (app shell)
    dashboard/     ProviderDashboard, NgoDashboard
    listings/      ListingCard, ListingImage
    ui/            Button, Field, Input, Select, Textarea, Alert, Badge, Card,
                   Spinner, Skeleton, EmptyState, Modal, Avatar, StatCard, SetupNotice
  context/         AuthContext, ThemeContext, LanguageContext
  lib/
    supabase.ts    Anon-key client (lazy, config-aware)
    api/           listings, requests, conversations, profiles
  pages/           Home, Login, Register, PostFood, Browse, DonationDetails,
                   Messages, Dashboard, Profile, NotFound
  types/           Domain types mirroring the SQL schema
  utils/           validators, format, errors, cn
  translations.ts  English + Marathi (compile-time key parity)
  App.tsx          Route table (protected + role routes)
  main.tsx         Providers entry
supabase/
  migrations/      0001_initial_schema.sql, 0002_row_level_security.sql
  seed_demo.sql    Optional demo data (never production)
```

---

## Checks actually run

```bash
npm run typecheck   # tsc --noEmit — passes
npm test            # 43/43 tests pass (validators, formatters, translations, route smoke)
npm run build       # typecheck + vite build — passes
```

> Live end-to-end flows (sign-in, requests, messaging against a real backend) require your
> own Supabase project with the migrations applied — see *Configuring Supabase* above.
