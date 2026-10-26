-- A tiny, data-free function that the daily GitHub Action calls (.github/workflows/supabase-keepalive.yml),
-- so the free-plan project never pauses for inactivity. It only returns the server time.
create or replace function public.keepalive()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$ select now() $$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon;
