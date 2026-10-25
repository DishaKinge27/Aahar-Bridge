-- Read signup metadata from raw_user_meta_data (where supabase.auth.signUp
-- options.data is stored), not raw_app_meta_data.
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
      when new.raw_user_meta_data ->> 'role' in ('provider', 'ngo')
        then new.raw_user_meta_data ->> 'role'
      else 'provider'
    end,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'org_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill users who already registered. The role-immutability trigger
-- would block this update, so disable it for the duration.
alter table public.profiles disable trigger profiles_role_immutable;

update public.profiles p
   set role      = u.raw_user_meta_data ->> 'role',
       full_name = coalesce(p.full_name, nullif(u.raw_user_meta_data ->> 'full_name', '')),
       org_name  = coalesce(p.org_name,  nullif(u.raw_user_meta_data ->> 'org_name', '')),
       phone     = coalesce(p.phone,     nullif(u.raw_user_meta_data ->> 'phone', ''))
  from auth.users u
 where u.id = p.id
   and u.raw_user_meta_data ->> 'role' in ('provider', 'ngo');

alter table public.profiles enable trigger profiles_role_immutable;