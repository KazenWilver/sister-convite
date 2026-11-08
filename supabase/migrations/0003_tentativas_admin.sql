-- Tentativas erradas de entrar no painel (bloqueio global, não depende do servidor que responde).
create table if not exists public.admin_login_fails (
  id bigserial primary key,
  at timestamptz not null default now()
);

create index if not exists admin_login_fails_at_idx on public.admin_login_fails (at);

alter table public.admin_login_fails enable row level security;
revoke all on public.admin_login_fails from anon, authenticated;
revoke all on sequence public.admin_login_fails_id_seq from anon, authenticated;
