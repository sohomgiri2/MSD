import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Smartphone } from "lucide-react";
import Scene3D, { requestGyro } from "../components/Scene3D";
import { Counter, DotText, Icon, Magnetic, Reveal, SplitHeading, Tag, TiltCard } from "../components/ui";
import { CAREER, MOMENTS, SECTIONS } from "../lib/data";
import { THEMES, THEME_ORDER } from "../lib/themes";
import { device } from "../lib/perf";
import { useApp } from "../state";
import type { SceneHandle } from "../three/engine";

export default function Home() {
  const { go, theme, setTheme, settings, toast } = useApp();
  const handle = useRef<SceneHandle | null>(null);
  const [gyroAsk] = useState(() => device.touch && typeof (window.DeviceOrientationEvent as unknown as { requestPermission?: unknown })?.requestPermission === "function");
  const day = Math.floor(Date.now() / 86400000);
  const moment = MOMENTS[day % MOMENTS.length];

  useEffect(() => {
    const fn = () => handle.current?.setPaused(window.scrollY > window.innerHeight * 1.7);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="relative">
      {/* fixed 3D stadium behind everything on this screen */}
      <Scene3D kind="hero" scrollLink interactive={false} className="fixed inset-0 z-0" label="MSD" onReady={(h) => { handle.current = h; }} />
      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(70%_60%_at_30%_55%,rgba(0,0,0,.55),transparent_70%),linear-gradient(to_top,var(--bg)_0%,rgba(0,0,0,.6)_40%,transparent_75%)]" />

      {/* HERO */}
      <section className="relative z-[2] min-h-[100svh] flex items-end lg:items-center px-5 lg:px-16 pb-36 lg:pb-0 pt-28">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="eyebrow">● Unofficial fan tribute</span>
            <span className="chip">No. 07</span>
          </div>
          <div className="mb-3 overflow-hidden"><DotText text="MSD" cell={device.mobile ? 11 : 17} /></div>
          <SplitHeading text="THE LEGEND" delay={0.3} wordClass="text-gold" className="h-display text-[clamp(3rem,10vw,8.5rem)] mb-5" />
          <p className="mono text-xs sm:text-sm text-ink/90 tracking-[0.35em]">BEYOND CRICKET. BEYOND TIME.</p>
          <p className="text-muted mt-5 max-w-lg leading-relaxed text-[15px]">A cinematic 3D museum of the captain who finished it off — from a Ranchi railway platform to three ICC trophies and five IPL stars. Drag, scroll, explore.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Magnetic><button className="btn" onClick={() => go("career")}>Begin the journey <ArrowUpRight size={16} /></button></Magnetic>
            <Magnetic><button className="btn btn-ghost" onClick={() => go("trophy-room")}>Enter trophy room</button></Magnetic>
            {gyroAsk && settings.gyro && (
              <button className="btn btn-ghost" onClick={async () => { const ok = await requestGyro(); toast(ok ? "Motion parallax enabled — tilt your phone" : "Motion access was not granted", ok ? "ok" : "warn"); }}><Smartphone size={16} /> Enable tilt</button>
            )}
          </div>
        </div>
        <div className="absolute bottom-8 right-8 hidden lg:flex flex-col items-center gap-2 mono text-[9px] text-muted"><span>Scroll</span><ChevronDown size={16} className="animate-bounce" /></div>
      </section>

      {/* STATS STRIP */}
      <section className="relative z-[2] bg-bg">
        <div className="h-24 -mt-24 bg-gradient-to-b from-transparent to-bg" />
        <div className="max-w-[1320px] mx-auto px-5 lg:px-12 py-10">
          <Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-line rounded-[28px] overflow-hidden border border-line">
              {[
                { to: 538, k: "International matches", t: "verified" as const },
                { to: 17266, k: "International runs", t: "verified" as const },
                { to: 829, k: "Dismissals as keeper", t: "verified" as const },
                { to: 3, k: "ICC white-ball trophies", t: "verified" as const },
                { to: 5, k: "IPL titles · CSK", t: "verified" as const },
              ].map((s) => (
                <div key={s.k} className="bg-bg2 p-6 lg:p-8 text-center lg:text-left">
                  <div className="h-display text-4xl lg:text-5xl text-accent"><Counter to={s.to} /></div>
                  <div className="mono text-[9px] text-muted mt-2">{s.k}</div>
                  <div className="mt-3 hidden lg:block"><Tag v={s.t} /></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative z-[2] bg-bg overflow-hidden py-6 border-y border-line" aria-hidden>
        <div className="marquee mono text-[11px] text-muted">
          {[...CAREER, ...CAREER].map((c, i) => <span key={i} className="flex items-center gap-4"><b className="text-accent">{c.year}</b>{c.title}<span className="text-line">◆</span></span>)}
        </div>
      </section>

      {/* CHAPTERS */}
      <section className="relative z-[2] bg-bg">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-12 py-16 lg:py-24">
          <Reveal><div className="eyebrow mb-3">Chapters</div><h2 className="h-display text-4xl lg:text-6xl mb-10">Fourteen independent <span className="text-accent-grad italic">screens</span></h2></Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-[150px] lg:auto-rows-[190px]">
            {SECTIONS.filter((s) => s.id !== "home").map((s, i) => {
              const big = ["career", "trophy-room", "quiz"].includes(s.id);
              return (
                <Reveal key={s.id} delay={(i % 4) * 70} className={big ? "col-span-2 row-span-1 lg:row-span-2" : ""}>
                  <TiltCard className="h-full cursor-pointer group" onClick={() => go(s.id)}>
                    <button className="relative z-[1] h-full w-full text-left p-5 lg:p-6 flex flex-col justify-between" aria-label={`Open ${s.label}`}>
                      <div className="flex items-start justify-between">
                        <span className="mono text-[10px] text-accent">{s.no}</span>
                        <Icon name={s.icon} size={big ? 26 : 20} className="text-muted group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <div className={`h-display ${big ? "text-3xl lg:text-5xl" : "text-xl lg:text-2xl"} leading-none`}>{s.label}</div>
                        <div className="text-xs text-muted mt-2">{s.blurb}</div>
                      </div>
                      <ArrowUpRight className="absolute right-5 bottom-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                    </button>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* MOMENT OF THE DAY + THEME */}
      <section className="relative z-[2] bg-bg">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-12 pb-20 grid lg:grid-cols-[1.4fr_1fr] gap-4">
          <Reveal>
            <TiltCard className="p-7 lg:p-10 h-full" max={4}>
              <div className="relative z-[1]">
                <div className="flex items-center gap-3 mb-5"><span className="eyebrow">Moment of the day</span><Tag v={moment.tag} /></div>
                <div className="mono text-[10px] text-muted">{moment.date} · {moment.venue}</div>
                <h3 className="h-display text-4xl lg:text-5xl mt-2">{moment.title}</h3>
                <p className="text-muted mt-4 leading-relaxed max-w-xl">{moment.detail}</p>
                <button className="btn btn-ghost btn-sm mt-6" onClick={() => go("moments", moment.id)}>Open in Moments <ArrowUpRight size={14} /></button>
              </div>
            </TiltCard>
          </Reveal>
          <Reveal delay={100}>
            <TiltCard className="p-7 lg:p-8 h-full" max={4}>
              <div className="relative z-[1]">
                <div className="eyebrow mb-4">Pick your universe</div>
                <div className="grid gap-3">
                  {THEME_ORDER.map((t) => (
                    <button key={t} onClick={() => setTheme(t)} aria-pressed={theme === t} className={`flex items-center gap-4 p-3 rounded-2xl border text-left transition-all ${theme === t ? "border-accent bg-accent/10" : "border-line hover:border-accent/50"}`}>
                      <span className="w-12 h-12 rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${THEMES[t].accent}, ${THEMES[t].accent2})` }} />
                      <span><span className="block text-sm font-semibold">{THEMES[t].name}</span><span className="block text-xs text-muted">{THEMES[t].tagline}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
