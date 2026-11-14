import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { THEMES, applyThemeToDom, type ThemeId } from "./lib/themes";
import { device, resolveQuality, type PerfMode } from "./lib/perf";
import { defaultSoundPrefs, sound, type SoundPrefs } from "./lib/sound";
import { APP_VERSION, idb, ls, storageBus, type FavRecord } from "./lib/storage";
import { ACHIEVEMENTS, SECTIONS, TROPHIES } from "./lib/data";
import { gsap, scrollToTop, setSmoothScroll } from "./lib/motion";

export interface Settings {
  perf: PerfMode;
  motion: "auto" | "reduce" | "full";
  cursor: boolean;
  particles: boolean;
  smooth: boolean;
  showFps: boolean;
  gyro: boolean;
}
const defaultSettings: Settings = { perf: "auto", motion: "auto", cursor: true, particles: true, smooth: true, showFps: false, gyro: true };

export interface Toast { id: number; msg: string; kind: "info" | "ok" | "warn" | "err"; action?: { label: string; run: () => void } }

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

interface Ctx {
  view: string;
  go: (id: string, focus?: string) => void;
  back: () => void;
  canBack: boolean;
  theme: ThemeId;
  liveTheme: ThemeId;
  setTheme: (id: ThemeId, silent?: boolean) => void;
  previewTheme: (id: ThemeId | null) => void;
  resetTheme: () => void;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  sp: SoundPrefs;
  setSound: (p: Partial<SoundPrefs>) => void;
  toast: (msg: string, kind?: Toast["kind"], action?: Toast["action"]) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  achievements: string[];
  award: (id: string) => void;
  trophies: string[];
  unlockTrophy: (id: string) => void;
  lockTrophies: () => void;
  favs: string[];
  toggleFav: (id: string, kind: FavRecord["kind"]) => void;
  reloadFavs: () => void;
  quality: 0 | 1 | 2;
  reduced: boolean;
  searchOpen: boolean;
  setSearchOpen: (b: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (b: boolean) => void;
  fullscreen: boolean;
  toggleFullscreen: () => void;
  online: boolean;
  canInstall: boolean;
  installed: boolean;
  install: () => void;
  updateReady: boolean;
  applyUpdate: () => void;
  swState: string;
  soundPrompt: boolean;
  answerSoundPrompt: (a: "ok" | "later" | "never") => void;
  focus: { view: string; id: string } | null;
  consumeFocus: (view: string) => string | null;
  introDone: boolean;
  setIntroDone: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

const VIEW_IDS = SECTIONS.map((s) => s.id);
function parseHash(): string {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return VIEW_IDS.includes(h) ? h : "home";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<string>(() => parseHash());
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const t = ls.get<string>("theme", "csk");
    return (t in THEMES ? t : "csk") as ThemeId;
  });
  const [preview, setPreview] = useState<ThemeId | null>(null);
  const [settings, setSettingsState] = useState<Settings>(() => ({ ...defaultSettings, ...ls.get<Partial<Settings>>("settings", {}) }));
  const [sp, setSp] = useState<SoundPrefs>(() => ({ ...defaultSoundPrefs, ...ls.get<Partial<SoundPrefs>>("sound", {}) }));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [achievements, setAch] = useState<string[]>(() => ls.get<string[]>("ach", []));
  const [trophies, setTrophies] = useState<string[]>(() => ls.get<string[]>("trophies", []));
  const [favs, setFavs] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia("(display-mode: standalone)").matches);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [swState, setSwState] = useState("not registered");
  const [soundPrompt, setSoundPrompt] = useState(false);
  const [focus, setFocus] = useState<{ view: string; id: string } | null>(null);
  const [introDone, setIntro] = useState(false);
  const stack = useRef<string[]>([view]);
  const viewRef = useRef(view);
  const toastId = useRef(1);
  const busy = useRef(false);

  /* ───── reduced motion & quality ───── */
  const quality = resolveQuality(settings.perf);
  const reduced = settings.motion === "reduce" || (settings.motion === "auto" && device.reducedMotion);
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-motion", reduced ? "reduced" : "full");
    r.setAttribute("data-perf", quality === 0 ? "low" : quality === 1 ? "mid" : "high");
    r.setAttribute("data-cursor", settings.cursor && !device.touch && !reduced ? "on" : "off");
    setSmoothScroll(settings.smooth && !reduced && quality > 0);
  }, [reduced, quality, settings.cursor, settings.smooth]);

  /* ───── toasts ───── */
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((msg: string, kind: Toast["kind"] = "info", action?: Toast["action"]) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, msg, kind, action }]);
    if (!action) setTimeout(() => dismissToast(id), 4200);
    else setTimeout(() => dismissToast(id), 15000);
  }, [dismissToast]);

  useEffect(() => {
    const fn = (e: Event) => toast((e as CustomEvent<string>).detail, "err");
    storageBus.addEventListener("error", fn);
    return () => storageBus.removeEventListener("error", fn);
  }, [toast]);

  /* ───── achievements ───── */
  const achRef = useRef(achievements);
  achRef.current = achievements;
  const award = useCallback((id: string) => {
    if (achRef.current.includes(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    const next = [...achRef.current, id];
    achRef.current = next;
    setAch(next);
    ls.set("ach", next);
    sound.play("success");
    toast(`Badge unlocked: ${a.icon} ${a.name}`, "ok");
  }, [toast]);

  /* ───── theme ───── */
  const setTheme = useCallback((id: ThemeId, silent = false) => {
    setThemeState(id);
    setPreview(null);
    ls.set("theme", id);
    applyThemeToDom(id);
    if (!silent) {
      sound.play("theme");
      toast(`Theme: ${THEMES[id].name}`, "ok");
    }
    const tried = new Set(ls.get<string[]>("themesTried", []));
    tried.add(id);
    ls.set("themesTried", [...tried]);
    if (tried.size >= 3) award("theme-explorer");
  }, [toast, award]);
  const previewTheme = useCallback((id: ThemeId | null) => {
    setPreview(id);
    applyThemeToDom(id ?? ((ls.get<string>("theme", "csk") as ThemeId) || "csk"));
  }, []);
  const resetTheme = useCallback(() => {
    setTheme("csk");
    toast("Theme reset to CSK Legacy (default)", "info");
  }, [setTheme, toast]);
  useEffect(() => { applyThemeToDom(theme); /* restore on load */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ───── settings & sound ───── */
  const setSettings = useCallback((p: Partial<Settings>) => {
    setSettingsState((s) => {
      const n = { ...s, ...p };
      ls.set("settings", n);
      return n;
    });
  }, []);
  const setSound = useCallback((p: Partial<SoundPrefs>) => {
    setSp((s) => {
      const n = { ...s, ...p };
      ls.set("sound", n);
      sound.configure(n);
      if (n.enabled) sound.activate();
      return n;
    });
  }, []);
  useEffect(() => { sound.configure(sp); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const answerSoundPrompt = useCallback((a: "ok" | "later" | "never") => {
    setSoundPrompt(false);
    if (a === "ok") {
      setSound({ enabled: true, permission: "granted", ui: true });
      setTimeout(() => sound.play("success"), 60);
      toast("Sound enabled — tune it in Settings", "ok");
    } else if (a === "never") setSound({ permission: "never" });
    else sessionStorage.setItem("msd:soundLater", "1");
  }, [setSound, toast]);
  // resume audio on first gesture only if the user opted in earlier
  useEffect(() => {
    if (!sp.enabled) return;
    const once = () => sound.activate();
    window.addEventListener("pointerdown", once, { once: true });
    return () => window.removeEventListener("pointerdown", once);
  }, [sp.enabled]);
  // global UI click sound
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("button, a, [role=button], [role=switch], .tab")) sound.play("click");
    };
    document.addEventListener("click", fn, true);
    return () => document.removeEventListener("click", fn, true);
  }, []);

  const setIntroDone = useCallback(() => {
    setIntro(true);
    if (sp.permission === "unset" && !sessionStorage.getItem("msd:soundLater")) setTimeout(() => setSoundPrompt(true), 700);
  }, [sp.permission]);

  /* ───── routing with cinematic transition ───── */
  const swapView = useCallback((next: string) => {
    viewRef.current = next;
    setView(next);
    scrollToTop(true);
    ls.set("lastView", next);
    const s = SECTIONS.find((x) => x.id === next);
    document.title = `${s ? s.label + " · " : ""}MSD — THE LEGEND`;
  }, []);

  useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      if (next === viewRef.current) return;
      const last = stack.current[stack.current.length - 1];
      if (stack.current.length > 1 && stack.current[stack.current.length - 2] === next) stack.current.pop();
      else if (last !== next) stack.current.push(next);
      const curtain = document.getElementById("curtain");
      if (reduced || !curtain || busy.current) {
        swapView(next);
        return;
      }
      busy.current = true;
      const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
      tl.set(curtain, { yPercent: 100, y: 0 })
        .to(curtain, { yPercent: 0, duration: 0.38, ease: "power3.inOut" })
        .add(() => swapView(next))
        .to(curtain, { yPercent: -100, duration: 0.5, ease: "power3.inOut", delay: 0.05 })
        .set(curtain, { yPercent: 100 });
    };
    window.addEventListener("hashchange", onHash);
    document.title = `${SECTIONS.find((x) => x.id === view)?.label ?? ""} · MSD — THE LEGEND`;
    return () => window.removeEventListener("hashchange", onHash);
  }, [reduced, swapView]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((id: string, f?: string) => {
    if (!VIEW_IDS.includes(id)) return;
    if (f) setFocus({ view: id, id: f });
    sound.play("nav");
    if (id === viewRef.current) {
      scrollToTop(false);
      return;
    }
    window.location.hash = `#/${id}`;
  }, []);
  const back = useCallback(() => {
    if (stack.current.length > 1) window.history.back();
    else go("home");
  }, [go]);
  const consumeFocus = useCallback((v: string) => {
    if (focus && focus.view === v) {
      const id = focus.id;
      setFocus(null);
      return id;
    }
    return null;
  }, [focus]);

  /* ───── trophies & favourites ───── */
  const unlockTrophy = useCallback((id: string) => {
    setTrophies((t) => {
      if (t.includes(id)) return t;
      const n = [...t, id];
      ls.set("trophies", n);
      if (n.length >= TROPHIES.length) setTimeout(() => award("trophy-hunter"), 900);
      return n;
    });
  }, [award]);
  const lockTrophies = useCallback(() => { setTrophies([]); ls.set("trophies", []); }, []);

  const reloadFavs = useCallback(() => {
    idb.all<FavRecord>("favs").then((rows) => setFavs(rows.map((r) => r.id)));
  }, []);
  useEffect(() => { reloadFavs(); }, [reloadFavs]);
  const toggleFav = useCallback((id: string, kind: FavRecord["kind"]) => {
    setFavs((f) => {
      const has = f.includes(id);
      if (has) void idb.delete("favs", id);
      else void idb.put("favs", { id, kind, ts: Date.now() });
      const n = has ? f.filter((x) => x !== id) : [...f, id];
      if (n.length >= 3) setTimeout(() => award("archivist"), 200);
      return n;
    });
  }, [award]);

  /* ───── fullscreen, online, PWA ───── */
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => toast("Fullscreen isn't available in this browser.", "warn"));
  }, [toast]);
  useEffect(() => {
    const fs = () => setFullscreen(!!document.fullscreenElement);
    const on = () => { setOnline(true); toast("Back online", "ok"); };
    const off = () => { setOnline(false); toast("You're offline — cached sections keep working", "warn"); };
    const bipFn = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent); };
    const inst = () => { setInstalled(true); setBip(null); toast("MSD installed 🎉", "ok"); };
    document.addEventListener("fullscreenchange", fs);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("beforeinstallprompt", bipFn);
    window.addEventListener("appinstalled", inst);
    return () => {
      document.removeEventListener("fullscreenchange", fs);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", bipFn);
      window.removeEventListener("appinstalled", inst);
    };
  }, [toast]);
  const install = useCallback(() => {
    if (!bip) return;
    void bip.prompt();
    void bip.userChoice.finally(() => setBip(null));
  }, [bip]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) {
      setSwState(import.meta.env.PROD ? "unsupported" : "disabled in dev");
      return;
    }
    let reloading = false;
    const url = new URL("service-worker.js", window.location.href).href;
    navigator.serviceWorker.register(url).then((reg) => {
      setSwState(reg.active ? "active" : "installing");
      const track = (w: ServiceWorker | null) => {
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed") {
            if (navigator.serviceWorker.controller) setWaiting(w);
            else { setSwState("active"); toast("Offline mode ready — core sections are cached", "ok"); }
          }
          if (w.state === "activated") setSwState("active");
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      track(reg.installing);
      reg.addEventListener("updatefound", () => track(reg.installing));
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    }).catch(() => setSwState("registration failed (needs https or localhost)"));
  }, [toast]);
  const applyUpdate = useCallback(() => { waiting?.postMessage({ type: "SKIP_WAITING" }); }, [waiting]);
  useEffect(() => {
    if (waiting) toast(`A new version of MSD is ready (current v${APP_VERSION})`, "info", { label: "Update", run: () => waiting.postMessage({ type: "SKIP_WAITING" }) });
  }, [waiting, toast]);

  /* ───── keyboard shortcuts ───── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = VIEW_IDS.indexOf(viewRef.current);
      if (e.key === "/") { e.preventDefault(); setSearchOpen(true); }
      else if (e.key === "?") setHelpOpen(true);
      else if (e.key === "]") go(VIEW_IDS[(idx + 1) % VIEW_IDS.length]);
      else if (e.key === "[") go(VIEW_IDS[(idx - 1 + VIEW_IDS.length) % VIEW_IDS.length]);
      else if (e.key === "h") go("home");
      else if (e.key === "s") go("settings");
      else if (e.key === "f") toggleFullscreen();
      else if (e.key === "t") {
        const order: ThemeId[] = ["csk", "odi", "t20"];
        setTheme(order[(order.indexOf(ls.get("theme", "csk") as ThemeId) + 1) % 3]);
      } else if (e.key === "m") setSound({ muted: !sp.muted });
      else if (e.code.startsWith("Digit")) {
        const n = Number(e.code.slice(5));
        const target = e.shiftKey ? (n >= 1 && n <= 4 ? 10 + n : -1) : n === 0 ? 9 : n - 1;
        if (target >= 0 && target < VIEW_IDS.length) go(VIEW_IDS[target]);
      } else if (e.key === "Escape") { setSearchOpen(false); setHelpOpen(false); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [go, setTheme, toggleFullscreen, setSound, sp.muted]);

  const value: Ctx = useMemo(() => ({
    view, go, back, canBack: view !== "home", theme, liveTheme: preview ?? theme, setTheme, previewTheme, resetTheme,
    settings, setSettings, sp, setSound, toast, toasts, dismissToast, achievements, award, trophies, unlockTrophy, lockTrophies,
    favs, toggleFav, reloadFavs, quality, reduced, searchOpen, setSearchOpen, helpOpen, setHelpOpen, fullscreen, toggleFullscreen,
    online, canInstall: !!bip, installed, install, updateReady: !!waiting, applyUpdate, swState, soundPrompt, answerSoundPrompt,
    focus, consumeFocus, introDone, setIntroDone,
  }), [view, go, back, theme, preview, setTheme, previewTheme, resetTheme, settings, setSettings, sp, setSound, toast, toasts, dismissToast,
    achievements, award, trophies, unlockTrophy, lockTrophies, favs, toggleFav, reloadFavs, quality, reduced, searchOpen, helpOpen,
    fullscreen, toggleFullscreen, online, bip, installed, install, waiting, applyUpdate, swState, soundPrompt, answerSoundPrompt,
    focus, consumeFocus, introDone, setIntroDone]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
