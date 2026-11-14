import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Keyboard, Maximize2, Menu, Minimize2, Music2, Pause, Play, Search, Volume2, VolumeX, WifiOff, X, RefreshCw } from "lucide-react";
import { useApp } from "../state";
import { CAREER, MOMENTS, PHOTOS, SECTIONS, TROPHIES } from "../lib/data";
import { THEMES, THEME_ORDER } from "../lib/themes";
import { TRACKS, sound } from "../lib/sound";
import { perfStats, device } from "../lib/perf";
import { gsap } from "../lib/motion";
import { DotText, Icon, Modal, Switch } from "./ui";

/* ───────────────────────── Loader / cinematic intro ───────────────────────── */
export function Loader({ onDone }: { onDone: () => void }) {
  const { reduced } = useApp();
  const [pct, setPct] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const seen = useRef(sessionStorage.getItem("msd:seen") === "1");

  useEffect(() => {
    let cancelled = false;
    const state = { v: 0 };
    const tasks = [
      Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1800))]),
      import("../three/engine"),
      import("../lib/storage").then((s) => s.idb.count("kv")),
    ];
    let finished = 0;
    tasks.forEach((t) => t.catch(() => undefined).finally(() => { finished++; }));
    const minMs = seen.current || reduced ? 700 : 2600;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const time = Math.min(1, (performance.now() - t0) / minMs);
      const target = Math.min(time, (finished / tasks.length) * 0.9 + 0.1) * 100;
      state.v += (target - state.v) * 0.18;
      setPct(Math.round(state.v));
      if (!cancelled && finished >= tasks.length && time >= 1 && state.v > 97) {
        clearInterval(id);
        finish();
      }
    }, 40);
    function finish() {
      if (done.current) return;
      done.current = true;
      setPct(100);
      sessionStorage.setItem("msd:seen", "1");
      const el = root.current;
      if (!el || reduced) { onDone(); return; }
      gsap.to(el, { opacity: 0, scale: 1.04, duration: 0.7, ease: "power2.inOut", delay: 0.25, onComplete: onDone });
    }
    (root.current as (HTMLDivElement & { skip?: () => void }) | null)!.skip = finish;
    return () => { cancelled = true; clearInterval(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className="fixed inset-0 z-[300] grid place-items-center bg-bg cursor-pointer" onClick={() => (root.current as unknown as { skip?: () => void })?.skip?.()} role="status" aria-label="Loading">
      <div className="absolute inset-0 dotgrid opacity-30" />
      <div className="relative text-center px-6 w-full max-w-xl">
        <div className="mono text-[10px] text-accent mb-8 blink">● Initialising stadium</div>
        <div className="flex justify-center overflow-hidden"><DotText text="MSD" cell={reduced ? 10 : 15} /></div>
        <div className="mt-8 h-px w-full bg-line relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-accent shadow-[0_0_20px_var(--glow)]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex justify-between mono text-[10px] text-muted">
          <span>Beyond Cricket. Beyond Time.</span>
          <span className="tabular text-ink">{String(pct).padStart(3, "0")}%</span>
        </div>
        <div className="mono text-[10px] text-muted mt-10 opacity-70">Tap anywhere to skip</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Sound controls ───────────────────────── */
export function SoundControls({ compact = false }: { compact?: boolean }) {
  const { sp, setSound } = useApp();
  const [, force] = useState(0);
  useEffect(() => {
    const off = sound.subscribe(() => force((n) => n + 1));
    return () => { off(); };
  }, []);
  return (
    <div className="space-y-4">
      {!sp.enabled && <p className="text-sm text-muted">Sound is <b className="text-ink">off</b>. Nothing plays until you turn it on. All audio is synthesised in your browser — no copyrighted music.</p>}
      <Row label="Enable sound" hint="Opt-in master switch"><Switch checked={sp.enabled} onChange={(b) => setSound({ enabled: b, permission: b ? "granted" : sp.permission })} label="Enable sound" /></Row>
      <div className={sp.enabled ? "space-y-4" : "space-y-4 opacity-40 pointer-events-none"}>
        <div>
          <div className="flex justify-between mono text-[10px] text-muted mb-1"><span>Volume</span><span>{Math.round(sp.volume * 100)}%</span></div>
          <div className="flex items-center gap-3">
            <button className={`icon-btn ${sp.muted ? "on" : ""}`} aria-pressed={sp.muted} aria-label={sp.muted ? "Unmute" : "Mute"} onClick={() => setSound({ muted: !sp.muted })}>{sp.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <input type="range" min={0} max={1} step={0.01} value={sp.volume} aria-label="Volume" onChange={(e) => setSound({ volume: Number(e.target.value), muted: false })} onPointerUp={() => sound.play("tick")} />
          </div>
        </div>
        <Row label="UI & navigation sounds" hint="Clicks, theme switch, trophy unlock"><Switch checked={sp.ui} onChange={(b) => setSound({ ui: b })} label="UI sounds" /></Row>
        <Row label="Stadium ambience" hint="Synthetic crowd murmur"><Switch checked={sp.ambience} onChange={(b) => setSound({ ambience: b })} label="Ambience" /></Row>
        <Row label="Background music" hint="Original generative score"><Switch checked={sp.music} onChange={(b) => setSound({ music: b })} label="Music" /></Row>
        {!compact || sp.music ? (
          <div className="glass p-4 !rounded-2xl">
            <div className="flex items-center gap-3">
              <button className="icon-btn on" aria-label={sp.music ? "Pause music" : "Play music"} onClick={() => setSound({ music: !sp.music })}>{sp.music ? <Pause size={18} /> : <Play size={18} />}</button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{TRACKS[sp.track % TRACKS.length].name}</div>
                <div className="mono text-[9px] text-muted truncate">{TRACKS[sp.track % TRACKS.length].mood}</div>
              </div>
              {sp.music && <div className="flex gap-[3px] items-end h-5" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} className="w-[3px] bg-accent rounded-full" style={{ height: 6 + ((i * 7) % 12), animation: `float ${0.6 + i * 0.15}s ease-in-out infinite` }} />)}</div>}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {TRACKS.map((t, i) => <button key={t.name} className={`tab !min-h-[34px] !px-3 ${sp.track === i ? "active" : ""}`} onClick={() => setSound({ track: i })}>{t.name}</button>)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0"><div className="text-sm font-medium">{label}</div>{hint && <div className="text-xs text-muted">{hint}</div>}</div>
      {children}
    </div>
  );
}

function SoundPopover() {
  const { sp, setSound } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("pointerdown", fn);
    return () => window.removeEventListener("pointerdown", fn);
  }, [open]);
  const on = sp.enabled && !sp.muted;
  return (
    <div className="relative" ref={ref}>
      <button className={`icon-btn ${on ? "on" : ""}`} aria-label="Sound settings" aria-expanded={open} onClick={() => setOpen((o) => !o)} onDoubleClick={() => setSound({ muted: !sp.muted })}>
        {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      {open && (
        <div className="glass glass-strong absolute right-0 top-14 w-[min(92vw,340px)] p-5 z-[80]">
          <div className="flex items-center justify-between mb-4"><div className="eyebrow flex items-center gap-2"><Music2 size={14} /> Sound design</div><button className="icon-btn !w-8 !h-8 !rounded-xl" aria-label="Close" onClick={() => setOpen(false)}><X size={14} /></button></div>
          <SoundControls compact />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Navigation ───────────────────────── */
function Logo({ small = false }: { small?: boolean }) {
  const { go } = useApp();
  return (
    <button onClick={() => go("home")} className="flex items-center gap-3 text-left" aria-label="MSD — The Legend home">
      <DotText text="MSD" cell={small ? 3 : 4} animate={false} />
      {!small && <div className="mono text-[9px] leading-tight text-muted">The<br /><span className="text-accent">Legend</span></div>}
    </button>
  );
}

export function Sidebar() {
  const { view, go, theme, setTheme, canInstall, install, online } = useApp();
  return (
    <aside className="no-mobile fixed left-0 top-0 bottom-0 w-[260px] z-50 p-4 flex flex-col" aria-label="Primary">
      <div className="glass glass-strong flex-1 flex flex-col !rounded-[28px] min-h-0">
        <div className="p-5 pb-3"><Logo /></div>
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-1" aria-label="Sections">
          {SECTIONS.map((s) => {
            const active = view === s.id;
            return (
              <button key={s.id} onClick={() => go(s.id)} aria-current={active ? "page" : undefined} className={`relative w-full flex items-center gap-3 px-3 min-h-[40px] rounded-xl text-left transition-colors group ${active ? "text-accent bg-accent/10" : "text-muted hover:text-ink hover:bg-white/5"}`}>
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent shadow-[0_0_12px_var(--glow)]" />}
                <span className="mono text-[9px] w-5 opacity-60">{s.no}</span>
                <Icon name={s.icon} size={16} />
                <span className="text-[13px] font-medium truncate">{s.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 pt-3 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="mono text-[9px] text-muted">Theme</span>
            <div className="flex gap-2">
              {THEME_ORDER.map((t) => (
                <button key={t} aria-label={`Theme ${THEMES[t].name}`} aria-pressed={theme === t} onClick={() => setTheme(t)} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${theme === t ? "border-ink scale-110" : "border-transparent"}`} style={{ background: `linear-gradient(135deg, ${THEMES[t].accent} 50%, ${THEMES[t].accent2} 50%)` }} />
              ))}
            </div>
          </div>
          {canInstall && <button className="btn btn-sm w-full" onClick={install}><Download size={14} /> Install app</button>}
          <div className="flex items-center justify-between mono text-[9px] text-muted">
            <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"}`} />{online ? "Online" : "Offline"}</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function TopControls() {
  const { setSearchOpen, fullscreen, toggleFullscreen, setHelpOpen, online, back, view, canBack } = useApp();
  return (
    <>
      {/* desktop floating controls */}
      <div className="no-mobile fixed top-4 right-6 z-[60] glass glass-strong !rounded-full p-1.5 flex items-center gap-1.5">
        {canBack && <button className="icon-btn !rounded-full" aria-label="Go back" onClick={back}><ArrowLeft size={18} /></button>}
        {!online && <span className="chip chip-approx"><WifiOff size={12} /> Offline</span>}
        <button className="flex items-center gap-2 px-4 h-11 rounded-full text-muted hover:text-ink text-sm" onClick={() => setSearchOpen(true)} aria-label="Search"><Search size={16} /> <span>Search</span><kbd className="mono text-[9px] border border-line rounded px-1.5 py-0.5">/</kbd></button>
        <SoundPopover />
        <button className="icon-btn !rounded-full" aria-label="Keyboard shortcuts" onClick={() => setHelpOpen(true)}><Keyboard size={18} /></button>
        <button className={`icon-btn !rounded-full ${fullscreen ? "on" : ""}`} aria-pressed={fullscreen} aria-label="Toggle fullscreen" onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
      </div>
      {/* mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-[60] px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2">
        <div className="glass glass-strong !rounded-[22px] flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            {view !== "home" && <button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Go back" onClick={back}><ArrowLeft size={18} /></button>}
            <Logo small />
          </div>
          <div className="flex items-center gap-2">
            {!online && <span className="chip chip-approx"><WifiOff size={11} /></span>}
            <button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={17} /></button>
            <SoundPopover />
            <button className={`icon-btn !w-10 !h-10 !rounded-xl ${fullscreen ? "on" : ""}`} aria-pressed={fullscreen} aria-label="Toggle fullscreen" onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          </div>
        </div>
      </header>
    </>
  );
}

export function BottomNav() {
  const { view, go } = useApp();
  const [more, setMore] = useState(false);
  const primary = ["home", "career", "trophy-room", "quiz"];
  const inMore = !primary.includes(view);
  return (
    <>
      {more && (
        <div className="lg:hidden fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={() => setMore(false)}>
          <div className="glass glass-strong absolute left-3 right-3 bottom-[calc(84px+env(safe-area-inset-bottom))] p-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow mb-3">All sections</div>
            <div className="grid grid-cols-3 gap-2">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => { setMore(false); go(s.id); }} aria-current={view === s.id ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1.5 min-h-[76px] rounded-2xl border text-center px-1 ${view === s.id ? "border-accent text-accent bg-accent/10" : "border-line text-muted"}`}>
                  <Icon name={s.icon} size={20} />
                  <span className="text-[11px] font-medium leading-tight">{s.short}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[75] px-3 pb-[max(10px,env(safe-area-inset-bottom))]" aria-label="Primary">
        <div className="glass glass-strong !rounded-[26px] grid grid-cols-5 p-1.5">
          {primary.map((id) => {
            const s = SECTIONS.find((x) => x.id === id)!;
            const active = view === id;
            return <NavBtn key={id} active={active} icon={s.icon} label={s.short} onClick={() => { setMore(false); go(id); }} />;
          })}
          <button onClick={() => setMore((m) => !m)} aria-expanded={more} aria-label="More sections" className={`relative flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-[20px] ${more || inMore ? "text-accent" : "text-muted"}`}>
            {(more || inMore) && <span className="absolute inset-0 rounded-[20px] bg-accent/12" />}
            <Menu size={20} className="relative" />
            <span className="relative mono text-[8px]">{inMore && !more ? SECTIONS.find((s) => s.id === view)?.short : "More"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
function NavBtn({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined} className={`relative flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-[20px] transition-colors ${active ? "text-accent" : "text-muted"}`}>
      {active && <span className="absolute inset-0 rounded-[20px] bg-accent/12 shadow-[inset_0_0_0_1px_var(--line)]" />}
      <Icon name={icon} size={20} className="relative" />
      <span className="relative mono text-[8px]">{label}</span>
    </button>
  );
}

/* ───────────────────────── Search ───────────────────────── */
interface Hit { type: string; title: string; sub: string; view: string; id?: string; kw: string }
export function SearchModal() {
  const { searchOpen, setSearchOpen, go } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const index = useMemo<Hit[]>(() => [
    ...SECTIONS.map((s) => ({ type: "Section " + s.no, title: s.label, sub: s.blurb, view: s.id, kw: s.keywords })),
    ...MOMENTS.map((m) => ({ type: "Moment", title: m.title, sub: `${m.date} · ${m.venue}`, view: "moments", id: m.id, kw: m.detail })),
    ...TROPHIES.map((t) => ({ type: "Trophy", title: `${t.name} ${t.year}`, sub: t.role, view: "trophy-room", id: t.id, kw: t.story })),
    ...CAREER.map((c) => ({ type: "Timeline", title: c.title, sub: c.date, view: "career", id: c.id, kw: c.text })),
    ...PHOTOS.map((p) => ({ type: "Photo", title: p.title, sub: `By ${p.author} · ${p.license}`, view: "media", id: p.id, kw: p.caption })),
  ], []);
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return index.filter((h) => h.type.startsWith("Section"));
    return index.filter((h) => (h.title + " " + h.sub + " " + h.kw).toLowerCase().includes(t)).slice(0, 30);
  }, [q, index]);
  useEffect(() => { if (searchOpen) { setQ(""); setSel(0); setTimeout(() => input.current?.focus(), 50); } }, [searchOpen]);
  useEffect(() => setSel(0), [q]);
  const choose = (h: Hit) => { setSearchOpen(false); go(h.view, h.id); };
  if (!searchOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md grid place-items-start justify-items-center p-4 pt-[10vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }} role="dialog" aria-modal="true" aria-label="Global search">
      <div className="glass glass-strong w-full max-w-2xl !rounded-[26px]">
        <div className="flex items-center gap-3 px-5 border-b border-line">
          <Search size={18} className="text-accent" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sections, moments, trophies, timeline…" aria-label="Search" className="flex-1 bg-transparent outline-none h-14 text-base placeholder:text-muted"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              else if (e.key === "Enter" && hits[sel]) choose(hits[sel]);
              else if (e.key === "Escape") setSearchOpen(false);
            }} />
          <button className="icon-btn !w-9 !h-9 !rounded-xl" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={16} /></button>
        </div>
        <ul className="max-h-[56vh] overflow-y-auto p-2" role="listbox">
          {hits.length === 0 && <li className="p-6 text-center text-muted text-sm">No results for “{q}”. Try “world cup”, “CSK” or “2011”.</li>}
          {hits.map((h, i) => (
            <li key={h.type + h.title + i} role="option" aria-selected={i === sel}>
              <button onMouseEnter={() => setSel(i)} onClick={() => choose(h)} className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl ${i === sel ? "bg-accent/12" : ""}`}>
                <span className="mono text-[9px] text-accent w-24 shrink-0">{h.type}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate">{h.title}</span><span className="block text-xs text-muted truncate">{h.sub}</span></span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-line mono text-[9px] text-muted flex gap-4"><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></div>
      </div>
    </div>
  );
}

/* ───────────────────────── Misc overlays ───────────────────────── */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const { settings, reduced } = useApp();
  const enabled = settings.cursor && !device.touch && !reduced;
  useEffect(() => {
    if (!enabled) return;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const mv = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      ring.current?.classList.toggle("hot", !!(e.target as HTMLElement)?.closest?.("button, a, [role=button], input, .tab, [data-hot]"));
    };
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${x}px,${y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", mv);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("pointermove", mv); cancelAnimationFrame(raf); };
  }, [enabled]);
  if (!enabled) return null;
  return (<><div ref={ring} className="cursor-ring no-mobile" /><div ref={dot} className="cursor-dot no-mobile" /></>);
}

export function ToastHost() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed z-[250] left-1/2 -translate-x-1/2 bottom-[calc(92px+env(safe-area-inset-bottom))] lg:bottom-8 flex flex-col gap-2 items-center w-[min(94vw,440px)] pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`glass glass-strong pointer-events-auto !rounded-2xl px-4 py-3 w-full flex items-center gap-3 text-sm border ${t.kind === "err" ? "!border-red-400/50" : t.kind === "warn" ? "!border-amber-400/50" : t.kind === "ok" ? "!border-accent/50" : ""}`} role="status">
          <span className="flex-1">{t.msg}</span>
          {t.action && <button className="btn btn-sm" onClick={() => { t.action!.run(); dismissToast(t.id); }}><RefreshCw size={13} /> {t.action.label}</button>}
          <button aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="text-muted hover:text-ink"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}

export function SoundPrompt() {
  const { soundPrompt, answerSoundPrompt } = useApp();
  if (!soundPrompt) return null;
  return (
    <div className="fixed inset-0 z-[260] grid place-items-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sound permission">
      <div className="glass glass-strong max-w-md w-full p-7 text-center">
        <div className="mx-auto w-16 h-16 rounded-full grid place-items-center bg-accent/15 text-accent mb-5"><Volume2 size={28} /></div>
        <h2 className="h-display text-3xl">Turn on the stadium?</h2>
        <p className="text-sm text-muted mt-3 leading-relaxed">MSD — THE LEGEND has optional sound design: UI clicks, theme-switch and trophy-unlock effects, stadium ambience and an original generative music player. Nothing plays unless you allow it, and you can change this anytime in Settings.</p>
        <div className="grid gap-3 mt-7">
          <button className="btn" onClick={() => answerSoundPrompt("ok")}>OK — enable sound</button>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-ghost" onClick={() => answerSoundPrompt("later")}>Not now</button>
            <button className="btn btn-ghost" onClick={() => answerSoundPrompt("never")}>Don't show again</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShortcutHelp() {
  const { helpOpen, setHelpOpen } = useApp();
  const rows: [string, string][] = [["/ or Ctrl+K", "Global search"], ["1 – 9, 0", "Sections 01–10"], ["Shift + 1–4", "Sections 11–14"], ["[  ]", "Previous / next section"], ["H", "Home"], ["T", "Cycle theme"], ["M", "Mute / unmute"], ["F", "Fullscreen"], ["S", "Settings"], ["?", "This help"], ["Esc", "Close dialogs"]];
  return (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts">
      <div className="eyebrow mb-4">Keyboard shortcuts</div>
      <ul className="divide-y divide-line">
        {rows.map(([k, d]) => <li key={k} className="flex justify-between py-2.5 text-sm"><kbd className="mono text-[11px] border border-line rounded-lg px-2 py-1 bg-white/5">{k}</kbd><span className="text-muted">{d}</span></li>)}
      </ul>
      <button className="btn w-full mt-6" onClick={() => setHelpOpen(false)}>Got it</button>
    </Modal>
  );
}

export function FpsHud() {
  const { settings, quality } = useApp();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!settings.showFps) return;
    const id = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [settings.showFps]);
  if (!settings.showFps) return null;
  return (
    <div className="fixed left-3 top-20 lg:top-4 lg:left-[280px] z-[210] mono text-[10px] glass !rounded-xl px-3 py-2 pointer-events-none">
      3D {perfStats.kind} · {perfStats.fps} fps · q{perfStats.quality}/{quality} · {perfStats.draws} draws · {device.cores}c
    </div>
  );
}
