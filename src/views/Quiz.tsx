import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, Check, RotateCcw, Timer, Trash2, Trophy, X } from "lucide-react";
import { ACHIEVEMENTS, QUIZ, type Difficulty, type QuizQ } from "../lib/data";
import { idb, ls, type ScoreRecord } from "../lib/storage";
import { sound } from "../lib/sound";
import { Counter, Reveal, TiltCard, ViewHeader } from "../components/ui";
import { useApp } from "../state";

const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const MULT: Record<Difficulty, number> = { easy: 1, medium: 1.5, hard: 2 };
const TABS = ["Quiz", "Games", "Leaderboard", "Badges"] as const;

function useSaveScore() {
  const { toast } = useApp();
  return useCallback(async (game: string, score: number, detail?: string) => {
    const name = ls.get<string>("player", "Fan");
    const ok = await idb.put("scores", { game, name, score, detail, ts: Date.now() } as ScoreRecord);
    if (ok) toast("Score saved to your local leaderboard", "ok");
  }, [toast]);
}

/* ───────────────────────── Quiz ───────────────────────── */
interface Q extends QuizQ { opts: string[]; ans: number }
function QuizGame() {
  const { award, toast } = useApp();
  const save = useSaveScore();
  const [phase, setPhase] = useState<"setup" | "play" | "result">("setup");
  const [diff, setDiff] = useState<Difficulty | "mixed">("mixed");
  const [timed, setTimed] = useState(true);
  const [name, setName] = useState(() => ls.get<string>("player", ""));
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [left, setLeft] = useState(20);
  const savedRef = useRef(false);

  const start = () => {
    ls.set("player", name.trim() || "Fan");
    let pool = diff === "mixed" ? QUIZ : QUIZ.filter((q) => q.d === diff);
    pool = shuffle(pool).slice(0, 10);
    if (diff === "mixed") pool = pool.sort((a, b) => ["easy", "medium", "hard"].indexOf(a.d) - ["easy", "medium", "hard"].indexOf(b.d));
    setQs(pool.map((q) => { const o = shuffle(q.o.map((t, k) => ({ t, k }))); return { ...q, opts: o.map((x) => x.t), ans: o.findIndex((x) => x.k === q.a) }; }));
    setI(0); setPicked(null); setScore(0); setCorrect(0); setStreak(0); setLeft(20); savedRef.current = false; setPhase("play");
  };

  const answer = useCallback((k: number | null) => {
    if (picked !== null) return;
    const q = qs[i];
    const ok = k !== null && k === q.ans;
    if (ok) {
      sound.play("success");
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
      setScore((s) => s + Math.round(100 * MULT[q.d] + (timed ? left * 5 : 0) + streak * 10));
    } else { sound.play("error"); setStreak(0); }
    setPicked(k ?? -1);
  }, [qs, i, left, timed, streak, picked]);

  useEffect(() => {
    if (phase !== "play" || picked !== null || !timed) return;
    if (left <= 0) { answer(null); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, picked, left, timed, answer]);

  const next = () => {
    if (i + 1 >= qs.length) { setPhase("result"); return; }
    setI(i + 1); setPicked(null); setLeft(20);
  };

  useEffect(() => {
    if (phase !== "result" || savedRef.current) return;
    savedRef.current = true;
    void save(`quiz-${diff}`, score, `${correct}/${qs.length}`);
    award("first-quiz");
    if (correct === qs.length && qs.length >= 10) award("perfect");
    if (diff === "hard" && correct >= 7) award("hard-hero");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "setup") return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
      <TiltCard className="p-7 lg:p-10" max={3}><div className="relative z-[1]">
        <div className="eyebrow mb-3">Knowledge test</div>
        <h2 className="h-display text-4xl lg:text-6xl">How well do you know <span className="text-gold">Mahi</span>?</h2>
        <p className="text-muted mt-4 max-w-lg">10 random questions drawn from {QUIZ.length} fact-checked questions. Faster answers, harder levels and streaks score more.</p>
        <div className="mt-8 grid gap-5 max-w-lg">
          <div><div className="mono text-[10px] text-muted mb-2">Difficulty</div><div className="flex gap-2 flex-wrap">{(["easy", "medium", "hard", "mixed"] as const).map((d) => <button key={d} className={`tab ${diff === d ? "active" : ""}`} onClick={() => setDiff(d)}>{d}</button>)}</div></div>
          <div className="flex items-center justify-between"><div><div className="text-sm font-medium flex items-center gap-2"><Timer size={15} /> 20-second timer</div><div className="text-xs text-muted">Bonus points for speed</div></div><button role="switch" aria-checked={timed} aria-label="Timer" className="switch" onClick={() => setTimed(!timed)} /></div>
          <div><label className="mono text-[10px] text-muted block mb-2" htmlFor="pname">Name for leaderboard (stored locally)</label><input id="pname" className="input" value={name} maxLength={16} placeholder="Fan" onChange={(e) => setName(e.target.value)} /></div>
          <button className="btn w-fit" onClick={start}>Start quiz</button>
        </div>
      </div></TiltCard>
      <TiltCard className="p-7" max={3}><div className="relative z-[1]"><div className="eyebrow mb-4">How scoring works</div>
        <ul className="text-sm text-muted space-y-3"><li><b className="text-ink">Easy</b> 100 · <b className="text-ink">Medium</b> 150 · <b className="text-ink">Hard</b> 200 base points</li><li>+5 per second left (timer on)</li><li>+10 × current streak</li><li>Questions and answer positions are shuffled every run.</li></ul></div></TiltCard>
    </div>
  );

  if (phase === "result") return (
    <TiltCard className="p-8 lg:p-12 text-center max-w-2xl mx-auto" max={2}><div className="relative z-[1]">
      <Trophy className="mx-auto text-accent mb-4" size={44} />
      <div className="eyebrow mb-2">Final score</div>
      <div className="h-display text-7xl text-gold"><Counter to={score} /></div>
      <p className="text-muted mt-3">{correct} of {qs.length} correct · {diff} · {correct >= 9 ? "Legendary!" : correct >= 7 ? "Captain material." : correct >= 4 ? "Solid innings." : "Keep practising!"}</p>
      <div className="flex gap-3 justify-center mt-8 flex-wrap"><button className="btn" onClick={start}><RotateCcw size={15} /> Replay</button><button className="btn btn-ghost" onClick={() => setPhase("setup")}>Change settings</button></div>
    </div></TiltCard>
  );

  const q = qs[i];
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mono text-[10px] text-muted mb-3"><span>Q {i + 1}/{qs.length} · {q.d}</span><span>Score <b className="text-accent">{score}</b> · Streak {streak}🔥</span></div>
      {timed && <div className="h-1.5 rounded-full bg-white/5 mb-5 overflow-hidden"><div className="h-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${(left / 20) * 100}%` }} /></div>}
      <TiltCard className="p-6 lg:p-9" max={2}><div className="relative z-[1]">
        <h2 className="text-2xl lg:text-3xl font-semibold leading-snug">{q.q}</h2>
        <div className="grid gap-3 mt-7">
          {q.opts.map((o, k) => {
            const state = picked === null ? "" : k === q.ans ? "!border-emerald-400 bg-emerald-400/15" : k === picked ? "!border-red-400 bg-red-400/15" : "opacity-50";
            return <button key={o} disabled={picked !== null} onClick={() => answer(k)} className={`flex items-center gap-4 text-left min-h-[56px] px-5 rounded-2xl border border-line bg-white/5 hover:border-accent transition-all ${state}`}>
              <span className="mono text-[10px] w-5 text-accent">{"ABCD"[k]}</span><span className="flex-1">{o}</span>{picked !== null && k === q.ans && <Check size={18} className="text-emerald-400" />}{picked === k && k !== q.ans && <X size={18} className="text-red-400" />}</button>;
          })}
        </div>
        {picked !== null && (
          <div className="mt-6 flex items-start justify-between gap-4 flex-wrap"><p className="text-sm text-muted flex-1 min-w-[200px]">{picked === -1 ? "Time's up! " : ""}{q.e}</p><button className="btn" onClick={next}>{i + 1 >= qs.length ? "See result" : "Next"}</button></div>
        )}
      </div></TiltCard>
      <button className="mono text-[10px] text-muted mt-5 hover:text-accent" onClick={() => { toast("Quiz abandoned", "info"); setPhase("setup"); }}>Quit quiz</button>
    </div>
  );
}

/* ───────────────────────── Game 1: Helicopter timing ───────────────────────── */
function HeliGame() {
  const { award } = useApp();
  const save = useSaveScore();
  const [ball, setBall] = useState(0);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("Press SWING when the ball enters the glowing zone.");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<number[]>([]);
  const el = useRef<HTMLDivElement>(null);
  const st = useRef({ y: 0, speed: 0.9, active: false, raf: 0, last: 0 });
  const ZONE = 0.82;

  const finishBall = useCallback((runs: number, text: string) => {
    st.current.active = false;
    cancelAnimationFrame(st.current.raf);
    setMsg(text);
    setLog((l) => [...l, runs]);
    setScore((s) => s + runs);
    setRunning(false);
    setBall((b) => b + 1);
  }, []);

  const bowl = useCallback(() => {
    const s = st.current;
    s.y = 0; s.active = true; s.last = performance.now(); s.speed = 0.7 + Math.random() * 0.5;
    setRunning(true); setMsg("…");
    const loop = (t: number) => {
      if (!s.active) return;
      s.y += ((t - s.last) / 1000) * s.speed; s.last = t;
      if (el.current) el.current.style.top = `${Math.min(s.y, 1) * 100}%`;
      if (s.y >= 1.04) { finishBall(0, "Bowled! You missed it."); return; }
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  }, [finishBall]);

  const swing = useCallback(() => {
    const s = st.current;
    if (!s.active) return;
    const d = Math.abs(s.y - ZONE);
    sound.play("hit");
    if (d < 0.025) finishBall(6, "HELICOPTER! Out of the stadium — SIX!");
    else if (d < 0.06) finishBall(4, "Cracked through the covers — FOUR!");
    else if (d < 0.11) finishBall(2, "Well timed — two runs.");
    else if (d < 0.2) finishBall(1, "Scrambled a single.");
    else finishBall(0, s.y < ZONE ? "Too early — missed!" : "Too late — missed!");
  }, [finishBall]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") { e.preventDefault(); if (running) swing(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [running, swing]);
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  const over = ball >= 6;
  useEffect(() => {
    if (!over) return;
    void save("helicopter", score, `${log.join("-")}`);
    if (score >= 30) award("heli");
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps
  const reset = () => { setBall(0); setScore(0); setLog([]); setMsg("Press SWING when the ball enters the glowing zone."); if (el.current) el.current.style.top = "0%"; };

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6 items-start">
      <div className="glass h-[360px] relative overflow-hidden mx-auto w-[200px]" aria-hidden>
        <div className="absolute inset-x-8 inset-y-0 bg-[#9a875a]/20" />
        <div className="absolute inset-x-0 h-[11%] border-y-2 border-accent bg-accent/15 shadow-[0_0_30px_var(--glow)]" style={{ top: `${(ZONE - 0.055) * 100}%` }} />
        <div ref={el} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full" style={{ top: 0, background: "radial-gradient(circle at 30% 30%, #ff8a8a, #9b1515)", boxShadow: "0 0 20px #ff4d4d" }} />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="w-1.5 h-12 bg-[#f0e2b6] rounded" />)}</div>
      </div>
      <div>
        <div className="eyebrow mb-2">Helicopter Timing · 6 balls</div>
        <div className="h-display text-7xl text-gold">{score}<span className="text-2xl text-muted">/36</span></div>
        <p className="text-muted mt-2 min-h-[24px]" aria-live="polite">{msg}</p>
        <div className="flex gap-2 mt-3">{Array.from({ length: 6 }).map((_, i) => <span key={i} className={`w-9 h-9 rounded-full grid place-items-center text-xs font-bold border ${log[i] === undefined ? "border-line text-muted" : log[i] >= 4 ? "bg-accent text-accent-ink border-accent" : "border-accent text-accent"}`}>{log[i] ?? "·"}</span>)}</div>
        <div className="flex gap-3 mt-6 flex-wrap">
          {!over && !running && <button className="btn" onClick={bowl}>{ball === 0 ? "Bowl first ball" : `Bowl ball ${ball + 1}`}</button>}
          {running && <button className="btn !min-h-[64px] !px-10 text-base" onClick={swing}>SWING (Space)</button>}
          {over && <button className="btn" onClick={reset}><RotateCcw size={15} /> Play again</button>}
        </div>
        {over && <p className="text-sm mt-4 text-accent">Innings over — {score >= 30 ? "pure Mahi magic!" : score >= 18 ? "good knock!" : "keep your eye on the ball."}</p>}
      </div>
    </div>
  );
}

/* ───────────────────────── Game 2: Keeper reflex ───────────────────────── */
function ReflexGame() {
  const { award } = useApp();
  const save = useSaveScore();
  const [state, setState] = useState<"idle" | "wait" | "go" | "early" | "result">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const t0 = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const ROUNDS = 5;
  const best = ls.get<number>("reflexBest", 0);

  const begin = () => {
    setState("wait");
    timer.current = window.setTimeout(() => { t0.current = performance.now(); setState("go"); sound.play("tick"); }, 1200 + Math.random() * 2600);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const tap = () => {
    if (state === "wait") { clearTimeout(timer.current); setState("early"); sound.play("error"); }
    else if (state === "go") {
      const ms = Math.round(performance.now() - t0.current);
      sound.play("hit");
      const n = [...times, ms];
      setTimes(n);
      if (ms < 300) award("speedster");
      if (n.length >= ROUNDS) {
        const avg = Math.round(n.reduce((a, b) => a + b, 0) / n.length);
        const sc = Math.max(0, 1000 - avg);
        if (sc > best) ls.set("reflexBest", sc);
        void save("reflex", sc, `avg ${avg}ms`);
        setState("result");
      } else setState("idle");
    } else if (state === "idle" || state === "early") begin();
  };
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  return (
    <div>
      <div className="eyebrow mb-2">Keeper Reflex · {ROUNDS} stumpings</div>
      <button onClick={tap} aria-live="polite" className={`w-full min-h-[300px] rounded-[28px] border-2 grid place-items-center text-center p-6 transition-colors select-none ${state === "go" ? "bg-accent text-accent-ink border-accent shadow-[0_0_60px_var(--glow)]" : state === "wait" ? "bg-red-500/10 border-red-400/50" : "glass"}`}>
        <div>
          <div className="flex justify-center gap-3 mb-5">{[0, 1, 2].map((i) => <i key={i} className={`w-2.5 h-24 rounded transition-all ${state === "go" ? "bg-accent-ink" : "bg-[#f0e2b6]"}`} style={{ boxShadow: state === "go" ? "none" : undefined }} />)}</div>
          <div className="h-display text-4xl lg:text-6xl">{state === "idle" ? (times.length ? `${times[times.length - 1]} ms` : "Ready?") : state === "wait" ? "Wait for it…" : state === "go" ? "NOW!" : state === "early" ? "Too early!" : `${avg} ms avg`}</div>
          <div className="mono text-[10px] mt-3 opacity-80">{state === "idle" ? `Tap to start round ${times.length + 1}` : state === "wait" ? "Tap only when the stumps light up" : state === "go" ? "TAP!" : state === "early" ? "Tap to retry this round" : `Score ${Math.max(0, 1000 - avg)} · tap to replay`}</div>
        </div>
      </button>
      <div className="flex gap-2 mt-4 flex-wrap items-center">{times.map((t, i) => <span key={i} className="chip !text-accent">{t} ms</span>)}{best > 0 && <span className="chip ml-auto">Best score {best}</span>}</div>
      {state === "result" && <button className="btn mt-4" onClick={() => { setTimes([]); setState("idle"); }}><RotateCcw size={15} /> Play again</button>}
    </div>
  );
}

/* ───────────────────────── Game 3: Last over chase ───────────────────────── */
type Shot = "defend" | "drive" | "slog";
function ChaseGame() {
  const { award } = useApp();
  const save = useSaveScore();
  const newTarget = () => 11 + Math.floor(Math.random() * 9);
  const [target, setTarget] = useState(newTarget);
  const [runs, setRuns] = useState(0);
  const [balls, setBalls] = useState(0);
  const [wk, setWk] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState<"" | "win" | "lose">("");
  const play = (shot: Shot) => {
    if (done) return;
    const r = Math.random();
    let add = 0, out = false, text = "";
    if (shot === "defend") { if (r < 0.03) out = true; else add = r < 0.55 ? 1 : 0; }
    else if (shot === "drive") { if (r < 0.12) out = true; else add = [1, 1, 2, 2, 3, 4, 4][Math.floor(Math.random() * 7)]; }
    else { if (r < 0.28) out = true; else if (r < 0.46) add = 0; else add = r < 0.72 ? 4 : 6; }
    text = out ? "OUT! Wicket falls." : add === 6 ? "SIX! Massive hit!" : add === 4 ? "FOUR through the gap!" : add === 0 ? "Dot ball — pressure builds." : `${add} run${add > 1 ? "s" : ""}.`;
    sound.play(out ? "error" : add >= 4 ? "hit" : "tick");
    const nb = balls + 1, nr = runs + add, nw = wk + (out ? 1 : 0);
    setBalls(nb); setRuns(nr); setWk(nw); setLog((l) => [`${nb}. ${text}`, ...l].slice(0, 6));
    if (nr >= target) { setDone("win"); sound.play("unlock"); award("finisher"); void save("chase", 100 + (6 - nb) * 20 + (2 - nw) * 10, `${nr}/${nw} off ${nb}`); }
    else if (nb >= 6 || nw >= 2) { setDone("lose"); void save("chase", nr, `${nr}/${nw} off ${nb}`); }
  };
  const reset = () => { setTarget(newTarget()); setRuns(0); setBalls(0); setWk(0); setLog([]); setDone(""); };
  const need = Math.max(0, target - runs);
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      <div className="glass p-6 lg:p-8"><div className="relative z-[1]">
        <div className="eyebrow mb-2">Last Over Chase · 2 wickets in hand</div>
        <div className="h-display text-5xl lg:text-6xl">Need <span className="text-gold">{need}</span> <span className="text-2xl text-muted">off {6 - balls}</span></div>
        <div className="mono text-[10px] text-muted mt-2">Target {target} · Score {runs}/{wk}</div>
        <div className="flex gap-2 mt-4">{Array.from({ length: 6 }).map((_, i) => <i key={i} className={`w-4 h-4 rounded-full ${i < balls ? "bg-accent" : "border border-line"}`} />)}</div>
        {!done ? (
          <div className="grid gap-3 mt-7">
            <button className="btn btn-ghost justify-between" onClick={() => play("defend")}><span>Defend</span><span className="opacity-60 normal-case tracking-normal">0–1 runs · very safe</span></button>
            <button className="btn btn-ghost justify-between" onClick={() => play("drive")}><span>Drive</span><span className="opacity-60 normal-case tracking-normal">1–4 runs · some risk</span></button>
            <button className="btn justify-between" onClick={() => play("slog")}><span>Helicopter slog</span><span className="opacity-70 normal-case tracking-normal">0/4/6 · high risk</span></button>
          </div>
        ) : (
          <div className="mt-7"><div className="h-display text-4xl">{done === "win" ? "🏆 Finished it in style!" : "So close…"}</div><p className="text-muted mt-2 text-sm">{done === "win" ? `Chased ${target} with ${6 - balls} ball(s) to spare.` : `Fell short by ${need}.`}</p><button className="btn mt-5" onClick={reset}><RotateCcw size={15} /> New chase</button></div>
        )}
      </div></div>
      <div className="glass p-6"><div className="relative z-[1]"><div className="eyebrow mb-3">Commentary</div>
        {log.length === 0 ? <p className="text-sm text-muted">The crowd is on its feet. Pick your shot.</p> : <ul className="space-y-2 text-sm">{log.map((l, i) => <li key={l + i} className={i === 0 ? "text-ink font-medium" : "text-muted"}>{l}</li>)}</ul>}
      </div></div>
    </div>
  );
}

/* ───────────────────────── Leaderboard & badges ───────────────────────── */
const GAME_NAMES: Record<string, string> = { quiz: "Quiz", helicopter: "Helicopter Timing", reflex: "Keeper Reflex", chase: "Last Over Chase" };
function Leaderboard() {
  const { toast } = useApp();
  const [rows, setRows] = useState<ScoreRecord[]>([]);
  const [g, setG] = useState("all");
  const load = useCallback(async () => setRows(await idb.all<ScoreRecord>("scores")), []);
  useEffect(() => { void load(); }, [load]);
  const view = useMemo(() => rows.filter((r) => g === "all" || r.game.startsWith(g)).sort((a, b) => b.score - a.score).slice(0, 15), [rows, g]);
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">{["all", ...Object.keys(GAME_NAMES)].map((k) => <button key={k} className={`tab ${g === k ? "active" : ""}`} onClick={() => setG(k)}>{k === "all" ? "All" : GAME_NAMES[k]}</button>)}</div>
      {view.length === 0 ? <div className="glass p-10 text-center text-muted text-sm"><div className="relative z-[1]">No scores yet — play a game to get on the board. Scores are stored only on this device.</div></div> : (
        <ol className="grid gap-2">
          {view.map((r, i) => (
            <li key={r.id} className="glass !rounded-2xl p-4 flex items-center gap-4"><span className={`relative z-[1] h-display text-3xl w-10 ${i === 0 ? "text-gold" : "text-muted"}`}>{i + 1}</span>
              <span className="relative z-[1] flex-1 min-w-0"><b className="block truncate">{r.name}</b><span className="mono text-[9px] text-muted">{GAME_NAMES[r.game.split("-")[0]] ?? r.game}{r.game.startsWith("quiz-") ? ` · ${r.game.slice(5)}` : ""} · {new Date(r.ts).toLocaleDateString()} {r.detail ? `· ${r.detail}` : ""}</span></span>
              <b className="relative z-[1] h-display text-3xl text-accent">{r.score}</b>
              <button className="icon-btn !w-9 !h-9 !rounded-xl relative z-[1]" aria-label="Delete score" onClick={async () => { await idb.delete("scores", r.id!); toast("Score deleted", "info"); void load(); }}><Trash2 size={14} /></button></li>
          ))}
        </ol>
      )}
    </div>
  );
}
function Badges() {
  const { achievements } = useApp();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {ACHIEVEMENTS.map((a, i) => { const got = achievements.includes(a.id); return (
        <Reveal key={a.id} delay={i * 40}><TiltCard className={`p-5 text-center h-full ${got ? "!border-accent" : "opacity-60"}`} max={6}><div className="relative z-[1]"><div className={`text-4xl mb-3 ${got ? "" : "grayscale"}`}>{a.icon}</div><div className="text-sm font-semibold">{a.name}</div><div className="text-[11px] text-muted mt-1">{a.desc}</div><div className="mono text-[9px] mt-3 text-accent">{got ? "Unlocked" : "Locked"}</div></div></TiltCard></Reveal>
      ); })}
    </div>
  );
}

export default function Quiz() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Quiz");
  const [game, setGame] = useState<"heli" | "reflex" | "chase">("heli");
  return (
    <div className="view-pad">
      <ViewHeader no="11" title="Quiz Arena" sub="Quiz · mini-games · leaderboard"><Award className="text-accent hidden sm:block" size={32} /></ViewHeader>
      <div className="glass !rounded-full p-1.5 flex gap-1 overflow-x-auto no-scrollbar mb-8 w-fit max-w-full" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab !border-0 ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === "Quiz" && <QuizGame />}
      {tab === "Games" && (
        <div>
          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {([["heli", "🚁", "Helicopter Timing", "Time your swing. Six balls."], ["reflex", "⚡", "Keeper Reflex", "Whip off the bails — fast."], ["chase", "🎯", "Last Over Chase", "Pick your shots. Finish it."]] as const).map(([id, ic, n, d]) => (
              <button key={id} onClick={() => setGame(id)} aria-pressed={game === id} className={`glass p-5 text-left transition-all ${game === id ? "!border-accent shadow-[0_0_30px_var(--glow)]" : ""}`}><div className="relative z-[1]"><div className="text-3xl">{ic}</div><div className="font-semibold mt-2">{n}</div><div className="text-xs text-muted">{d}</div></div></button>
            ))}
          </div>
          {game === "heli" && <HeliGame />}
          {game === "reflex" && <ReflexGame />}
          {game === "chase" && <ChaseGame />}
        </div>
      )}
      {tab === "Leaderboard" && <Leaderboard />}
      {tab === "Badges" && <Badges />}
    </div>
  );
}
