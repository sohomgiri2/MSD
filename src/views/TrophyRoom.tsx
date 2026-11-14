import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Minus, Pause, Play, Plus, RotateCcw, Unlock } from "lucide-react";
import Scene3D from "../components/Scene3D";
import { Reveal, Tag, ViewHeader, useFocus } from "../components/ui";
import { TROPHIES } from "../lib/data";
import { sound } from "../lib/sound";
import { useApp } from "../state";
import type { SceneHandle } from "../three/engine";

export default function TrophyRoom() {
  const { trophies, unlockTrophy, lockTrophies, toast, reduced } = useApp();
  const [idx, setIdx] = useState(1);
  const [auto, setAuto] = useState(true);
  const h = useRef<SceneHandle | null>(null);
  const t = TROPHIES[idx];
  const unlocked = trophies.includes(t.id);

  useFocus("trophy-room", (id) => { const i = TROPHIES.findIndex((x) => x.id === id); if (i >= 0) setIdx(i); });

  const select = useCallback((i: number) => { setIdx((i + TROPHIES.length) % TROPHIES.length); sound.play("tick"); }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight") select(idx + 1);
      if (e.key === "ArrowLeft") select(idx - 1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [idx, select]);
  useEffect(() => { h.current?.setAuto(auto); }, [auto]);

  const unlock = () => {
    unlockTrophy(t.id);
    sound.play("unlock");
    setTimeout(() => h.current?.reveal(), 60);
    toast(`Unlocked: ${t.name} ${t.year}`, "ok");
  };
  const unlockAll = () => {
    TROPHIES.forEach((x) => unlockTrophy(x.id));
    sound.play("unlock");
    setTimeout(() => h.current?.reveal(), 60);
  };

  return (
    <div className="view-pad">
      <ViewHeader no="04" title="Trophy Room" sub="Interactive 3D museum">
        <div className="flex items-center gap-3">
          <div className="text-right"><div className="h-display text-4xl text-gold">{trophies.length}<span className="text-muted text-2xl">/{TROPHIES.length}</span></div><div className="mono text-[9px] text-muted">Unlocked</div></div>
        </div>
      </ViewHeader>

      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-4">
        <div className="glass !rounded-[32px] relative min-h-[480px] h-[62vh] max-h-[720px]">
          <Scene3D kind="trophy" className="absolute inset-0" interactive trophy={{ kind: t.kind, unlocked }} onReady={(x) => { h.current = x; x?.setAuto(auto); }} label="🏆" />
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <span className="chip bg-black/40">{unlocked ? <><Unlock size={11} /> Unlocked</> : <><Lock size={11} /> Locked silhouette</>}</span>
            <span className="chip bg-black/40">Drag to rotate</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div className="glass glass-strong !rounded-2xl p-1.5 flex gap-1">
              <button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Previous trophy" onClick={() => select(idx - 1)}><ChevronLeft size={18} /></button>
              <button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Next trophy" onClick={() => select(idx + 1)}><ChevronRight size={18} /></button>
              <button className={`icon-btn !w-10 !h-10 !rounded-xl ${auto ? "on" : ""}`} aria-pressed={auto} aria-label="Auto rotate" onClick={() => setAuto((a) => !a)}>{auto ? <Pause size={16} /> : <Play size={16} />}</button>
              <button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Zoom in" onClick={() => h.current?.zoom(-1)}><Plus size={16} /></button>
              <button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Zoom out" onClick={() => h.current?.zoom(1)}><Minus size={16} /></button>
            </div>
            {!unlocked && <button className="btn" onClick={unlock}><Unlock size={15} /> Unlock</button>}
            {unlocked && !reduced && <button className="btn btn-ghost btn-sm" onClick={() => { h.current?.reveal(); sound.play("whoosh"); }}><RotateCcw size={14} /> Replay reveal</button>}
          </div>
        </div>

        <div className="glass p-6 lg:p-8 flex flex-col">
          <div className="relative z-[1] flex-1">
            <div className="flex items-center gap-2 mb-4 flex-wrap"><span className="eyebrow">{String(idx + 1).padStart(2, "0")} / {TROPHIES.length}</span><Tag v={t.tag} /></div>
            <h2 className="h-display text-4xl lg:text-5xl">{unlocked ? t.name : "Locked trophy"}</h2>
            <div className="h-display text-6xl lg:text-7xl text-gold mt-2">{t.year}</div>
            <div className="mono text-[10px] text-accent mt-3">{t.role}</div>
            <p className="text-muted mt-5 leading-relaxed">{unlocked ? t.story : "Press Unlock to reveal this trophy and read its story. Your progress is saved on this device."}</p>
            <p className="text-[11px] text-muted mt-6 border-t border-line pt-4">3D models are stylised procedural interpretations, not replicas of the real trophies.</p>
          </div>
          <div className="relative z-[1] flex gap-2 mt-4 flex-wrap">
            <button className="btn btn-ghost btn-sm" onClick={unlockAll}>Reveal all</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { lockTrophies(); toast("Trophy progress reset", "info"); }}>Reset progress</button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x" aria-label="Trophy collection">
        {TROPHIES.map((x, i) => {
          const u = trophies.includes(x.id);
          return (
            <Reveal key={x.id} delay={i * 40} className="snap-start shrink-0">
              <button onClick={() => select(i)} aria-pressed={i === idx} className={`glass w-[150px] p-4 text-left transition-all ${i === idx ? "!border-accent shadow-[0_0_30px_var(--glow)]" : ""}`}>
                <div className="relative z-[1]">
                  <div className="h-14 grid place-items-center text-3xl">{u ? "🏆" : <Lock className="text-muted" size={24} />}</div>
                  <div className="mono text-[9px] text-accent mt-2">{x.year}</div>
                  <div className="text-xs font-medium leading-tight mt-1 line-clamp-2">{u ? x.name : "Locked"}</div>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
