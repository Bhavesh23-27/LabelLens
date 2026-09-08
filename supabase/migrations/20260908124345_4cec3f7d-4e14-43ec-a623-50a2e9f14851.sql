-- Ensure the owner can always become the first admin.
-- Update handle_new_user so the first registered user gets the 'admin' role in addition to 'user'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first_user boolean;
begin
  -- Profile
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;

  -- Base user role
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  -- First-admin bootstrap: if no admin exists yet, make this user an admin.
  select not exists (
    select 1 from public.user_roles where role = 'admin'
  ) into is_first_user;

  if is_first_user then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;

  return new;
end; $function$;

-- Backfill: if there are existing users but no admin, promote the earliest-created user to admin.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
END
$$;
