import { useEffect, useRef, useState } from "react";
import { device } from "../lib/perf";
import type { SceneHandle, SceneKind } from "../three/engine";
import type { ThemeId } from "../lib/themes";
import type { TrophyKind } from "../lib/data";
import { useApp } from "../state";

interface Props {
  kind: SceneKind;
  text?: string;
  theme?: ThemeId;
  className?: string;
  interactive?: boolean;
  scrollLink?: boolean;
  trophy?: { kind: TrophyKind; unlocked: boolean };
  onReady?: (h: SceneHandle | null) => void;
  label?: string;
}

export function Css3DFallback({ label }: { label: string }) {
  return (
    <div className="css3d-scene" role="img" aria-label="Rotating CSS 3D medallion (WebGL fallback)">
      <div className="css3d-coin">
        <div>{label}</div>
        <div>{label}</div>
      </div>
    </div>
  );
}

/** iOS requires an explicit user gesture to access motion sensors */
export async function requestGyro(): Promise<boolean> {
  const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof D?.requestPermission === "function") {
    try {
      return (await D.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  return "DeviceOrientationEvent" in window;
}

export default function Scene3D({ kind, text, theme, className = "", interactive = true, scrollLink, trophy, onReady, label = "MSD", }: Props) {
  const { quality, reduced, liveTheme, settings } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [handle, setHandle] = useState<SceneHandle | null>(null);
  const [fallback, setFallback] = useState(!device.webgl);
  const qRef = useRef(quality);
  qRef.current = quality;
  const redRef = useRef(reduced);
  redRef.current = reduced;
  const themeId = theme ?? liveTheme;
  const themeRef = useRef(themeId);
  themeRef.current = themeId;
  const adaptive = settings.perf === "auto";
  const partRef = useRef(settings.particles);
  partRef.current = settings.particles;
  const adaptRef = useRef(adaptive);
  adaptRef.current = adaptive;

  useEffect(() => {
    if (fallback || !box.current) return;
    const el = box.current;
    const canvas = document.createElement("canvas");
    canvas.className = "block w-full h-full";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
    let h: SceneHandle | null = null;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let visible = true;
    let inView = true;
    const sync = () => h?.setPaused(!visible || !inView);
    const onVis = () => { visible = !document.hidden; sync(); };

    import("../three/engine").then(({ createScene }) => {
      if (cancelled) return;
      try {
        h = createScene({
          kind, canvas, text, quality: qRef.current, reduced: redRef.current, theme: themeRef.current,
          particles: partRef.current, adaptive: adaptRef.current, onLost: () => setFallback(true),
        });
      } catch (e) {
        console.warn("WebGL scene failed, using CSS fallback", e);
        setFallback(true);
        return;
      }
      setHandle(h);
      onReady?.(h);
      ro = new ResizeObserver(() => h?.resize());
      ro.observe(el);
      io = new IntersectionObserver((en) => { inView = en[0]?.isIntersecting ?? true; sync(); }, { threshold: 0 });
      io.observe(el);
      document.addEventListener("visibilitychange", onVis);
    }).catch(() => setFallback(true));

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
      io?.disconnect();
      onReady?.(null);
      h?.dispose();
      setHandle(null);
      canvas.remove();
    };
  }, [kind, text, fallback]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { handle?.setTheme(themeId); }, [handle, themeId]);
  useEffect(() => { handle?.setQuality(quality); }, [handle, quality]);
  useEffect(() => { handle?.setReduced(reduced); }, [handle, reduced]);
  useEffect(() => { handle?.setParticles(settings.particles); }, [handle, settings.particles]);
  useEffect(() => { if (trophy) handle?.setTrophy(trophy.kind, trophy.unlocked); }, [handle, trophy?.kind, trophy?.unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // pointer parallax, scroll link and gyroscope
  useEffect(() => {
    if (!handle || !box.current) return;
    const el = box.current;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (kind === "hero") handle.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      else handle.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const leave = () => handle.setPointer(0, 0);
    const target: EventTarget = kind === "hero" ? window : el;
    target.addEventListener("pointermove", move as EventListener);
    if (kind !== "hero") el.addEventListener("pointerleave", leave);
    const onScroll = () => handle.setScroll(window.scrollY / (window.innerHeight * 1.1));
    if (scrollLink) window.addEventListener("scroll", onScroll, { passive: true });
    const orient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      handle.setPointer(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    };
    if (settings.gyro && device.touch && "DeviceOrientationEvent" in window) window.addEventListener("deviceorientation", orient);
    return () => {
      target.removeEventListener("pointermove", move as EventListener);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", orient);
    };
  }, [handle, kind, scrollLink, settings.gyro]);

  // drag to rotate
  useEffect(() => {
    if (!handle || !box.current || !interactive) return;
    const el = box.current;
    let down = false;
    let lx = 0;
    let ly = 0;
    const pd = (e: PointerEvent) => { down = true; lx = e.clientX; ly = e.clientY; handle.setAuto(false); try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ } };
    const pm = (e: PointerEvent) => { if (!down) return; handle.drag(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; };
    const pu = () => { down = false; handle.setAuto(true); };
    el.addEventListener("pointerdown", pd);
    el.addEventListener("pointermove", pm);
    el.addEventListener("pointerup", pu);
    el.addEventListener("pointercancel", pu);
    return () => {
      el.removeEventListener("pointerdown", pd);
      el.removeEventListener("pointermove", pm);
      el.removeEventListener("pointerup", pu);
      el.removeEventListener("pointercancel", pu);
    };
  }, [handle, interactive]);

  if (fallback) {
    return (
      <div className={className}>
        <Css3DFallback label={label} />
      </div>
    );
  }
  return <div ref={box} className={className} style={{ touchAction: interactive && kind !== "hero" ? "pan-y" : "auto", cursor: interactive && kind !== "hero" ? "grab" : undefined }} />;
}
