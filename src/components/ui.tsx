import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Home, Route, BarChart3, Trophy, Flame, Medal, Zap, Palette, Sparkles, Images, Gamepad2, BookOpen, Code2, Settings, Circle, type LucideIcon } from "lucide-react";
import { gsap } from "../lib/motion";
import { device } from "../lib/perf";
import { VERIFY_LABEL, type Verify } from "../lib/data";
import { useApp } from "../state";

/* ───────── icons ───────── */
const ICONS: Record<string, LucideIcon> = { Home, Route, BarChart3, Trophy, Flame, Medal, Zap, Palette, Sparkles, Images, Gamepad2, BookOpen, Code2, Settings };
export function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Circle;
  return <C size={size} className={className} />;
}

/* ───────── dot-matrix typography (custom 5×7 font, works offline) ───────── */
const G: Record<string, string> = {
  A: "01110,10001,10001,11111,10001,10001,10001", B: "11110,10001,10001,11110,10001,10001,11110", C: "01110,10001,10000,10000,10000,10001,01110",
  D: "11110,10001,10001,10001,10001,10001,11110", E: "11111,10000,10000,11110,10000,10000,11111", F: "11111,10000,10000,11110,10000,10000,10000",
  G: "01110,10001,10000,10111,10001,10001,01111", H: "10001,10001,10001,11111,10001,10001,10001", I: "01110,00100,00100,00100,00100,00100,01110",
  J: "00111,00010,00010,00010,00010,10010,01100", K: "10001,10010,10100,11000,10100,10010,10001", L: "10000,10000,10000,10000,10000,10000,11111",
  M: "10001,11011,10101,10101,10001,10001,10001", N: "10001,10001,11001,10101,10011,10001,10001", O: "01110,10001,10001,10001,10001,10001,01110",
  P: "11110,10001,10001,11110,10000,10000,10000", Q: "01110,10001,10001,10001,10101,10010,01101", R: "11110,10001,10001,11110,10100,10010,10001",
  S: "01111,10000,10000,01110,00001,00001,11110", T: "11111,00100,00100,00100,00100,00100,00100", U: "10001,10001,10001,10001,10001,10001,01110",
  V: "10001,10001,10001,10001,10001,01010,00100", W: "10001,10001,10001,10101,10101,11011,10001", X: "10001,10001,01010,00100,01010,10001,10001",
  Y: "10001,10001,01010,00100,00100,00100,00100", Z: "11111,00001,00010,00100,01000,10000,11111",
  "0": "01110,10001,10011,10101,11001,10001,01110", "1": "00100,01100,00100,00100,00100,00100,01110", "2": "01110,10001,00001,00010,00100,01000,11111",
  "3": "11110,00001,00001,01110,00001,00001,11110", "4": "00010,00110,01010,10010,11111,00010,00010", "5": "11111,10000,11110,00001,00001,10001,01110",
  "6": "00110,01000,10000,11110,10001,10001,01110", "7": "11111,00001,00010,00100,01000,01000,01000", "8": "01110,10001,10001,01110,10001,10001,01110",
  "9": "01110,10001,10001,01111,00001,00010,01100",
  ".": "00000,00000,00000,00000,00000,01100,01100", ":": "00000,01100,01100,00000,01100,01100,00000", "-": "00000,00000,00000,11111,00000,00000,00000",
  "/": "00001,00010,00010,00100,01000,01000,10000", "*": "00000,10101,01110,11111,01110,10101,00000", "+": "00000,00100,00100,11111,00100,00100,00000",
  "%": "11001,11010,00010,00100,01000,01011,10011", "!": "00100,00100,00100,00100,00100,00000,00100", "?": "01110,10001,00001,00010,00100,00000,00100",
  "'": "00100,00100,01000,00000,00000,00000,00000", ",": "00000,00000,00000,00000,01100,00100,01000", "&": "01100,10010,10100,01000,10101,10010,01101",
  "·": "00000,00000,00000,00100,00000,00000,00000", "<": "00010,00100,01000,10000,01000,00100,00010", ">": "01000,00100,00010,00001,00010,00100,01000",
  "_": "00000,00000,00000,00000,00000,00000,11111", " ": "00000,00000,00000,00000,00000,00000,00000",
};

export const DOT_GLYPHS = G;

export function DotText({ text, cell = 8, color, ghost = true, animate = true, className = "", label }: { text: string; cell?: number; color?: string; ghost?: boolean; animate?: boolean; className?: string; label?: string }) {
  const chars = text.toUpperCase().split("");
  const adv = 6 * cell;
  const width = chars.length * adv - cell;
  const dots: ReactNode[] = [];
  let n = 0;
  chars.forEach((ch, ci) => {
    const rows = (G[ch] ?? G["?"]).split(",");
    rows.forEach((row, y) => {
      for (let x = 0; x < 5; x++) {
        const on = row[x] === "1";
        if (!on && !ghost) continue;
        const cx = ci * adv + x * cell + cell / 2;
        const cy = y * cell + cell / 2;
        dots.push(<circle key={`${ci}-${x}-${y}`} cx={cx} cy={cy} r={cell * (on ? 0.36 : 0.12)} className={on ? "dot-on" : "dot-off"} style={on && animate ? { animationDelay: `${(n++ % 60) * 14 + ci * 30}ms` } : undefined} />);
      }
    });
  });
  return (
    <svg role="img" aria-label={label ?? text} viewBox={`0 0 ${width} ${7 * cell}`} className={`dot-anim block max-w-full h-auto ${className}`} style={{ ["--dot" as string]: color, width }} preserveAspectRatio="xMinYMid meet">
      {dots}
    </svg>
  );
}

/* ───────── reveal on scroll ───────── */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" | "article" }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as "div";
  return <T ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${on ? "in" : ""} ${className}`} style={{ ["--d" as string]: `${delay}ms` } as CSSProperties}>{children}</T>;
}

/* ───────── staggered heading reveal (GSAP) ───────── */
export function SplitHeading({ text, className = "", wordClass = "", delay = 0, tag: Tag = "h1" }: { text: string; className?: string; wordClass?: string; delay?: number; tag?: "h1" | "h2" | "h3" }) {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useApp();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelectorAll("[data-w]"), { yPercent: 110, rotate: 4, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.07, delay });
    }, el);
    return () => ctx.revert();
  }, [text, reduced, delay]);
  const T = Tag as "h1";
  return (
    <T ref={ref as React.RefObject<HTMLHeadingElement>} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] mr-[0.22em]" aria-hidden="true">
          <span data-w className={`inline-block will-change-transform ${wordClass}`}>{w}</span>
        </span>
      ))}
    </T>
  );
}

/* ───────── 3D tilt + liquid-glass light ───────── */
export function TiltCard({ children, className = "", max = 7, glass = true, onClick, style, as = "div" }: { children: ReactNode; className?: string; max?: number; glass?: boolean; onClick?: () => void; style?: CSSProperties; as?: "div" | "button" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, quality } = useApp();
  const enabled = !device.touch && !reduced && quality > 0;
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (enabled) el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ""; };
  const Comp = as as "div";
  return (
    <Comp ref={ref} onPointerMove={move} onPointerLeave={leave} onClick={onClick} style={{ transition: "transform .25s ease-out", ...style }} className={`${glass ? "glass" : ""} ${className}`}>
      {children}
    </Comp>
  );
}

/* ───────── magnetic ───────── */
export function Magnetic({ children, strength = 0.35, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useApp();
  useEffect(() => {
    const el = ref.current;
    if (!el || device.touch || reduced) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const mv = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const lv = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerleave", lv);
    return () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerleave", lv); gsap.set(el, { x: 0, y: 0 }); };
  }, [strength, reduced]);
  return <span ref={ref} className={`inline-block ${className}`}>{children}</span>;
}

/* ───────── animated counter ───────── */
export function Counter({ to, decimals = 0, suffix = "", prefix = "", className = "" }: { to: number; decimals?: number; suffix?: string; prefix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useApp();
  const fmt = (v: number) => prefix + v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) { el.textContent = fmt(to); return; }
    const o = { v: 0 };
    el.textContent = fmt(0);
    let tw: gsap.core.Tween | null = null;
    const io = new IntersectionObserver((en) => {
      if (en[0].isIntersecting) {
        tw = gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", onUpdate: () => { el.textContent = fmt(o.v); } });
        io.disconnect();
      }
    });
    io.observe(el);
    return () => { io.disconnect(); tw?.kill(); };
  }, [to, reduced, decimals, suffix, prefix]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={`tabular ${className}`}>{fmt(to)}</span>;
}

/* ───────── small bits ───────── */
export function Tag({ v }: { v: Verify }) {
  const cls = v === "verified" ? "chip-ok" : v === "approx" ? "chip-approx" : "chip-fan";
  return <span className={`chip ${cls}`} title={v === "verified" ? "Widely documented fact" : v === "approx" ? "Approximate / may have changed — verify with an official source" : "Fan interpretation — not a fact"}>{VERIFY_LABEL[v]}</span>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (b: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

export function Modal({ open, onClose, children, title, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; title: string; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`glass glass-strong w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto p-6 sm:p-8`}>
        {children}
      </div>
    </div>
  );
}

export function ViewHeader({ no, title, sub, children }: { no: string; title: string; sub: string; children?: ReactNode }) {
  const { go, back } = useApp();
  return (
    <header className="mb-10 lg:mb-14 relative">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 mono text-[10px] text-muted mb-6">
        <button className="hover:text-accent" onClick={() => go("home")}>Home</button>
        <span>/</span>
        <span className="text-ink">{title}</span>
        <button className="ml-auto chip hover:text-accent" onClick={back}>← Back</button>
      </nav>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          <div className="eyebrow mb-3">{no} — {sub}</div>
          <SplitHeading text={title} tag="h1" className="h-display text-5xl sm:text-6xl lg:text-7xl" />
        </div>
        {children}
      </div>
      <div className="hair mt-8" />
    </header>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted leading-relaxed ${className}`}>
      Unofficial fan-made tribute. Not endorsed by, affiliated with or sponsored by MS Dhoni, BCCI, ICC, CSK or the IPL. All names and marks belong to their respective owners. Figures marked <Tag v="approx" /> may be rounded or out of date.
    </p>
  );
}

export function Footer() {
  const { go } = useApp();
  return (
    <footer className="relative z-[2] border-t border-line bg-bg">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-12 py-10 pb-32 lg:pb-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <DotText text="MSD" cell={5} animate={false} />
          <p className="mono text-[10px] text-accent mt-4">Beyond Cricket. Beyond Time.</p>
          <Disclaimer className="mt-4 max-w-xl" />
        </div>
        <div className="lg:text-right">
          <div className="mono text-[10px] text-muted">Designed & developed by</div>
          <button onClick={() => go("developer")} className="text-gold h-display text-3xl mt-1 hover:opacity-80">Sohom Giri</button>
          <div className="flex lg:justify-end gap-3 mt-4 flex-wrap">
            <a className="btn btn-ghost btn-sm" href="https://github.com/sohomgiri2" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="btn btn-ghost btn-sm" href="https://instagram.com/itz_sg_063" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
          <p className="text-[11px] text-muted mt-4">© {new Date().getFullYear()} Sohom Giri · Fan project · v1.0.0</p>
        </div>
      </div>
    </footer>
  );
}

/** Reads the focus id requested via global search */
export function useFocus(view: string, cb: (id: string) => void) {
  const { consumeFocus, view: v, focus } = useApp();
  useEffect(() => {
    if (v !== view) return;
    const id = consumeFocus(view);
    if (id) cb(id);
  }, [focus, v]); // eslint-disable-line react-hooks/exhaustive-deps
}
