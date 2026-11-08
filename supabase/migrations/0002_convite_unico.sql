-- Convite único: dispositivos que abriram o convite e entrada registada à porta.
alter table public.guests add column if not exists devices text[] not null default '{}';
alter table public.guests add column if not exists checked_in_at timestamptz;
alter table public.guests add column if not exists checked_in_people integer not null default 0 check (checked_in_people between 0 and 10);
