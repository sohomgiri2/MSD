import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, scrollToEl } from "../lib/motion";
import { CAREER } from "../lib/data";
import { Reveal, Tag, TiltCard, ViewHeader, useFocus } from "../components/ui";
import { useApp } from "../state";

const ERAS = ["All", "Rise", "Captain", "Summit", "Twilight", "Farewell"] as const;
const ERA_NOTE: Record<string, string> = {
  Rise: "From Ranchi to the India cap",
  Captain: "A young captain, a new era",
  Summit: "World champions",
  Twilight: "The long goodbye begins",
  Farewell: "Quiet exits, loud echoes",
};

export default function Career() {
  const { reduced } = useApp();
  const [era, setEra] = useState<(typeof ERAS)[number]>("All");
  const [hl, setHl] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const events = useMemo(() => CAREER.filter((c) => era === "All" || c.era === era), [era]);

  useEffect(() => {
    const el = list.current;
    const f = fill.current;
    if (!el || !f || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(f, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 65%", end: "bottom 65%", scrub: 0.4 } });
    }, el);
    const t = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => { clearTimeout(t); ctx.revert(); };
  }, [events, reduced]);

  useFocus("career", (id) => {
    setEra("All");
    setHl(id);
    setTimeout(() => scrollToEl(document.getElementById(`ev-${id}`)), 250);
    setTimeout(() => setHl(null), 3500);
  });

  const years = Array.from(new Set(CAREER.map((c) => c.year)));

  return (
    <div className="view-pad">
      <ViewHeader no="02" title="Career Journey" sub="Debut to retirement" />
      <div className="flex gap-2 flex-wrap mb-6" role="tablist" aria-label="Filter by era">
        {ERAS.map((e) => <button key={e} role="tab" aria-selected={era === e} className={`tab ${era === e ? "active" : ""}`} onClick={() => setEra(e)}>{e}</button>)}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-10" aria-label="Jump to year">
        {years.map((y) => {
          const id = CAREER.find((c) => c.year === y)!.id;
          return <button key={y} className="chip whitespace-nowrap hover:text-accent hover:border-accent" onClick={() => { setEra("All"); setTimeout(() => scrollToEl(document.getElementById(`ev-${id}`)), 120); }}>{y}</button>;
        })}
      </div>

      <div ref={list} className="relative">
        <div className="absolute left-[15px] lg:left-1/2 top-0 bottom-0 w-px bg-line -translate-x-1/2" aria-hidden />
        <div ref={fill} className="absolute left-[15px] lg:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 origin-top bg-accent shadow-[0_0_18px_var(--glow)]" aria-hidden />
        <ol className="space-y-8 lg:space-y-4">
          {events.map((c, i) => {
            const left = i % 2 === 0;
            const first = i === 0 || events[i - 1].era !== c.era;
            return (
              <li key={c.id} id={`ev-${c.id}`} className="relative lg:grid lg:grid-cols-2 lg:gap-16 pl-12 lg:pl-0">
                {first && (
                  <div className="mb-4 lg:col-span-2 lg:text-center">
                    <span className="inline-block chip !text-accent !border-accent/40 bg-bg">{c.era} · {ERA_NOTE[c.era]}</span>
                  </div>
                )}
                <span className={`absolute left-[15px] lg:left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-accent bg-bg grid place-items-center ${hl === c.id ? "scale-150 bg-accent" : ""} transition-transform`} aria-hidden><i className="w-1.5 h-1.5 rounded-full bg-accent" /></span>
                <Reveal className={left ? "lg:col-start-1" : "lg:col-start-2"}>
                  <TiltCard className={`p-6 lg:p-7 ${hl === c.id ? "!border-accent shadow-[0_0_40px_var(--glow)]" : ""}`} max={4}>
                    <div className="relative z-[1]">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <span className="h-display text-5xl text-gold">{c.year}</span>
                        <Tag v={c.tag} />
                      </div>
                      <div className="mono text-[10px] text-muted mb-3">{c.date}</div>
                      <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
                      <p className="text-sm text-muted leading-relaxed">{c.text}</p>
                    </div>
                  </TiltCard>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-xs text-muted mt-12 max-w-2xl">Dates marked “Approx.” are approximate. Everything else reflects widely documented records; please cross-check with ESPNcricinfo or the ICC for official scorecards.</p>
    </div>
  );
}
