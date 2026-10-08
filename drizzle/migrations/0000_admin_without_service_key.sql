create policy scans_admin_read on public.product_scans for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy scans_admin_delete on public.product_scans for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy analyses_admin_read on public.analysis_results for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy analyses_admin_delete on public.analysis_results for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy profiles_admin_read on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.admin_find_user_by_email(_email text)
returns uuid language plpgsql stable security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select id into uid from auth.users where lower(email) = lower(_email) limit 1;
  return uid;
end $$;
revoke all on function public.admin_find_user_by_email(text) from public, anon;
grant execute on function public.admin_find_user_by_email(text) to authenticated;

create or replace function public.queue_unknown_ingredient(_name text)
returns void language plpgsql security definer set search_path = public as $$
declare n text := left(lower(trim(_name)),120);
begin
  if n is null or length(n) < 2 then return; end if;
  update public.unknown_ingredients set occurrences = occurrences + 1, last_seen_at = now() where raw_name = n;
  if not found then insert into public.unknown_ingredients(raw_name) values (n); end if;
end $$;
revoke all on function public.queue_unknown_ingredient(text) from public;
grant execute on function public.queue_unknown_ingredient(text) to anon, authenticated;