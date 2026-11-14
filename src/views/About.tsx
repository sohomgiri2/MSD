import Scene3D from "../components/Scene3D";
import { Disclaimer, DotText, Reveal, Tag, ViewHeader } from "../components/ui";
import { HONOURS } from "../lib/data";

const FACTS: [string, string, "verified" | "approx"][] = [
  ["Full name", "Mahendra Singh Dhoni", "verified"], ["Born", "7 July 1981 · Ranchi (now Jharkhand)", "verified"], ["Role", "Wicketkeeper-batter · right-handed", "verified"],
  ["International debut", "ODI 23 Dec 2004 · Test 2 Dec 2005 · T20I 1 Dec 2006", "verified"], ["Last international match", "10 Jul 2019 · World Cup semi-final", "verified"],
  ["Retirement", "Tests 30 Dec 2014 · International 15 Aug 2020", "verified"], ["Jersey number", "7", "verified"], ["IPL franchise", "Chennai Super Kings (2008 onwards)", "verified"],
];
const CHAPTERS = [
  { t: "Ranchi", p: "Dhoni grew up in Ranchi, a city that had never produced an Indian international cricketer of his stature. At school he was a goalkeeper in football; his cricket coach noticed his reflexes and asked him to keep wicket. A boy who loved football became the most famous gloveman in Indian cricket." },
  { t: "The railway years", p: "Dhoni worked as a ticket collector at Kharagpur station while playing for Bihar and later Jharkhand. Long train rides, night shifts and early-morning nets are a core part of his story — a reminder that fame arrived only after patient years of work." },
  { t: "The explosive arrival", p: "After India A tours impressed selectors, he debuted in ODIs in December 2004. A duck in his first match was followed by 148 against Pakistan and 183* against Sri Lanka in 2005 — shots hit with a baseball-like bat swing, long hair flying, nerves absent." },
  { t: "The calm captain", p: "In 2007 he was handed a young T20 side and won the first World Twenty20. By 2011 he was lifting the World Cup at the Wankhede, and in 2013 he added the Champions Trophy — the first captain to hold all three white-ball ICC trophies. He captained India in 332 matches." },
  { t: "The finisher", p: "Dhoni redefined the ODI chase: stay deep, take the game to the final overs, then strike. His ODI average of 50.57 — helped by many not-outs — and the helicopter shot became symbols of that approach." },
  { t: "Yellow forever", p: "From the first IPL auction in 2008, Dhoni and Chennai Super Kings became inseparable. Five IPL titles, ten finals, two Champions League T20 trophies and a stadium that roars the moment he walks out to bat." },
];

export default function About() {
  return (
    <div className="view-pad">
      <ViewHeader no="12" title="About MSD" sub="Biography & career story" />
      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-center mb-16">
        <div>
          <div className="mb-6 overflow-hidden"><DotText text="MAHI" cell={14} /></div>
          <p className="serif text-2xl lg:text-3xl leading-snug italic text-ink/90">“I don't think about the result. I think about the process.”</p>
          <div className="mt-3 flex items-center gap-2"><Tag v="fan" /><span className="text-xs text-muted">A paraphrase often attributed to Dhoni's attitude — not a verified quotation.</span></div>
        </div>
        <div className="glass !rounded-[32px] h-[340px] relative"><Scene3D kind="emblem" text="MSD" className="absolute inset-0" label="MSD" interactive /><span className="absolute bottom-4 left-5 chip bg-black/40">3D MSD emblem · drag</span></div>
      </section>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10">
        <article className="space-y-10">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.t}>
              <section>
                <div className="flex items-baseline gap-4 mb-3"><span className="mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span><h2 className="h-display text-3xl lg:text-4xl">{c.t}</h2></div>
                <p className={`text-muted leading-[1.85] text-[17px] ${i === 0 ? "first-letter:text-6xl first-letter:serif first-letter:float-left first-letter:mr-3 first-letter:leading-[.8] first-letter:text-accent" : ""}`}>{c.p}</p>
              </section>
            </Reveal>
          ))}
          <Reveal><div className="glass p-6 lg:p-8"><div className="relative z-[1]"><div className="eyebrow mb-3">Facts vs. fan view</div><p className="text-sm text-muted leading-relaxed">Dates and numbers on this site come from widely published records. Sentences that describe feelings — “iconic”, “defining”, “the greatest finisher” — are fan interpretations and are tagged <Tag v="fan" /> where they appear next to facts.</p></div></div></Reveal>
        </article>
        <aside className="space-y-4 lg:sticky lg:top-6 self-start">
          <div className="glass p-6"><div className="relative z-[1]"><div className="eyebrow mb-4">Key facts</div>
            <dl className="divide-y divide-line">{FACTS.map(([k, v, t]) => <div key={k} className="py-3"><dt className="mono text-[9px] text-muted flex items-center justify-between">{k}<Tag v={t} /></dt><dd className="text-sm mt-1">{v}</dd></div>)}</dl></div></div>
          <div className="glass p-6"><div className="relative z-[1]"><div className="eyebrow mb-4">Honours</div>
            <ul className="space-y-3">{HONOURS.map((h) => <li key={h.t} className="text-sm"><span className="mono text-[9px] text-accent block">{h.y}</span>{h.t}</li>)}</ul></div></div>
        </aside>
      </div>
      <div className="mt-14"><Disclaimer /></div>
    </div>
  );
}
