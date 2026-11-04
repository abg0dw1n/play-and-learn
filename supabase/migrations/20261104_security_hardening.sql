-- Security hardening for the worksheets service.
-- 1) The edge function is the only thing that touches these tables (via the service role), so the public
--    API roles get no table privileges at all (RLS already denies them; this is defense in depth).
revoke all on table public.settings, public.worksheets, public.worksheet_pages from anon, authenticated;

-- 2) Atomic passcode-attempt counter. Row-locks `lock_until`, so a burst of parallel guesses can't slip
--    past the lock-out. Returns false while locked; otherwise it counts the attempt and may start a lock.
create or replace function public.take_attempt(p_now bigint, p_max int, p_lock_ms bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock bigint;
  v_count int;
begin
  insert into settings(key, value) values ('lock_until', '0') on conflict (key) do nothing;
  insert into settings(key, value) values ('fail_count', '0') on conflict (key) do nothing;
  select value::bigint into v_lock from settings where key = 'lock_until' for update;
  if v_lock > p_now then return false; end if;
  update settings set value = (value::int + 1)::text where key = 'fail_count' returning value::int into v_count;
  if v_count >= p_max then
    update settings set value = (p_now + p_lock_ms)::text where key = 'lock_until';
    update settings set value = '0' where key = 'fail_count';
  end if;
  return true;
end;
$$;
revoke all on function public.take_attempt(bigint, int, bigint) from public, anon, authenticated;
grant execute on function public.take_attempt(bigint, int, bigint) to service_role;
