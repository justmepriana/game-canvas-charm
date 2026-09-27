REVOKE UPDATE ON TABLE public.player_profiles FROM authenticated;
GRANT UPDATE (callsign) ON TABLE public.player_profiles TO authenticated;