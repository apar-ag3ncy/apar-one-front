-- Private inbox for client feedback. Only the server's Supabase secret key can
-- write or read these rows and objects; no anonymous storage policies exist.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-voice-feedback', 'client-voice-feedback', false, 4194304,
        array['audio/webm', 'audio/mp4', 'audio/ogg'])
on conflict (id) do update set public = false, file_size_limit = 4194304,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.client_voice_feedback (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 80),
  brand text check (brand is null or char_length(brand) <= 80),
  duration_seconds numeric(5, 2) not null check (duration_seconds between 1 and 60),
  mime_type text not null check (mime_type in ('audio/webm', 'audio/mp4', 'audio/ogg')),
  storage_path text not null unique,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz not null default now()
);
alter table public.client_voice_feedback enable row level security;
revoke all on public.client_voice_feedback from anon, authenticated;
grant select, insert, update, delete on public.client_voice_feedback to service_role;

create table if not exists public.client_voice_feedback_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists client_voice_feedback_attempts_lookup
  on public.client_voice_feedback_attempts (ip_hash, created_at desc);
alter table public.client_voice_feedback_attempts enable row level security;
revoke all on public.client_voice_feedback_attempts from anon, authenticated;
grant select, insert, delete on public.client_voice_feedback_attempts to service_role;

create or replace function public.reserve_voice_feedback_submission(p_ip_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_ip_hash is null or char_length(p_ip_hash) <> 64 then return false; end if;
  perform pg_advisory_xact_lock(hashtext(p_ip_hash));
  if (select count(*) from public.client_voice_feedback_attempts
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 3 then
    return false;
  end if;
  insert into public.client_voice_feedback_attempts (ip_hash) values (p_ip_hash);
  return true;
end;
$$;
revoke all on function public.reserve_voice_feedback_submission(text) from public, anon, authenticated;
grant execute on function public.reserve_voice_feedback_submission(text) to service_role;
