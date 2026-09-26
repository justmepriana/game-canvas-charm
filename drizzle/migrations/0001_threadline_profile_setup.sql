DROP TRIGGER on_auth_user_created_threadline ON auth.users;
DROP FUNCTION public.create_player_profile();

CREATE OR REPLACE FUNCTION public.get_or_create_threadline_profile()
RETURNS SETOF public.player_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to load your player profile';
  END IF;

  INSERT INTO public.player_profiles (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
  SELECT p.* FROM public.player_profiles p WHERE p.user_id = current_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.get_or_create_threadline_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_threadline_profile() TO authenticated, service_role;