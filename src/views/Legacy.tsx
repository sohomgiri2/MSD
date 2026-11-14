import { useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import Scene3D from "../components/Scene3D";
import { Counter, DotText, Reveal, SplitHeading, Tag, TiltCard, ViewHeader } from "../components/ui";
import { CSK_SEASONS, FORMATS, IPL_STATS, T20_CAMPAIGNS, WC_CAMPAIGNS, type Season } from "../lib/data";
import { THEMES, type ThemeId } from "../lib/themes";
import { useApp } from "../state";

/** Scoped-theme frame: each legacy screen carries its own palette regardless of the global theme. */
function Frame({ id, children }: { id: ThemeId; children: ReactNode }) {
  const { theme, setTheme } = useApp();
  return (
    <div data-theme={id} data-scope className="relative min-h-screen" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 40% at 80% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)" }} />
      <div className="view-pad !pt-24 lg:!pt-28">
        {children}
        <div className="mt-16 glass p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative z-[1] text-sm"><span className="mono text-[10px] text-accent block">Screen palette</span>This screen is styled in <b>{THEMES[id].name}</b>.{theme === id && " It is also your active site theme."}</div>
          <button className="btn relative z-[1]" disabled={theme === id} onClick={() => setTheme(id)}>{theme === id ? "Applied to site" : `Apply ${THEMES[id].short} to whole site`}</button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ k, v, n, d = 0, tag }: { k: string; v?: string; n?: number; d?: number; tag?: boolean }) {
  return (
    <TiltCard className="p-5" max={5}>
      <div className="relative z-[1]">
        <div className="mono text-[9px] text-muted mb-2 flex justify-between">{k}{tag && <Tag v="approx" />}</div>
        <div className="h-display text-4xl text-accent">{n !== undefined ? <Counter to={n} decimals={d} /> : v}</div>
      </div>
    </TiltCard>
  );
}

/* ═════════════════════ CSK ═════════════════════ */
const RES_STYLE: Record<Season["res"], string> = {
  Champions: "bg-accent text-accent-ink border-accent shadow-[0_0_28px_var(--glow)]",
  "Runners-up": "border-accent text-accent bg-accent/10",
  Playoffs: "border-line text-ink bg-white/5",
  League: "border-line text-muted bg-transparent",
  Suspended: "border-dashed border-line text-muted bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgba(255,255,255,.06)_6px_12px)]",
};
export function CskView() {
  const [sel, setSel] = useState<Season>(CSK_SEASONS[2]);
  return (
    <Frame id="csk">
      <ViewHeader no="05" title="CSK Universe" sub="Yellow is a feeling" />
      <section className="rounded-[36px] overflow-hidden relative grid lg:grid-cols-[1.2fr_1fr] min-h-[420px]" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
        <div className="p-8 lg:p-14 relative z-[1] flex flex-col justify-between gap-10">
          <div className="mono text-[10px] opacity-80">2008 — present · Chennai Super Kings</div>
          <div>
            <SplitHeading tag="h2" text="WHISTLE PODU" className="h-display text-6xl lg:text-8xl" />
            <p className="mt-4 max-w-md font-medium">Bought at the first IPL auction in 2008, Dhoni became the heartbeat of the yellow army. Five titles, ten finals — the most consistent dynasty the league has seen.</p>
          </div>
          <div className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={30} fill="currentColor" />)}<span className="mono text-[10px] self-end ml-3">5 IPL TITLES</span></div>
        </div>
        <div className="relative min-h-[260px]"><Scene3D kind="ball" theme="csk" className="absolute inset-0" label="CSK" /></div>
      </section>

      <Reveal><div className="eyebrow mt-14 mb-5">Season by season · tap a year</div></Reveal>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {CSK_SEASONS.map((s) => (
          <button key={s.y} aria-pressed={sel.y === s.y} onClick={() => setSel(s)} className={`rounded-2xl border p-3 text-left min-h-[88px] transition-all hover:-translate-y-1 ${RES_STYLE[s.res]} ${sel.y === s.y ? "ring-2 ring-ink ring-offset-2 ring-offset-bg" : ""}`}>
            <div className="mono text-[11px] font-bold">{s.y}</div>
            <div className="text-[10px] mt-2 leading-tight uppercase tracking-wider opacity-90">{s.res === "Champions" ? "★ Champions" : s.res}</div>
          </button>
        ))}
      </div>
      <div className="glass p-6 mt-4"><div className="relative z-[1] flex items-center gap-4 flex-wrap"><DotText text={sel.y} cell={5} /><div><div className="font-semibold">{sel.res}</div><div className="text-sm text-muted">{sel.note}</div></div><div className="ml-auto"><Tag v={sel.y === "2025" ? "approx" : "verified"} /></div></div></div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        {IPL_STATS.map((s) => <StatTile key={s.k} k={s.k} v={s.v} tag={s.tag === "approx"} />)}
      </div>
      <Reveal>
        <div className="glass p-7 mt-6"><div className="relative z-[1]"><div className="flex gap-3 items-center mb-3"><span className="eyebrow">The captaincy story</span><Tag v="verified" /></div>
          <p className="text-muted leading-relaxed max-w-3xl">Dhoni captained CSK from 2008 to 2023. In 2022 Ravindra Jadeja briefly held the captaincy before Dhoni resumed; in 2024 Ruturaj Gaikwad took over. CSK were suspended for the 2016 and 2017 seasons, when Dhoni played for Rising Pune Supergiant. Two Champions League T20 titles (2010, 2014) sit alongside the IPL trophies.</p>
          <p className="mt-4 text-sm"><Tag v="fan" /> <span className="text-muted ml-2">“Thala” is a fan nickname meaning ‘leader’ in Tamil — an affectionate title, not an official one.</span></p></div></div>
      </Reveal>
    </Frame>
  );
}

/* ═════════════════════ ODI ═════════════════════ */
export function OdiView() {
  const f = FORMATS[1];
  const card = [
    { n: "V. Sehwag", r: "0", note: "b Malinga, first ball" }, { n: "S. Tendulkar", r: "18", note: "" }, { n: "G. Gambhir", r: "97", note: "" },
    { n: "V. Kohli", r: "35", note: "" }, { n: "MS Dhoni", r: "91*", note: "79 balls · Player of the Match" }, { n: "Yuvraj Singh", r: "21*", note: "" },
  ];
  return (
    <Frame id="odi">
      <ViewHeader no="06" title="ODI Legacy" sub="Men in Blue" />
      <section className="glass !rounded-[32px] p-6 lg:p-12 relative">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 hidden lg:block"><Scene3D kind="emblem" text="2011" theme="odi" className="absolute inset-0" label="2011" interactive /></div>
        <div className="relative z-[1] max-w-xl">
          <div className="mono text-[10px] text-accent mb-4">World Cup Final · 2 April 2011 · Wankhede, Mumbai</div>
          <div className="mb-6 overflow-hidden"><DotText text="2011" cell={13} /></div>
          <p className="text-muted leading-relaxed">India chased down 275 against Sri Lanka, finishing 277/4 in 48.2 overs. Dhoni walked in ahead of Yuvraj Singh, stitched a match-winning stand with Gautam Gambhir and sealed it with a six.</p>
          <div className="mt-6 flex gap-2 flex-wrap"><Tag v="verified" /><span className="chip">Sri Lanka 274/6 (50)</span><span className="chip">India 277/4 (48.2)</span></div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <TiltCard className="p-6 lg:p-8" max={3}><div className="relative z-[1]">
          <div className="eyebrow mb-5">India's chase · the scorecard</div>
          {card.map((b) => {
            const n = parseInt(b.r);
            return (
              <div key={b.n} className="mb-4">
                <div className="flex justify-between text-sm mb-1.5"><span className={b.n === "MS Dhoni" ? "font-bold text-accent" : ""}>{b.n}</span><b className="tabular">{b.r}</b></div>
                <div className="h-2 rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(n / 100) * 100}%`, background: b.n === "MS Dhoni" ? "var(--accent)" : "var(--accent2)", boxShadow: b.n === "MS Dhoni" ? "0 0 14px var(--glow)" : "none" }} /></div>
                {b.note && <div className="text-[11px] text-muted mt-1">{b.note}</div>}
              </div>
            );
          })}
          <p className="text-[11px] text-muted">Selected batters only. Check the official scorecard for full details.</p>
        </div></TiltCard>
        <TiltCard className="p-6 lg:p-8" max={3}><div className="relative z-[1]">
          <div className="eyebrow mb-5">Dhoni at the World Cup</div>
          <ol className="space-y-4">
            {WC_CAMPAIGNS.map((c) => (
              <li key={c.y} className={`flex gap-4 items-start p-4 rounded-2xl border ${c.win ? "border-accent bg-accent/10" : "border-line"}`}>
                <span className="h-display text-3xl text-accent w-20 shrink-0">{c.y}</span>
                <span><b className="block text-sm">{c.res}</b><span className="text-xs text-muted">{c.note}</span></span>
              </li>
            ))}
          </ol>
        </div></TiltCard>
      </div>

      <div className="eyebrow mt-12 mb-5">ODI career numbers</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile k="Matches" n={f.m} /><StatTile k="Runs" n={f.runs} /><StatTile k="Average" n={f.avg} d={2} /><StatTile k="Highest" v={f.hs} />
        <StatTile k="Hundreds" n={f.h} /><StatTile k="Fifties" n={f.f} /><StatTile k="Dismissals" n={f.ct + f.st} /><StatTile k="Captain wins" n={f.cap.w} />
      </div>
    </Frame>
  );
}

/* ═════════════════════ T20 ═════════════════════ */
export function T20View() {
  const f = FORMATS[2];
  return (
    <Frame id="t20">
      <ViewHeader no="07" title="T20 Legacy" sub="Fearless. Instant." />
      <section className="relative rounded-[32px] overflow-hidden border border-line p-6 lg:p-14" style={{ background: "linear-gradient(135deg, var(--bg2), var(--bg))" }}>
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in oklab, var(--accent) 18%, transparent) 3px 4px)" }} />
        <div className="absolute -right-10 top-0 bottom-0 w-1/2 hidden lg:block"><Scene3D kind="ball" theme="t20" className="absolute inset-0" label="T20" /></div>
        <div className="relative z-[1] max-w-xl">
          <div className="mono text-[10px] text-accent mb-4 blink">● 24 September 2007 · Johannesburg</div>
          <div className="mb-6 overflow-hidden"><DotText text="T20" cell={18} /></div>
          <p className="text-muted leading-relaxed">The inaugural World Twenty20 final: India 157/5, Pakistan all out for 152 in the final over. Gautam Gambhir top-scored with 75; Dhoni, leading a fresh young team, handed the last over to Joginder Sharma — and India won by 5 runs.</p>
          <div className="mt-5 flex gap-2 flex-wrap"><Tag v="verified" /><span className="chip">India 157/5</span><span className="chip">Pakistan 152 (19.3)</span></div>
        </div>
      </section>

      <div className="eyebrow mt-12 mb-5">World T20 · the race track</div>
      <div className="relative overflow-x-auto no-scrollbar pb-4">
        <div className="relative flex gap-4 min-w-[860px]">
          <div className="absolute left-0 right-0 top-[34px] h-px bg-line" />
          {T20_CAMPAIGNS.map((c) => (
            <Reveal key={c.y} className="flex-1">
              <div className="relative pt-10">
                <span className={`absolute top-6 left-4 w-5 h-5 rounded-full border-2 ${c.win ? "bg-accent border-accent shadow-[0_0_24px_var(--glow)]" : "bg-bg border-accent/60"}`} />
                <TiltCard className={`p-5 ${c.win ? "!border-accent" : ""}`} max={5}>
                  <div className="relative z-[1]"><div className="h-display text-4xl text-accent">{c.y}</div><div className="text-sm font-semibold mt-2">{c.res}</div><div className="text-xs text-muted mt-1">{c.note}</div></div>
                </TiltCard>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="eyebrow mt-10 mb-5">T20 International numbers</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile k="Matches" n={f.m} /><StatTile k="Runs" n={f.runs} /><StatTile k="Average" n={f.avg} d={1} /><StatTile k="Highest" v={f.hs} />
        <StatTile k="Strike rate" v={f.sr} tag /><StatTile k="Dismissals" n={f.ct + f.st} /><StatTile k="Captain wins" v={`${f.cap.w}`} tag /><StatTile k="Sixes" v={f.sixes} tag />
      </div>
      <p className="text-xs text-muted mt-6 max-w-2xl">Campaign results for 2009–2012 are summarised as “Super 8” exits. T20 figures are approximate where marked; confirm with ESPNcricinfo.</p>
    </Frame>
  );
}
