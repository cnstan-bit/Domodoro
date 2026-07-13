create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Focus member' check (char_length(display_name) between 1 and 32),
  created_at timestamptz not null default now()
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 48),
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.squad_members (
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id),
  unique (user_id)
);

create table if not exists public.daily_summaries (
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  timezone text not null default 'UTC',
  focus_minutes integer not null default 0 check (focus_minutes between 0 and 1440),
  focus_sessions integer not null default 0 check (focus_sessions between 0 and 48),
  break_minutes integer not null default 0 check (break_minutes between 0 and 1440),
  breaks_completed integer not null default 0 check (breaks_completed between 0 and 48),
  bypass_count integer not null default 0 check (bypass_count between 0 and 48),
  balance_score integer not null default 0 check (balance_score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table if not exists public.kudos (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('steady', 'recovered', 'returned')),
  created_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'user_name', ''), split_part(new.email, '@', 1), 'Focus member'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile_for_new_user();

create or replace function public.create_squad(squad_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if exists (select 1 from squad_members where user_id = auth.uid()) then raise exception 'Already in a squad'; end if;
  insert into squads (name, owner_id) values (squad_name, auth.uid()) returning id into new_id;
  insert into squad_members (squad_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create or replace function public.join_squad(invite_code_input text)
returns uuid language plpgsql security definer set search_path = public as $$
declare target_id uuid;
begin
  if exists (select 1 from squad_members where user_id = auth.uid()) then raise exception 'Already in a squad'; end if;
  select id into target_id from squads where invite_code = upper(invite_code_input);
  if target_id is null then raise exception 'Invalid invite code'; end if;
  if (select count(*) from squad_members where squad_id = target_id) >= 12 then raise exception 'Squad is full'; end if;
  insert into squad_members (squad_id, user_id) values (target_id, auth.uid());
  return target_id;
end;
$$;

create or replace view public.squad_weekly_leaderboard with (security_invoker = true) as
select sm.squad_id, p.id as user_id, p.display_name,
  coalesce(sum(best.balance_score), 0)::integer as weekly_score
from squad_members sm
join profiles p on p.id = sm.user_id
left join lateral (
  select balance_score from daily_summaries d
  where d.user_id = sm.user_id and d.local_date >= current_date - 6
  order by balance_score desc limit 5
) best on true
group by sm.squad_id, p.id, p.display_name;

alter table profiles enable row level security;
alter table squads enable row level security;
alter table squad_members enable row level security;
alter table daily_summaries enable row level security;
alter table kudos enable row level security;

create or replace function public.is_squad_member(target_squad uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from squad_members where squad_id = target_squad and user_id = auth.uid());
$$;

create or replace function public.shares_squad(target_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from squad_members mine join squad_members peer on peer.squad_id = mine.squad_id
    where mine.user_id = auth.uid() and peer.user_id = target_user
  );
$$;

create policy "profiles visible to squad peers" on profiles for select using (
  id = auth.uid() or shares_squad(id)
);
create policy "users update own profile" on profiles for update using (id = auth.uid());
create policy "members read own squad" on squads for select using (is_squad_member(id));
create policy "members read memberships" on squad_members for select using (is_squad_member(squad_id));
create policy "users read squad summaries" on daily_summaries for select using (
  user_id = auth.uid() or shares_squad(user_id)
);
create policy "users write own summaries" on daily_summaries for insert with check (user_id = auth.uid());
create policy "users update own summaries" on daily_summaries for update using (user_id = auth.uid());
create policy "members read squad kudos" on kudos for select using (is_squad_member(squad_id));
create policy "members send preset kudos" on kudos for insert with check (from_user_id = auth.uid() and is_squad_member(squad_id) and shares_squad(to_user_id));

grant execute on function public.create_squad(text) to authenticated;
grant execute on function public.join_squad(text) to authenticated;
grant execute on function public.is_squad_member(uuid) to authenticated;
grant execute on function public.shares_squad(uuid) to authenticated;
