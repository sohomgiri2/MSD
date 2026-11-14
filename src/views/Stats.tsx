import { useEffect, useState } from "react";
import { FORMATS, HONOURS, IPL_STATS, TOTALS, type FormatStats } from "../lib/data";
import { Counter, DotText, Reveal, Tag, TiltCard, ViewHeader } from "../components/ui";

const TABS = ["Batting", "Wicketkeeping", "Captaincy", "Bowling", "IPL"] as const;

function Bar({ label, value, max, text, color = "var(--accent)" }: { label: string; value: number; max: number; text: string; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((value / max) * 100), 80); return () => clearTimeout(t); }, [value, max]);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5"><span className="mono text-[10px] text-muted">{label}</span><span className="tabular font-semibold">{text}</span></div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full transition-[width] duration-[1200ms] ease-out" style={{ width: `${w}%`, background: color, boxShadow: `0 0 14px ${color}` }} /></div>
    </div>
  );
}

function Donut({ parts, center, sub }: { parts: { label: string; v: number; c: string }[]; center: string; sub: string }) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  const R = 70;
  const C = 2 * Math.PI * R;
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 80); return () => clearTimeout(t); }, []);
  let off = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap justify-center">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label={parts.map((p) => `${p.label} ${p.v}`).join(", ")}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="16" />
        {parts.filter((p) => p.v > 0).map((p) => {
          const len = (p.v / total) * C;
          const el = <circle key={p.label} cx="90" cy="90" r={R} fill="none" stroke={p.c} strokeWidth="16" strokeDasharray={`${go ? Math.max(0, len - 3) : 0} ${C}`} strokeDashoffset={-off} transform="rotate(-90 90 90)" style={{ transition: "stroke-dasharray 1.2s ease-out" }} />;
          off += len;
          return el;
        })}
        <text x="90" y="92" textAnchor="middle" className="fill-[var(--ink)]" style={{ font: "700 30px var(--font-serif)" }}>{center}</text>
        <text x="90" y="112" textAnchor="middle" className="fill-[var(--muted)]" style={{ font: "500 9px var(--font-mono)", letterSpacing: ".14em" }}>{sub}</text>
      </svg>
      <ul className="space-y-2 text-sm">
        {parts.map((p) => <li key={p.label} className="flex items-center gap-3"><i className="w-3 h-3 rounded-full" style={{ background: p.c }} /><span className="text-muted w-24">{p.label}</span><b className="tabular">{p.v}</b></li>)}
      </ul>
    </div>
  );
}

function Tile({ k, v, sub, tag, num }: { k: string; v?: string; sub?: string; tag?: boolean; num?: { to: number; d?: number } }) {
  return (
    <TiltCard className="p-5" max={5}>
      <div className="relative z-[1]">
        <div className="mono text-[9px] text-muted mb-2 flex items-center justify-between">{k}{tag && <Tag v="approx" />}</div>
        <div className="h-display text-4xl text-accent">{num ? <Counter to={num.to} decimals={num.d ?? 0} /> : v}</div>
        {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
      </div>
    </TiltCard>
  );
}

export default function Stats() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Batting");
  const [fid, setFid] = useState<FormatStats["id"]>("odi");
  const f = FORMATS.find((x) => x.id === fid)!;
  const FormatPick = () => (
    <div className="flex gap-2 mb-8" role="tablist" aria-label="Format">
      {FORMATS.map((x) => <button key={x.id} role="tab" aria-selected={fid === x.id} className={`tab ${fid === x.id ? "active" : ""}`} onClick={() => setFid(x.id)}>{x.name}</button>)}
    </div>
  );
  return (
    <div className="view-pad">
      <ViewHeader no="03" title="Stats & Records" sub="Analytics lab" />
      <Reveal>
        <div className="glass p-6 lg:p-8 mb-8 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="relative z-[1]">
            <div className="eyebrow mb-3">International career · all formats</div>
            <div className="grid grid-cols-3 gap-4">
              <div><div className="h-display text-4xl lg:text-6xl text-gold"><Counter to={TOTALS.matches} /></div><div className="mono text-[9px] text-muted mt-1">Matches</div></div>
              <div><div className="h-display text-4xl lg:text-6xl text-gold"><Counter to={TOTALS.runs} /></div><div className="mono text-[9px] text-muted mt-1">Runs</div></div>
              <div><div className="h-display text-4xl lg:text-6xl text-gold"><Counter to={TOTALS.dismissals} /></div><div className="mono text-[9px] text-muted mt-1">Dismissals</div></div>
            </div>
            <p className="text-xs text-muted mt-4 max-w-xl">{TOTALS.note} Source: widely published career figures (ESPNcricinfo / ICC). Figures marked approx. are rounded.</p>
          </div>
          <div className="hidden lg:block relative z-[1]"><DotText text="17266" cell={6} /></div>
        </div>
      </Reveal>

      <div className="flex gap-2 flex-wrap mb-8 sticky top-[88px] lg:top-4 z-30" role="tablist" aria-label="Stat categories">
        <div className="glass !rounded-full p-1.5 flex gap-1 overflow-x-auto no-scrollbar max-w-full">
          {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab !border-0 whitespace-nowrap ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
        </div>
      </div>

      {tab === "Batting" && (
        <div>
          <FormatPick />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Tile k="Matches" num={{ to: f.m }} />
            <Tile k="Innings" num={{ to: f.inns }} sub={`${f.no} not outs`} />
            <Tile k="Runs" num={{ to: f.runs }} />
            <Tile k="Highest score" v={f.hs} />
            <Tile k="Average" num={{ to: f.avg, d: 2 }} />
            <Tile k="Strike rate" v={f.sr} tag />
            <Tile k="Hundreds / Fifties" v={`${f.h} / ${f.f}`} />
            <Tile k="Fours · Sixes" v={`${f.fours} · ${f.sixes}`} tag />
          </div>
          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <TiltCard className="p-6" max={3}><div className="relative z-[1]"><div className="eyebrow mb-5">Runs by format</div>
              {FORMATS.map((x) => <Bar key={x.id} label={x.name} value={x.runs} max={11000} text={x.runs.toLocaleString("en-IN")} />)}</div></TiltCard>
            <TiltCard className="p-6" max={3}><div className="relative z-[1]"><div className="eyebrow mb-5">Batting average</div>
              {FORMATS.map((x) => <Bar key={x.id} label={x.name} value={x.avg} max={60} text={x.avg.toFixed(2)} color="var(--accent2)" />)}</div></TiltCard>
          </div>
          <p className="text-xs text-muted mt-6">Not-outs matter: Dhoni's ODI average of 50.57 is boosted by his record as a finisher (84 not-outs in 297 innings).</p>
        </div>
      )}

      {tab === "Wicketkeeping" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <TiltCard className="p-6 lg:p-8" max={3}><div className="relative z-[1]">
            <div className="eyebrow mb-6">Dismissals by format</div>
            <Donut center="829" sub="TOTAL" parts={FORMATS.map((x, i) => ({ label: x.name, v: x.ct + x.st, c: ["var(--accent)", "var(--accent2)", "var(--ink)"][i] }))} />
          </div></TiltCard>
          <TiltCard className="p-6 lg:p-8" max={3}><div className="relative z-[1]">
            <div className="eyebrow mb-6">Catches · Stumpings</div>
            {FORMATS.map((x) => (
              <div key={x.id} className="mb-5">
                <div className="flex justify-between mono text-[10px] text-muted mb-1.5"><span>{x.name}</span><span className="text-ink">{x.ct + x.st} total</span></div>
                <div className="flex h-3 rounded-full overflow-hidden bg-white/5"><div style={{ width: `${(x.ct / (x.ct + x.st)) * 100}%`, background: "var(--accent)" }} /><div style={{ width: `${(x.st / (x.ct + x.st)) * 100}%`, background: "var(--accent2)" }} /></div>
                <div className="flex justify-between text-xs mt-1.5"><span><i className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5" />{x.ct} catches</span><span><i className="inline-block w-2 h-2 rounded-full bg-accent2 mr-1.5" />{x.st} stumpings</span></div>
              </div>
            ))}
            <div className="flex gap-2 mt-2"><Tag v="verified" /><span className="text-xs text-muted">Wicketkeeper dismissals; fielding catches not included.</span></div>
          </div></TiltCard>
        </div>
      )}

      {tab === "Captaincy" && (
        <div>
          <FormatPick />
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
            <TiltCard className="p-6 lg:p-8" max={3}><div className="relative z-[1]">
              <div className="flex items-center justify-between mb-6"><div className="eyebrow">As captain · {f.name}</div>{fid === "t20i" && <Tag v="approx" />}</div>
              <Donut center={String(f.cap.m)} sub="MATCHES" parts={[
                { label: "Won", v: f.cap.w, c: "var(--accent)" }, { label: "Lost", v: f.cap.l, c: "#ff5d5d" }, { label: "Drawn", v: f.cap.d, c: "var(--muted)" },
                { label: "Tied", v: f.cap.t, c: "var(--accent2)" }, { label: "No result", v: f.cap.nr, c: "rgba(255,255,255,.35)" }]} />
              <p className="mono text-[10px] text-muted mt-6">Win rate · {((f.cap.w / f.cap.m) * 100).toFixed(1)}% (calculated from the figures above)</p>
            </div></TiltCard>
            <div className="grid gap-4">
              <TiltCard className="p-6" max={3}><div className="relative z-[1]"><div className="mono text-[9px] text-muted">Matches as captain · all formats</div><div className="h-display text-6xl text-gold"><Counter to={TOTALS.captaincyMatches} /></div><p className="text-xs text-muted mt-2">60 Tests + 200 ODIs + 72 T20Is — the most in India's history.</p></div></TiltCard>
              <TiltCard className="p-6" max={3}><div className="relative z-[1]">
                <div className="eyebrow mb-3">ICC trophies as captain</div>
                <ul className="text-sm space-y-2"><li>🏆 ICC World Twenty20 · 2007</li><li>🏆 ICC Cricket World Cup · 2011</li><li>🏆 ICC Champions Trophy · 2013</li></ul>
                <p className="text-xs text-muted mt-3">The first captain to win all three ICC white-ball trophies.</p>
              </div></TiltCard>
            </div>
          </div>
          <div className="mt-8"><div className="eyebrow mb-4">Honours</div>
            <ul className="grid sm:grid-cols-2 gap-3">{HONOURS.map((h) => <li key={h.t} className="glass !rounded-2xl p-4 flex items-center justify-between gap-3"><span className="relative z-[1]"><span className="mono text-[9px] text-accent block">{h.y}</span><span className="text-sm font-medium">{h.t}</span></span><span className="relative z-[1]"><Tag v={h.tag} /></span></li>)}</ul></div>
        </div>
      )}

      {tab === "Bowling" && (
        <div className="max-w-3xl">
          <TiltCard className="p-7" max={3}><div className="relative z-[1]">
            <div className="flex items-center gap-3 mb-4"><div className="eyebrow">Bowling — a footnote</div><Tag v="approx" /></div>
            <p className="text-muted leading-relaxed">Dhoni was a wicketkeeper first. He bowled only rarely in international cricket, so there is no meaningful bowling analytics to chart — and we would rather say so than invent numbers.</p>
            <ul className="mt-5 divide-y divide-line text-sm">{FORMATS.map((x) => <li key={x.id} className="flex justify-between py-3"><span className="mono text-[10px] text-muted">{x.name}</span><span>{x.bowl}</span></li>)}</ul>
            <p className="text-xs text-muted mt-4">Verify exact bowling figures on ESPNcricinfo before quoting them.</p>
          </div></TiltCard>
        </div>
      )}

      {tab === "IPL" && (
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {IPL_STATS.map((s) => <TiltCard key={s.k} className="p-6" max={5}><div className="relative z-[1]"><div className="mono text-[9px] text-muted mb-2 flex justify-between">{s.k}<Tag v={s.tag} /></div><div className="h-display text-5xl text-accent">{s.v}</div><div className="text-xs text-muted mt-2">{s.sub}</div></div></TiltCard>)}
          </div>
          <p className="text-xs text-muted mt-6">The IPL season continues to add to these numbers — for current statistics visit iplt20.com or ESPNcricinfo. See the CSK Universe for the season-by-season story.</p>
        </div>
      )}
    </div>
  );
}
