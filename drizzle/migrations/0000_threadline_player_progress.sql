CREATE TABLE public.player_profiles (
  user_id uuid PRIMARY KEY,
  callsign text NOT NULL DEFAULT 'Cyberdreamer',
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.player_profiles TO authenticated;
GRANT ALL ON public.player_profiles TO service_role;
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can read their own profile" ON public.player_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Players can update their own callsign" ON public.player_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id smallint NOT NULL CHECK (mission_id BETWEEN 1 AND 4),
  xp_awarded integer NOT NULL CHECK (xp_awarded IN (50, 75, 100, 150)),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);
GRANT SELECT ON public.mission_completions TO authenticated;
GRANT ALL ON public.mission_completions TO service_role;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can read their own mission completions" ON public.mission_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_player_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_profiles (user_id, callsign)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(left(NEW.raw_user_meta_data ->> 'callsign', 24), ''), 'Cyberdreamer')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_player_profile() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_threadline
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_player_profile();

CREATE OR REPLACE FUNCTION public.complete_threadline_mission(_mission_id smallint)
RETURNS TABLE (newly_completed boolean, total_xp integer, completed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  awarded_xp integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to save mission progress';
  END IF;

  awarded_xp := CASE _mission_id
    WHEN 1 THEN 50
    WHEN 2 THEN 75
    WHEN 3 THEN 100
    WHEN 4 THEN 150
    ELSE NULL
  END;
  IF awarded_xp IS NULL THEN
    RAISE EXCEPTION 'Unknown mission';
  END IF;

  INSERT INTO public.player_profiles (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.mission_completions (user_id, mission_id, xp_awarded)
  VALUES (current_user_id, _mission_id, awarded_xp)
  ON CONFLICT (user_id, mission_id) DO NOTHING;

  newly_completed := FOUND;
  IF newly_completed THEN
    UPDATE public.player_profiles
    SET total_xp = total_xp + awarded_xp, updated_at = now()
    WHERE user_id = current_user_id;
  END IF;

  SELECT p.total_xp, (SELECT count(*)::integer FROM public.mission_completions c WHERE c.user_id = current_user_id)
  INTO total_xp, completed_count
  FROM public.player_profiles p
  WHERE p.user_id = current_user_id;

  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_threadline_mission(smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_threadline_mission(smallint) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_profiles (user_id, callsign)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(left(NEW.raw_user_meta_data ->> 'callsign', 24), ''), 'Cyberdreamer')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_threadline_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();