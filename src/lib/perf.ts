export type PerfMode = "auto" | "high" | "balanced" | "low";

export interface DeviceInfo {
  cores: number;
  memory: number;
  mobile: boolean;
  dpr: number;
  saveData: boolean;
  webgl: boolean;
  touch: boolean;
  reducedMotion: boolean;
  tier: 0 | 1 | 2;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

export function detectDevice(): DeviceInfo {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia("(pointer:coarse)").matches;
  const saveData = !!nav.connection?.saveData;
  let score = 2;
  if (cores <= 4 || memory <= 3) score = 1;
  if (cores <= 2 || memory <= 2 || saveData) score = 0;
  if (mobile && score > 1) score = 1;
  return {
    cores, memory, mobile, saveData,
    dpr: window.devicePixelRatio || 1,
    webgl: hasWebGL(),
    touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    tier: score as 0 | 1 | 2,
  };
}

export const device: DeviceInfo = detectDevice();

/** Resolve the 3D quality tier (0 low · 1 balanced · 2 high) from the user's performance mode */
export function resolveQuality(mode: PerfMode): 0 | 1 | 2 {
  if (mode === "low") return 0;
  if (mode === "balanced") return 1;
  if (mode === "high") return 2;
  return device.tier;
}

/** Live render stats shared with the optional FPS HUD */
export const perfStats = { fps: 0, quality: 2, kind: "-", draws: 0 };
