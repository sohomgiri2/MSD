import { ArrowUpRight } from "lucide-react";
import Scene3D from "../components/Scene3D";
import { DotText, Magnetic, Reveal, SplitHeading, TiltCard, ViewHeader } from "../components/ui";
import { PHOTOS } from "../lib/data";

const Github = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>
);
const Instagram = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);

const STACK = [
  { g: "Interface", items: ["React 19", "TypeScript", "Tailwind CSS 4", "Vite 7"] },
  { g: "3D & motion", items: ["Three.js (WebGL)", "GSAP + ScrollTrigger", "Lenis smooth scroll", "CSS 3D fallback"] },
  { g: "Data & platform", items: ["IndexedDB", "LocalStorage", "Service Worker / PWA", "Web Audio API"] },
];
const PROJECTS = [
  { n: "MSD — THE LEGEND", d: "This cinematic, offline-capable fan museum: 14 independent screens, procedural 3D, three themes, local-first data vault.", t: "React · Three.js · PWA", href: "" },
  { n: "Virat Kohli fan website", d: "An earlier cricket tribute project that inspired the design ambition of this one.", t: "Web · Fan project", href: "" },
  { n: "More on GitHub", d: "Browse repositories and experiments by Sohom Giri.", t: "github.com/sohomgiri2", href: "https://github.com/sohomgiri2" },
];
const PHIL = [
  ["Cinema, not clutter", "Every screen should have one idea, one mood and one unforgettable moment."],
  ["Honest by design", "Facts are labelled. Approximations are flagged. Fan love never replaces accuracy."],
  ["Fast on real phones", "Adaptive 3D, lazy loading and performance modes mean a mid-range Android feels premium too."],
  ["Local-first", "Your data stays on your device — exportable, deletable, never claimed to be permanent."],
];
const CREDITS = [
  ["Three.js", "WebGL rendering"], ["GSAP", "Animation & ScrollTrigger"], ["Lenis", "Smooth scrolling"], ["React & Vite", "Application framework & tooling"], ["Tailwind CSS", "Styling"], ["Lucide", "Icon set"],
  ["Google Fonts", "Space Grotesk · JetBrains Mono · Playfair Display"], ["Wikimedia Commons", `Photography: ${Array.from(new Set(PHOTOS.map((p) => p.author))).join(", ")}`],
];

export default function Developer() {
  return (
    <div className="view-pad">
      <ViewHeader no="13" title="Developer Studio" sub="The maker behind the legend" />

      <section className="grid lg:grid-cols-2 gap-6 items-center mb-20">
        <div className="glass !rounded-[36px] h-[420px] lg:h-[520px] relative" style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,.08), transparent 60%)" }}>
          <Scene3D kind="emblem" text="SG" className="absolute inset-0" label="SG" interactive />
          <div className="absolute bottom-5 inset-x-0 text-center mono text-[9px] text-muted pointer-events-none">Animated 3D SG emblem · drag to rotate</div>
        </div>
        <div>
          <div className="mono text-[11px] text-accent tracking-[0.4em] mb-4">DESIGNER • DEVELOPER • CREATOR</div>
          <div className="mb-5 overflow-hidden"><DotText text="SOHOM" cell={10} /></div>
          <SplitHeading tag="h2" text="Sohom Giri" wordClass="text-gold" className="h-display text-6xl lg:text-8xl" />
          <p className="text-muted mt-6 leading-relaxed max-w-lg">I design and build immersive web experiences where sport, cinema and engineering meet. MSD — THE LEGEND is a fan-made love letter to a captain who made calm look cinematic — built to feel like a digital museum.</p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <Magnetic><a className="btn" href="https://github.com/sohomgiri2" target="_blank" rel="noopener noreferrer"><Github size={16} /> GitHub <ArrowUpRight size={14} /></a></Magnetic>
            <Magnetic><a className="btn btn-ghost" href="https://instagram.com/itz_sg_063" target="_blank" rel="noopener noreferrer"><Instagram size={16} /> @itz_sg_063 <ArrowUpRight size={14} /></a></Magnetic>
          </div>
        </div>
      </section>

      <Reveal><div className="eyebrow mb-5">Technology stack</div></Reveal>
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        {STACK.map((s, i) => (
          <Reveal key={s.g} delay={i * 80}><TiltCard className="p-6 h-full" max={5}><div className="relative z-[1]"><div className="mono text-[10px] text-accent mb-4">{s.g}</div><div className="flex flex-wrap gap-2">{s.items.map((x) => <span key={x} className="chip !text-ink">{x}</span>)}</div></div></TiltCard></Reveal>
        ))}
      </div>

      <Reveal><div className="eyebrow mb-5">Portfolio</div></Reveal>
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.n} delay={i * 80}><TiltCard className="p-6 h-full" max={5}><div className="relative z-[1] flex flex-col h-full">
            <div className="mono text-[9px] text-muted">{String(i + 1).padStart(2, "0")} · {p.t}</div>
            <h3 className="h-display text-2xl mt-3">{p.n}</h3><p className="text-sm text-muted mt-3 flex-1">{p.d}</p>
            {p.href ? <a className="btn btn-ghost btn-sm mt-5 w-fit" href={p.href} target="_blank" rel="noopener noreferrer">Visit <ArrowUpRight size={13} /></a> : <span className="mono text-[9px] text-accent mt-5">{i === 0 ? "You are here" : "Previous work"}</span>}
          </div></TiltCard></Reveal>
        ))}
      </div>

      <Reveal><div className="eyebrow mb-5">Creative philosophy</div></Reveal>
      <div className="grid sm:grid-cols-2 gap-4 mb-16">
        {PHIL.map(([t, d], i) => <Reveal key={t} delay={i * 60}><div className="glass p-6 h-full"><div className="relative z-[1]"><div className="h-display text-5xl text-accent/40">{String(i + 1).padStart(2, "0")}</div><h3 className="text-lg font-semibold mt-2">{t}</h3><p className="text-sm text-muted mt-2">{d}</p></div></div></Reveal>)}
      </div>

      <Reveal><div className="eyebrow mb-5">Credits & acknowledgements</div></Reveal>
      <div className="glass p-6 lg:p-8 mb-16"><ul className="relative z-[1] grid sm:grid-cols-2 gap-x-10 gap-y-4">{CREDITS.map(([a, b]) => <li key={a} className="flex flex-col"><b className="text-sm">{a}</b><span className="text-xs text-muted">{b}</span></li>)}</ul>
        <p className="relative z-[1] text-xs text-muted mt-6 border-t border-line pt-4">With gratitude to Mahendra Singh Dhoni for the inspiration. This is an unofficial fan project and is not endorsed by MS Dhoni, BCCI, ICC or CSK.</p></div>

      <div className="text-center py-10" aria-label="Developer signature: Sohom Giri">
        <svg viewBox="0 0 700 150" className="w-full max-w-xl mx-auto" role="img" aria-label="Sohom Giri signature">
          <style>{`.sig{font:italic 700 96px "Playfair Display",Georgia,serif;fill:transparent;stroke:var(--accent);stroke-width:1.6;stroke-dasharray:1400;stroke-dashoffset:1400;animation:sigdraw 4.5s ease forwards, sigfill 1.2s 3.6s ease forwards}@keyframes sigdraw{to{stroke-dashoffset:0}}@keyframes sigfill{to{fill:var(--accent);stroke-width:0}}`}</style>
          <text x="350" y="105" textAnchor="middle" className="sig">Sohom Giri</text>
        </svg>
        <div className="mono text-[10px] text-muted mt-2">Designed & developed with care · v1.0.0</div>
      </div>
    </div>
  );
}
