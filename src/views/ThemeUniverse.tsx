import { useEffect } from "react";
import { Check, Eye, RotateCcw, X } from "lucide-react";
import Scene3D from "../components/Scene3D";
import { DotText, Reveal, TiltCard, ViewHeader } from "../components/ui";
import { THEMES, THEME_ORDER, type ThemeId } from "../lib/themes";
import { device } from "../lib/perf";
import { useApp } from "../state";

const CHANGES = ["Backgrounds & atmosphere", "Buttons & switches", "Text accents", "Borders & glass cards", "Navigation (sidebar + bottom bar)", "3D lighting & reflections", "Particles & floodlights", "Loader & effects"];

function Mini({ id }: { id: ThemeId }) {
  const t = THEMES[id];
  return (
    <div data-theme={id} data-scope className="rounded-3xl p-4 border border-line relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${t.bg2}, ${t.bg})`, color: "var(--ink)" }}>
      <div className="absolute inset-0 dotgrid opacity-30" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <DotText text="MSD" cell={3} animate={false} />
          <div className="flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="w-6 h-1.5 rounded-full" style={{ background: i === 0 ? t.accent : "rgba(255,255,255,.15)" }} />)}</div>
        </div>
        <div className="rounded-2xl p-3 mb-3 border" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,.05)" }}>
          <div className="mono text-[8px]" style={{ color: t.accent }}>Featured</div>
          <div className="h-display text-xl">The Finisher</div>
          <div className="h-1 rounded-full mt-3" style={{ background: "rgba(255,255,255,.1)" }}><div className="h-full w-2/3 rounded-full" style={{ background: t.accent, boxShadow: `0 0 12px ${t.accent}` }} /></div>
        </div>
        <div className="flex gap-2"><span className="btn btn-sm !min-h-[30px] !px-3 !text-[9px] pointer-events-none">Primary</span><span className="btn btn-ghost btn-sm !min-h-[30px] !px-3 !text-[9px] pointer-events-none">Ghost</span></div>
      </div>
    </div>
  );
}

export default function ThemeUniverse() {
  const { theme, liveTheme, setTheme, previewTheme, resetTheme } = useApp();
  const previewing = liveTheme !== theme;
  useEffect(() => () => previewTheme(null), [previewTheme]);
  return (
    <div className="view-pad">
      <ViewHeader no="08" title="Theme Universe" sub="Three complete worlds">
        <button className="btn btn-ghost btn-sm" onClick={resetTheme}><RotateCcw size={14} /> Reset to default</button>
      </ViewHeader>

      {previewing && (
        <div className="glass glass-strong !rounded-2xl p-4 mb-6 flex items-center gap-4 flex-wrap sticky top-[88px] lg:top-4 z-30">
          <span className="relative z-[1] text-sm flex-1"><Eye size={15} className="inline mr-2 text-accent" /> Live preview: <b>{THEMES[liveTheme].name}</b> — nothing is saved until you apply.</span>
          <button className="btn btn-sm relative z-[1]" onClick={() => setTheme(liveTheme)}><Check size={14} /> Apply</button>
          <button className="btn btn-ghost btn-sm relative z-[1]" onClick={() => previewTheme(null)}><X size={14} /> Cancel</button>
        </div>
      )}

      <div className="grid xl:grid-cols-[1fr_1.4fr] gap-4 mb-4">
        <div className="glass !rounded-[32px] min-h-[340px] relative">
          <Scene3D kind="ball" className="absolute inset-0" label="●" interactive />
          <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end pointer-events-none">
            <div><div className="mono text-[9px] text-muted">Live 3D lighting</div><div className="h-display text-2xl text-accent-grad">{THEMES[liveTheme].name}</div></div>
            <span className="chip bg-black/40">Drag the ball</span>
          </div>
        </div>
        <div className="glass p-6 lg:p-8"><div className="relative z-[1]">
          <div className="eyebrow mb-4">What a theme changes</div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">{CHANGES.map((c) => <li key={c} className="flex items-center gap-3 text-sm"><Check size={15} className="text-accent shrink-0" />{c}</li>)}</ul>
          <p className="text-xs text-muted mt-6 leading-relaxed">Your choice is saved in this browser (LocalStorage) and restored on your next visit. {device.touch ? "Tap Preview to try a theme live, then Apply." : "Hover a card to preview live; click Apply to keep it."}</p>
        </div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {THEME_ORDER.map((id, i) => {
          const t = THEMES[id];
          const active = theme === id;
          return (
            <Reveal key={id} delay={i * 90}>
              <TiltCard className={`p-5 h-full ${active ? "!border-accent shadow-[0_0_40px_var(--glow)]" : ""}`} max={4}>
                <div className="relative z-[1]" onPointerEnter={() => { if (!device.touch) previewTheme(id); }} onPointerLeave={() => { if (!device.touch) previewTheme(null); }}>
                  <Mini id={id} />
                  <div className="flex gap-2 mt-4">{t.swatches.map((c) => <span key={c} className="w-8 h-8 rounded-full border border-white/20" style={{ background: c }} title={c} />)}</div>
                  <h3 className="h-display text-3xl mt-4">{t.name}</h3>
                  <div className="mono text-[9px] text-accent mt-1">{t.tagline}</div>
                  <p className="text-sm text-muted mt-3 min-h-[60px]">{t.desc}</p>
                  <div className="flex gap-2 mt-4">
                    <button className="btn btn-ghost btn-sm flex-1" onClick={() => previewTheme(liveTheme === id && previewing ? null : id)}><Eye size={14} /> Preview</button>
                    <button className="btn btn-sm flex-1" onClick={() => setTheme(id)} disabled={active}>{active ? <><Check size={14} /> Active</> : "Apply"}</button>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
