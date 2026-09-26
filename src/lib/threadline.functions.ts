import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getPlayerProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profiles, error: profileError }, { data: completions, error: completionError }] =
      await Promise.all([
        context.supabase.rpc("get_or_create_threadline_profile"),
        context.supabase
          .from("mission_completions")
          .select("mission_id, completed_at")
          .eq("user_id", context.userId)
          .order("completed_at", { ascending: false }),
      ]);

    if (profileError) throw new Error("Could not load player profile");
    if (completionError) throw new Error("Could not load mission progress");

    const profile = profiles?.[0];
    return {
      callsign: profile?.callsign ?? "Cyberdreamer",
      totalXp: profile?.total_xp ?? 0,
      completions: (completions ?? []).map((item) => ({
        missionId: item.mission_id,
        completedAt: item.completed_at,
      })),
    };
  });

export const completePlayerMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ missionId: z.number().int().min(1).max(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("complete_threadline_mission", {
      _mission_id: data.missionId,
    });

    if (error || !result?.[0]) throw new Error("Mission progress could not be saved");
    return {
      newlyCompleted: result[0].newly_completed,
      totalXp: result[0].total_xp,
      completedCount: result[0].completed_count,
    };
  });