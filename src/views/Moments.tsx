import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MOMENTS, type Moment } from "../lib/data";
import { DotText, Modal, Reveal, Tag, TiltCard, ViewHeader, useFocus } from "../components/ui";
import { sound } from "../lib/sound";

const FILTERS = ["ALL", "ODI", "T20", "TEST", "IPL", "OFF"] as const;

export default function Moments() {
  const [f, setF] = useState<(typeof FILTERS)[number]>("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const list = useMemo(() => MOMENTS.filter((m) => f === "ALL" || m.fmt === f), [f]);
  const cur = list.findIndex((m) => m.id === open);
  const m: Moment | null = cur >= 0 ? list[cur] : null;
  useFocus("moments", (id) => { setF("ALL"); setOpen(id); });
  useEffect(() => {
    if (!m) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { setOpen(list[(cur + 1) % list.length].id); sound.play("tick"); }
      if (e.key === "ArrowLeft") { setOpen(list[(cur - 1 + list.length) % list.length].id); sound.play("tick"); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [m, cur, list]);

  const scroll = (d: number) => strip.current?.scrollBy({ left: d * 340, behavior: "smooth" });

  return (
    <div className="view-pad">
      <ViewHeader no="09" title="Legendary Moments" sub="The film strip">
        <div className="hidden lg:flex gap-2"><button className="icon-btn" aria-label="Scroll left" onClick={() => scroll(-1)}><ChevronLeft size={18} /></button><button className="icon-btn" aria-label="Scroll right" onClick={() => scroll(1)}><ChevronRight size={18} /></button></div>
      </ViewHeader>
      <div className="flex gap-2 flex-wrap mb-8" role="tablist" aria-label="Filter moments">
        {FILTERS.map((x) => <button key={x} role="tab" aria-selected={f === x} className={`tab ${f === x ? "active" : ""}`} onClick={() => setF(x)}>{x === "OFF" ? "Off-field" : x}</button>)}
      </div>

      <div ref={strip} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 -mx-5 px-5 lg:mx-0 lg:px-0 no-scrollbar" tabIndex={0} aria-label="Moments film strip">
        {list.map((x, i) => (
          <Reveal key={x.id} delay={(i % 4) * 60} className="snap-start shrink-0">
            <TiltCard className="w-[78vw] sm:w-[320px] h-[460px] cursor-pointer group" max={6} onClick={() => setOpen(x.id)}>
              <button className="relative z-[1] w-full h-full text-left p-6 flex flex-col justify-between" aria-label={`Open moment: ${x.title}`}>
                <div className="absolute inset-0 -z-[1] opacity-[.18] group-hover:opacity-30 transition-opacity" style={{ background: "repeating-linear-gradient(90deg, var(--accent) 0 1px, transparent 1px 22px)" }} />
                <div className="flex justify-between items-start"><span className="chip !text-accent">{x.fmt === "OFF" ? "OFF-FIELD" : x.fmt}</span><span className="mono text-[9px] text-muted">{String(i + 1).padStart(2, "0")}/{String(list.length).padStart(2, "0")}</span></div>
                <div><div className="overflow-hidden mb-4"><DotText text={x.date.match(/\d{4}/)?.[0] ?? ""} cell={7} animate={false} /></div>
                  <div className="mono text-[9px] text-muted">{x.date} · {x.venue}</div>
                  <h3 className="h-display text-3xl mt-2">{x.title}</h3>
                  <p className="text-sm text-muted mt-2">{x.blurb}</p></div>
                <div className="flex justify-between items-center"><Tag v={x.tag} /><span className="mono text-[9px] text-accent group-hover:translate-x-1 transition-transform">Open →</span></div>
              </button>
            </TiltCard>
          </Reveal>
        ))}
      </div>
      <p className="text-xs text-muted mt-6">Swipe or use the arrows. Each moment separates verified facts from clearly labelled fan views.</p>

      <Modal open={!!m} onClose={() => setOpen(null)} title={m?.title ?? "Moment"} wide>
        {m && (
          <div>
            <div className="flex items-center justify-between mb-4"><div className="flex gap-2 items-center"><span className="chip !text-accent">{m.fmt}</span><Tag v={m.tag} /></div><button className="icon-btn !w-10 !h-10" aria-label="Close" onClick={() => setOpen(null)}><X size={16} /></button></div>
            <div className="mb-3 overflow-hidden"><DotText text={m.date.match(/\d{4}/)?.[0] ?? ""} cell={9} /></div>
            <div className="mono text-[10px] text-muted">{m.date} · {m.venue}</div>
            <h2 className="h-display text-4xl lg:text-6xl mt-2 text-gold">{m.title}</h2>
            <p className="text-ink/90 mt-5 leading-relaxed text-lg">{m.detail}</p>
            <div className="mt-6 p-4 rounded-2xl border border-dashed border-[rgba(212,155,255,.4)] bg-[rgba(212,155,255,.06)]"><Tag v="fan" /><p className="text-sm text-muted mt-2 italic">{m.fan}</p></div>
            <div className="flex justify-between mt-8">
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(list[(cur - 1 + list.length) % list.length].id)}><ChevronLeft size={14} /> Previous</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(list[(cur + 1) % list.length].id)}>Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
