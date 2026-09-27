import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  Code2,
  Crown,
  Home,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  X,
  Zap,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useServerFn } from "@tanstack/react-start";
import { completePlayerMission, getPlayerProgress } from "@/lib/threadline.functions";
import heroImage from "@/assets/threadline-hero.jpg";
import missionImage from "@/assets/threadline-missions.jpg";
import shopImage from "@/assets/threadline-shop.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Threadline — Secure the Style" },
      { name: "description", content: "Play cyber defense missions in the Threadline fashion universe." },
      { property: "og:title", content: "Threadline — Secure the Style" },
      { property: "og:description", content: "Hack the flaws, secure the store, and rise through the Threadline ranks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mission = {
  id: number;
  name: string;
  category: "Novice" | "Cadet" | "Elite" | "Ace";
  minutes: string;
  xp: number;
  summary: string;
  objective: string;
};

const initialMission: Mission = { id: 1, name: "Input Sanitization", category: "Novice", minutes: "10–15 min", xp: 50, summary: "A reflected payload is hiding in the store search.", objective: "Trace the unsafe query, neutralize the script, and preserve valid product searches." };

const missions: Mission[] = [
  initialMission,
  { id: 2, name: "Broken Access", category: "Cadet", minutes: "15–20 min", xp: 75, summary: "Unauthorized signals reached the collection admin core.", objective: "Identify the exposed action and enforce role checks without breaking the storefront." },
  { id: 3, name: "Review XSS", category: "Elite", minutes: "20–25 min", xp: 100, summary: "Malicious scripts are burning through product reviews.", objective: "Inspect the review renderer, contain the payload, and submit a safe rendering patch." },
  { id: 4, name: "Void Injection", category: "Ace", minutes: "25–30 min", xp: 150, summary: "The main database query is leaking into the void.", objective: "Find the injectable parameter and replace the query with a secure prepared statement." },
];

const navItems = [
  { label: "Home", icon: Home },
  { label: "Challenges", icon: Code2 },
  { label: "Leaderboard", icon: Trophy },
  { label: "My Progress", icon: BarChart3 },
  { label: "Store", icon: ShoppingBag },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Sparkles className="size-7 text-silver drop-shadow-[0_0_12px_var(--primary)]" aria-hidden="true" />
      <span className="font-display text-2xl uppercase text-foreground">Threadline</span>
    </div>
  );
}

function Index() {
  const [activeMission, setActiveMission] = useState<Mission>(initialMission);
  const [filter, setFilter] = useState("All");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsignInput, setCallsignInput] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [player, setPlayer] = useState<User | null>(null);
  const [progress, setProgress] = useState<{ callsign: string; totalXp: number; completions: { missionId: number; completedAt: string }[] } | null>(null);
  const [savingMission, setSavingMission] = useState(false);
  const loadProgress = useServerFn(getPlayerProgress);
  const finishMission = useServerFn(completePlayerMission);

  useEffect(() => {
    let current = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (current) setPlayer(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!current) return;
      setPlayer(session?.user ?? null);
      if (!session) setProgress(null);
    });
    return () => {
      current = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!player) return;
    let current = true;
    void loadProgress().then((data) => {
      if (current) setProgress(data);
    }).catch(() => {
      if (current) setAuthMessage("Player data is temporarily unavailable. Try again shortly.");
    });
    return () => { current = false; };
  }, [player, loadProgress]);

  const visibleMissions = useMemo(
    () => (filter === "All" ? missions : missions.filter((mission) => mission.category === filter)),
    [filter],
  );

  const openMission = (mission: Mission) => {
    setActiveMission(mission);
    setBriefingOpen(true);
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { callsign: callsignInput.trim().slice(0, 24) || "Cyberdreamer" } },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage("Check your email for a confirmation link to activate your account.");
          return;
        }
        setAccountOpen(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAccountOpen(false);
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Sign-in could not be completed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) setAuthMessage(result.error.message);
    } catch {
      setAuthMessage("Google sign-in could not be started. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProgress(null);
    setAccountOpen(false);
  };

  const markMissionComplete = async () => {
    if (!player) {
      setBriefingOpen(false);
      setAccountOpen(true);
      setAuthMessage("Sign in to save mission progress.");
      return;
    }
    setSavingMission(true);
    setAuthMessage("");
    try {
      const result = await finishMission({ data: { missionId: activeMission.id } });
      const updated = await loadProgress();
      setProgress(updated);
      setAuthMessage(result.newlyCompleted ? `Mission secured · +${activeMission.xp} XP` : "Mission already secured — rewards are only granted once.");
      setBriefingOpen(false);
    } catch {
      setAuthMessage("Could not save this mission. Sign in and try again.");
    } finally {
      setSavingMission(false);
    }
  };

  const completedIds = new Set(progress?.completions.map((item) => item.missionId) ?? []);
  const displayName = progress?.callsign ?? player?.email?.split("@")[0] ?? "Cyberdreamer";
  const displayXp = player ? progress?.totalXp ?? 0 : 50;
  const displayLevel = Math.floor(displayXp / 300) + 1;

  return (
    <div className="game-shell min-h-screen bg-background text-foreground">
      <header className="mobile-header flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
        <Brand />
        <Button variant="quiet" size="icon" aria-label="Toggle navigation" onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      <div className="mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className={`${menuOpen ? "flex" : "hidden"} left-rail border-b border-border bg-panel/90 p-5 backdrop-blur-xl lg:flex lg:flex-col lg:border-b-0 lg:border-r`}>
          <div className="hidden lg:block"><Brand /></div>
          <nav className="mt-2 grid w-full gap-1 lg:mt-10" aria-label="Main navigation">
            {navItems.map(({ label, icon: Icon }, index) => (
              <button key={label} className={`nav-item ${index === 0 ? "nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto hidden border border-primary/30 bg-primary/5 p-4 lg:block">
            <p className="font-display text-sm uppercase text-primary">Security patch</p>
            <p className="mt-1 text-xs text-muted-foreground">Find the flaw. Patch the code. Protect the collection.</p>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex items-center gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Search missions</span>
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input className="h-11 w-full border border-border bg-panel/70 pl-11 pr-4 text-sm outline-none transition focus:border-primary" placeholder="Search missions, gear, or topics" />
            </label>
            <Button variant="ghost" size="icon" aria-label={player ? "Player account" : "Sign in"} onClick={() => { setAuthMessage(""); setAccountOpen(true); }}><UserRound className="size-4" /></Button>
            <span className="hidden text-xs uppercase text-muted-foreground sm:block">{player ? displayName : "Guest"}</span>
          </div>
          {authMessage && !accountOpen && !briefingOpen && <p className="mb-4 text-sm text-primary" role="status" aria-live="polite">{authMessage}</p>}

          <section className="hero-panel relative min-h-[390px] overflow-hidden border border-border sm:min-h-[430px]">
            <img src={heroImage} alt="Threadline operatives in silver and black techwear" width={1600} height={704} className="absolute inset-0 h-full w-full object-cover" />
            <div className="hero-shade absolute inset-0" />
            <div className="relative z-10 flex min-h-[390px] max-w-xl flex-col justify-center p-6 sm:min-h-[430px] sm:p-10">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-primary"><Sparkles className="size-3" /> Welcome back, {displayName}</p>
              <h1 className="font-display text-6xl uppercase leading-[0.82] text-foreground sm:text-8xl">Secure<br /><span className="text-primary">the style</span></h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-silver">Enter the Threadline arena, where high fashion meets cyber defense. Find the flaw, deploy the patch, and claim the drop.</p>
              <Button className="mt-6 w-fit" onClick={() => openMission(activeMission)}>Start mission <ArrowRight className="size-4" /></Button>
            </div>
            <div className="absolute bottom-5 right-5 z-10 border border-primary/30 bg-background/70 px-3 py-2 text-right backdrop-blur">
              <p className="font-display text-lg uppercase">Active: 0{activeMission.id}</p>
              <p className="text-[10px] uppercase text-primary">{activeMission.category} · {activeMission.xp} XP</p>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="missions-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="missions-title" className="flex items-center gap-2 font-display text-3xl uppercase"><Sparkles className="size-5 text-primary" /> Available missions</h2>
                <p className="text-xs uppercase text-muted-foreground">Hack the system. Secure the collection.</p>
              </div>
              <div className="flex flex-wrap gap-1" aria-label="Mission difficulty">
                {["All", "Novice", "Cadet", "Elite", "Ace"].map((option) => (
                  <Button key={option} size="sm" variant={filter === option ? "primary" : "quiet"} onClick={() => setFilter(option)}>{option}</Button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visibleMissions.map((mission) => (
                <article key={mission.id} className={`mission-card ${activeMission.id === mission.id ? "mission-card-active" : ""}`} onClick={() => setActiveMission(mission)}>
                  <div className="mission-image relative aspect-[4/3] overflow-hidden" style={{ "--mission-position": `${(mission.id - 1) * 33.333}%` } as React.CSSProperties}>
                    <img src={missionImage} alt="" loading="lazy" width={1600} height={608} className="mission-sheet absolute inset-0 h-full max-w-none object-cover" />
                    <span className="absolute left-2 top-2 bg-badge px-2 py-1 text-[10px] font-bold uppercase text-badge-foreground">{mission.category}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase text-primary">Mission 0{mission.id}{completedIds.has(mission.id) ? " · Secured" : ""}</p>
                    <h3 className="mt-1 font-display text-xl uppercase leading-none">{mission.name}</h3>
                    <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{mission.summary}</p>
                    <div className="my-3 flex items-center justify-between text-[10px] uppercase text-silver"><span className="flex items-center gap-1"><Clock3 className="size-3" />{mission.minutes}</span><span>✦ {mission.xp} XP</span></div>
                    <Button variant="ghost" size="sm" className="w-full" onClick={(event) => { event.stopPropagation(); openMission(mission); }}>Engage <ChevronRight className="size-3" /></Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="learning-strip mt-6 flex flex-col gap-4 border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
            <div className="grid size-12 shrink-0 place-items-center bg-primary text-primary-foreground"><BookOpen /></div>
            <div className="flex-1"><h2 className="font-display text-2xl uppercase">Learn & get help</h2><p className="text-sm text-muted-foreground">Review the exploit pattern or open a step-by-step field guide.</p></div>
            <Button variant="ghost">Open learning hub</Button>
          </section>
        </main>

        <aside className="right-rail border-t border-border bg-panel/70 p-4 lg:border-l lg:border-t-0 lg:p-5">
          <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs uppercase text-muted-foreground">Operator</p><p className="font-display text-xl uppercase">{displayName}</p></div><div className="grid size-11 place-items-center border border-primary text-primary"><Crown className="size-5" /></div></div>

          <section className="panel mt-5 p-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl uppercase">Status core</h2><Sparkles className="size-4 text-primary" /></div>
            <div className="mt-5 flex items-center gap-4"><div className="level-ring grid size-16 shrink-0 place-items-center rounded-full"><span className="font-display text-2xl">{displayLevel}</span></div><div className="flex-1"><p className="text-xs uppercase">Level {displayLevel}</p><div className="mt-2 h-1.5 overflow-hidden bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (displayXp % 300) / 3)}%` }} /></div><p className="mt-1 text-[10px] uppercase text-muted-foreground">{displayXp % 300} / 300 stardust</p></div></div>
            <div className="mt-5 grid grid-cols-2 gap-2"><Stat value={String(progress?.completions.length ?? 1)} label="Stars won" /><Stat value="0" label="Win streak" /><Stat value={String(displayXp)} label="Total XP" /><Stat value={String(progress?.completions.length ?? 4)} label="Missions cleared" /></div>
          </section>

          <section className="panel mt-4 p-5"><h2 className="font-display text-xl uppercase">Signal feed</h2><div className="mt-4 space-y-4">{progress?.completions.length ? progress.completions.slice(0, 3).map((item) => { const mission = missions.find((entry) => entry.id === item.missionId); return <Feed key={item.missionId} icon={Zap} title={`Mission 0${item.missionId} secured`} detail={`+${mission?.xp ?? 0} XP · ${new Date(item.completedAt).toLocaleDateString()}`} />; }) : <><Feed icon={Zap} title={player ? "No missions secured yet" : "Mission 01 secured"} detail={player ? "Your completed missions appear here" : "+50 XP · 1 hour ago"} /><Feed icon={Activity} title="Mission 02 scanned" detail="Weak signal · 2 hours ago" /><Feed icon={Trophy} title="Code guardian earned" detail="Badge unlocked yesterday" /></>}</div></section>

          <section className="shop-card relative mt-4 min-h-[330px] overflow-hidden border border-border">
            <img src={shopImage} alt="Model wearing Threadline constellation techwear" loading="lazy" width={800} height={1104} className="absolute inset-0 h-full w-full object-cover" />
            <div className="shop-shade absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-5"><p className="text-xs uppercase text-primary">New signal drop</p><h2 className="font-display text-4xl uppercase leading-none">Cosmic wear</h2><p className="my-3 text-xs text-silver">Gear engineered for the orbital elite.</p><Button className="w-full">Enter store</Button></div>
          </section>
        </aside>
      </div>

      {briefingOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="briefing-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setBriefingOpen(false); }}>
          <div className="briefing w-full max-w-2xl border border-primary bg-panel p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">Mission 0{activeMission.id} · {activeMission.category}</p><h2 id="briefing-title" className="mt-1 font-display text-4xl uppercase sm:text-5xl">{activeMission.name}</h2></div><Button variant="quiet" size="icon" aria-label="Close briefing" onClick={() => setBriefingOpen(false)}><X /></Button></div>
            <div className="my-6 border-y border-border py-6"><p className="text-xs uppercase text-muted-foreground">Field objective</p><p className="mt-2 text-lg leading-7 text-silver">{activeMission.objective}</p></div>
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex gap-5 text-xs uppercase"><span>{activeMission.minutes}</span><span className="text-primary">✦ {activeMission.xp} XP</span></div><div className="flex flex-wrap gap-2"><Button variant="quiet" onClick={() => setBriefingOpen(false)}>Close</Button><Button onClick={markMissionComplete} disabled={savingMission}>{completedIds.has(activeMission.id) ? "Secured" : savingMission ? "Saving…" : "Secure mission"}<ArrowRight className="size-4" /></Button></div></div>
          </div>
        </div>
      )}

      {accountOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setAccountOpen(false); }}>
          <div className="briefing w-full max-w-md border border-primary bg-panel p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">Player access</p><h2 id="account-title" className="mt-1 font-display text-4xl uppercase">{player ? displayName : authMode === "signin" ? "Sign in" : "Create account"}</h2></div><Button variant="quiet" size="icon" aria-label="Close account" onClick={() => setAccountOpen(false)}><X /></Button></div>
            {player ? <div><p className="text-sm text-muted-foreground">{player.email}</p><Button className="mt-6 w-full" variant="outline" onClick={signOut}><LogOut className="size-4" /> Sign out</Button></div> : <>
              <Button className="w-full" variant="outline" onClick={signInWithGoogle} disabled={authBusy}>Continue with Google</Button>
              <div className="my-5 flex items-center gap-3 text-[10px] uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" /></div>
              <form className="space-y-3" onSubmit={submitAuth}>
                {authMode === "signup" && <label className="block text-xs uppercase text-muted-foreground">Callsign<input className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" maxLength={24} value={callsignInput} onChange={(event) => setCallsignInput(event.target.value)} placeholder="Cyberdreamer" /></label>}
                <label className="block text-xs uppercase text-muted-foreground">Email<input className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label className="block text-xs uppercase text-muted-foreground">Password<input className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                {authMessage && <p className="text-sm text-primary" role="status">{authMessage}</p>}
                <Button className="w-full" type="submit" disabled={authBusy}>{authBusy ? "Working…" : authMode === "signin" ? "Sign in" : "Create account"}</Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">{authMode === "signin" ? "New operator?" : "Already registered?"} <Button type="button" variant="link" className="h-auto min-h-0 px-1 py-0 text-sm" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthMessage(""); }}>{authMode === "signin" ? "Create an account" : "Sign in"}</Button></p>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="border border-border bg-background/45 p-3"><p className="font-display text-2xl text-primary">{value}</p><p className="text-[9px] uppercase text-muted-foreground">{label}</p></div>;
}

function Feed({ icon: Icon, title, detail }: { icon: typeof Zap; title: string; detail: string }) {
  return <div className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center border border-primary/40 text-primary"><Icon className="size-4" /></div><div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-[10px] uppercase text-muted-foreground">{detail}</p></div></div>;
}
