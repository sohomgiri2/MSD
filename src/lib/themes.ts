export type ThemeId = "csk" | "odi" | "t20";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  short: string;
  tagline: string;
  bg: string;
  bg2: string;
  accent: string;
  accent2: string;
  light: string;
  swatches: string[];
  desc: string;
  particle: string;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  csk: {
    id: "csk", name: "CSK LEGACY", short: "CSK", tagline: "Whistle Podu · Championship Yellow",
    bg: "#0a0906", bg2: "#14110a", accent: "#ffd400", accent2: "#2b5bff", light: "#fff1b0", particle: "#ffd400",
    swatches: ["#ffd400", "#2b5bff", "#0a0906"],
    desc: "Championship yellow, royal blue and stadium black — the colours of the Chepauk roar.",
  },
  odi: {
    id: "odi", name: "ODI LEGACY", short: "ODI", tagline: "Men in Blue · Night of 2011",
    bg: "#040a1c", bg2: "#0a1530", accent: "#3f8cff", accent2: "#c8d2e6", light: "#cfe0ff", particle: "#7fb2ff",
    swatches: ["#3f8cff", "#0a1530", "#c8d2e6"],
    desc: "India blue, deep navy and brushed silver — the glow of a World Cup night in Mumbai.",
  },
  t20: {
    id: "t20", name: "T20 STRIKE", short: "T20", tagline: "Electric · Fearless · Instant",
    bg: "#021016", bg2: "#04202a", accent: "#00f0d2", accent2: "#22b8ff", light: "#b6fff5", particle: "#00f0d2",
    swatches: ["#00f0d2", "#22b8ff", "#04202a"],
    desc: "Electric teal, cyan and deep navy — built for the speed of the shortest format.",
  },
};

export const THEME_ORDER: ThemeId[] = ["csk", "odi", "t20"];

export function applyThemeToDom(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEMES[id].bg);
}
