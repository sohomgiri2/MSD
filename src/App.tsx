import { Suspense, lazy, useEffect, useState, type ComponentType } from "react";
import { AppProvider, useApp } from "./state";
import { BottomNav, Cursor, FpsHud, Loader, SearchModal, ShortcutHelp, Sidebar, SoundPrompt, ToastHost, TopControls } from "./components/Shell";
import { Footer } from "./components/ui";

const views: Record<string, ComponentType> = {
  home: lazy(() => import("./views/Home")),
  career: lazy(() => import("./views/Career")),
  stats: lazy(() => import("./views/Stats")),
  "trophy-room": lazy(() => import("./views/TrophyRoom")),
  csk: lazy(() => import("./views/Legacy").then((m) => ({ default: m.CskView }))),
  odi: lazy(() => import("./views/Legacy").then((m) => ({ default: m.OdiView }))),
  t20: lazy(() => import("./views/Legacy").then((m) => ({ default: m.T20View }))),
  themes: lazy(() => import("./views/ThemeUniverse")),
  moments: lazy(() => import("./views/Moments")),
  media: lazy(() => import("./views/MediaVault")),
  quiz: lazy(() => import("./views/Quiz")),
  about: lazy(() => import("./views/About")),
  developer: lazy(() => import("./views/Developer")),
  settings: lazy(() => import("./views/Settings")),
};

function ViewFallback() {
  return <div className="min-h-[60vh] grid place-items-center mono text-[10px] text-accent blink">Loading screen…</div>;
}

function Shell() {
  const { view, introDone, setIntroDone } = useApp();
  const [loading, setLoading] = useState(true);
  const View = views[view] ?? views.home;
  useEffect(() => {
    document.getElementById("boot")?.remove();
  }, []);
  return (
    <div className="grain relative min-h-screen">
      <div className="atmos" aria-hidden />
      <Sidebar />
      <TopControls />
      <main className="lg:pl-[260px] relative z-[2]" id="main">
        <Suspense fallback={<ViewFallback />}>
          <div key={view}>
            <View />
          </div>
        </Suspense>
        <Footer />
      </main>
      <BottomNav />
      <div id="curtain" className="curtain" aria-hidden />
      <SearchModal />
      <ShortcutHelp />
      <ToastHost />
      <FpsHud />
      <Cursor />
      {introDone && <SoundPrompt />}
      {loading && <Loader onDone={() => { setLoading(false); setIntroDone(); }} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
