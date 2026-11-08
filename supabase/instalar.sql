-- Ficheiro único para colar no SQL Editor do Supabase (= 0001 + 0002). Pode correr-se mais do que uma vez.

-- Convite da Juceline — esquema inicial.
-- Segurança: RLS activo em todas as tabelas e NENHUMA política => anon/authenticated não lêem nada.
-- Só o servidor (Vercel), com a service_role key, acede aos dados.

create extension if not exists pgcrypto;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  display_name text not null check (char_length(display_name) between 1 and 120),
  full_name text,
  phone text,
  group_name text,
  seats integer not null default 1 check (seats between 1 and 10),
  notes text,
  token_hash text not null unique,
  token_enc text not null,
  status text not null default 'active' check (status in ('active', 'waitlist', 'replaced')),
  replaces_id uuid references public.guests (id) on delete set null,
  sent_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer not null default 0,
  stage1 text check (stage1 in ('yes', 'no')),
  stage1_at timestamptz,
  stage2 text check (stage2 in ('confirmed', 'declined')),
  stage2_at timestamptz,
  attending integer not null default 0 check (attending between 0 and 10),
  message text check (char_length(message) <= 600),
  message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_settings (
  id integer primary key default 1 check (id = 1),
  event_time text,
  venue_name text,
  address text,
  lat double precision,
  lng double precision,
  capacity integer,
  final_open boolean not null default false,
  final_deadline date,
  dress_code boolean not null default true,
  dress_code_note text,
  updated_at timestamptz not null default now()
);

insert into public.event_settings (id, dress_code_note)
values (1, 'Da baunilha ao espresso, qualquer tom serve.')
on conflict (id) do nothing;

create table if not exists public.rsvp_log (
  id bigserial primary key,
  guest_id uuid not null references public.guests (id) on delete cascade,
  action text not null,
  value text,
  at timestamptz not null default now()
);

create index if not exists rsvp_log_guest_idx on public.rsvp_log (guest_id);

alter table public.guests enable row level security;
alter table public.event_settings enable row level security;
alter table public.rsvp_log enable row level security;

revoke all on public.guests, public.event_settings, public.rsvp_log from anon, authenticated;
revoke all on sequence public.rsvp_log_id_seq from anon, authenticated;

-- Convite único: dispositivos que abriram o convite e entrada registada à porta.
alter table public.guests add column if not exists devices text[] not null default '{}';
alter table public.guests add column if not exists checked_in_at timestamptz;
alter table public.guests add column if not exists checked_in_people integer not null default 0 check (checked_in_people between 0 and 10);
