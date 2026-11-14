import { DOT_GLYPHS } from "../components/ui";

export const WALL_CATS = [
  { id: "csk", name: "CSK", bg: "#0a0906", bg2: "#1d1704", accent: "#ffd400", accent2: "#2b5bff", ink: "#fff7dc" },
  { id: "odi", name: "ODI", bg: "#040a1c", bg2: "#0d1f4a", accent: "#3f8cff", accent2: "#c8d2e6", ink: "#e9f0ff" },
  { id: "t20", name: "T20", bg: "#021016", bg2: "#053040", accent: "#00f0d2", accent2: "#22b8ff", ink: "#e3fffb" },
  { id: "gold", name: "Gold Minimal", bg: "#050505", bg2: "#14110a", accent: "#d4a017", accent2: "#fff3c4", ink: "#f5ecd0" },
] as const;
export type WallCat = (typeof WALL_CATS)[number];
export const WALL_VARIANTS = ["Dot Matrix", "Floodlights", "Minimal"];

function dot(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, cell: number, color: string, glow = true) {
  ctx.save();
  ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = cell * 1.4; }
  text.toUpperCase().split("").forEach((ch, ci) => {
    const rows = (DOT_GLYPHS[ch] ?? DOT_GLYPHS["?"]).split(",");
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < 5; rx++) {
        if (row[rx] !== "1") continue;
        ctx.beginPath();
        ctx.arc(x + ci * 6 * cell + rx * cell + cell / 2, y + ry * cell + cell / 2, cell * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  });
  ctx.restore();
}
const dotWidth = (t: string, cell: number) => t.length * 6 * cell - cell;

export function drawWallpaper(canvas: HTMLCanvasElement, cat: WallCat, variant: number, w: number, h: number) {
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d")!;
  const u = w / 1080;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, cat.bg2);
  g.addColorStop(1, cat.bg);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  if (variant === 0) {
    c.fillStyle = cat.accent + "33";
    for (let y = 30 * u; y < h; y += 46 * u) for (let x = 30 * u; x < w; x += 46 * u) { c.beginPath(); c.arc(x, y, 2.2 * u, 0, 7); c.fill(); }
    const cell = 30 * u;
    dot(c, "MSD", (w - dotWidth("MSD", cell)) / 2, h * 0.34, cell, cat.accent);
    const c2 = 14 * u;
    dot(c, "THE LEGEND", (w - dotWidth("THE LEGEND", c2)) / 2, h * 0.34 + 7 * cell + 60 * u, c2, cat.ink, false);
    c.font = `${26 * u}px ui-monospace, monospace`;
    c.fillStyle = cat.accent2;
    c.textAlign = "center";
    c.fillText("BEYOND CRICKET. BEYOND TIME.", w / 2, h * 0.92);
  } else if (variant === 1) {
    for (let i = 0; i < 5; i++) {
      const x0 = w * (0.1 + i * 0.2);
      const gr = c.createLinearGradient(x0, 0, w / 2, h * 0.75);
      gr.addColorStop(0, cat.accent + "55");
      gr.addColorStop(1, cat.accent + "00");
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(x0 - 20 * u, 0);
      c.lineTo(x0 + 20 * u, 0);
      c.lineTo(w / 2 + (i - 2) * 180 * u + 120 * u, h * 0.8);
      c.lineTo(w / 2 + (i - 2) * 180 * u - 120 * u, h * 0.8);
      c.fill();
    }
    c.strokeStyle = cat.accent + "55";
    c.lineWidth = 2 * u;
    for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(w / 2, h * 0.88, (260 + i * 90) * u, (60 + i * 18) * u, 0, 0, Math.PI * 2); c.stroke(); }
    const tg = c.createLinearGradient(0, h * 0.25, 0, h * 0.6);
    tg.addColorStop(0, "#fff3c4");
    tg.addColorStop(0.5, "#d4a017");
    tg.addColorStop(1, "#7a5a0c");
    c.fillStyle = tg;
    c.font = `700 ${620 * u}px "Playfair Display", Georgia, serif`;
    c.textAlign = "center";
    c.shadowColor = cat.accent;
    c.shadowBlur = 60 * u;
    c.fillText("7", w / 2, h * 0.58);
    c.shadowBlur = 0;
    c.fillStyle = cat.ink;
    c.font = `${28 * u}px ui-monospace, monospace`;
    c.fillText("MSD · THE LEGEND", w / 2, h * 0.93);
  } else {
    c.strokeStyle = cat.accent;
    c.lineWidth = 3 * u;
    c.beginPath();
    c.arc(w / 2, h * 0.45, 300 * u, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = cat.accent + "44";
    c.beginPath();
    c.arc(w / 2, h * 0.45, 340 * u, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = cat.ink;
    c.textAlign = "center";
    c.font = `700 ${150 * u}px "Playfair Display", Georgia, serif`;
    c.fillText("MSD", w / 2, h * 0.45 + 50 * u);
    c.font = `${26 * u}px ui-monospace, monospace`;
    c.fillStyle = cat.accent;
    c.fillText("BEYOND CRICKET. BEYOND TIME.", w / 2, h * 0.9);
  }
  c.fillStyle = "#ffffff55";
  c.font = `${18 * u}px ui-monospace, monospace`;
  c.textAlign = "center";
  c.fillText("Unofficial fan art · by Sohom Giri", w / 2, h - 36 * u);
}
