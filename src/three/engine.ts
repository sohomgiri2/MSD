/**
 * Three.js scene engine for MSD — THE LEGEND.
 * All models are procedurally generated (no external GLB downloads) so they work offline and stay tiny.
 * They are stylised interpretations, NOT replicas of the real trophies.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontJson from "../assets/font.json";
import { perfStats } from "../lib/perf";
import { THEMES, type ThemeId } from "../lib/themes";
import type { TrophyKind } from "../lib/data";

export type SceneKind = "hero" | "ball" | "trophy" | "emblem";
export interface SceneOpts {
  kind: SceneKind;
  canvas: HTMLCanvasElement;
  quality: 0 | 1 | 2;
  reduced: boolean;
  theme: ThemeId;
  text?: string;
  particles: boolean;
  adaptive: boolean;
  onLost?: () => void;
  onQuality?: (q: 0 | 1 | 2) => void;
}
export interface SceneHandle {
  setTheme(id: ThemeId): void;
  setQuality(q: 0 | 1 | 2): void;
  setReduced(b: boolean): void;
  setParticles(b: boolean): void;
  setPointer(x: number, y: number): void;
  setScroll(p: number): void;
  setPaused(b: boolean): void;
  setAuto(b: boolean): void;
  drag(dx: number, dy: number): void;
  zoom(d: number): void;
  resize(): void;
  setTrophy(kind: TrophyKind, unlocked: boolean): void;
  reveal(): void;
  burst(): void;
  dispose(): void;
}

interface Built {
  update(dt: number, t: number): void;
  onResize?(aspect: number): void;
  setTrophy?(kind: TrophyKind, unlocked: boolean): void;
  reveal?(): void;
}

const WHITE = new THREE.Color(1, 1, 1);
const QUALITY_DPR = [1, 1.5, 2];
const QUALITY_PART = [0.3, 0.65, 1];

/* ───────────────── helpers ───────────────── */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const glowTex = () =>
  canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });

interface Colors {
  accent: THREE.Color;
  accent2: THREE.Color;
  light: THREE.Color;
  bg: THREE.Color;
}

/* ───────────────── main factory ───────────────── */
export function createScene(o: SceneOpts): SceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas: o.canvas,
    antialias: o.quality > 0,
    alpha: o.kind !== "hero",
    powerPreference: "high-performance",
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  let quality = o.quality;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALITY_DPR[quality]));
  if (o.kind !== "hero") renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  const col: Colors = { accent: new THREE.Color(), accent2: new THREE.Color(), light: new THREE.Color(), bg: new THREE.Color() };
  const tgt: Colors = { accent: new THREE.Color(), accent2: new THREE.Color(), light: new THREE.Color(), bg: new THREE.Color() };
  const setTarget = (id: ThemeId, snap = false) => {
    const t = THEMES[id];
    tgt.accent.set(t.accent);
    tgt.accent2.set(t.accent2);
    tgt.light.set(t.light);
    tgt.bg.set(t.bg);
    if (snap) {
      col.accent.copy(tgt.accent);
      col.accent2.copy(tgt.accent2);
      col.light.copy(tgt.light);
      col.bg.copy(tgt.bg);
    }
  };
  setTarget(o.theme, true);

  const st = {
    px: 0, py: 0, sx: 0, sy: 0, scroll: 0, speed: o.reduced ? 0.15 : 1, particles: o.particles,
    auto: true, velX: 0, velY: 0, rotX: 0, rotY: 0, zoom: 0, lastDrag: -10, burst: 0,
  };
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };
  track(envRT);
  const glow = track(glowTex());

  /* ── particles ── */
  const makeParticles = (count: number, sx: number, sy: number, sz: number, y0: number, size: number, rise: number) => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * sx;
      pos[i * 3 + 1] = y0 + Math.random() * sy;
      pos[i * 3 + 2] = (Math.random() - 0.5) * sz;
      spd[i] = 0.3 + Math.random();
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = track(new THREE.PointsMaterial({ map: glow, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: col.accent, opacity: 0.85, sizeAttenuation: true }));
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    const apply = () => geo.setDrawRange(0, Math.floor(count * QUALITY_PART[quality]));
    apply();
    return {
      pts, apply,
      update(dt: number) {
        pts.visible = st.particles;
        mat.color.copy(col.accent);
        const a = geo.attributes.position as THREE.BufferAttribute;
        const k = (1 + st.burst * 6) * st.speed;
        for (let i = 0; i < count; i++) {
          let y = a.getY(i) + dt * rise * spd[i] * k;
          if (y > y0 + sy) y = y0;
          a.setY(i, y);
          a.setX(i, a.getX(i) + Math.sin(performance.now() * 0.0003 + i) * dt * 0.2 * st.speed);
        }
        a.needsUpdate = true;
      },
    };
  };

  /* ── cricket ball ── */
  const makeBall = () => {
    const g = new THREE.Group();
    const grain = track(canvasTex(256, 256, (c) => {
      c.fillStyle = "#808080";
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 5000; i++) {
        const v = 90 + Math.random() * 90;
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    }));
    grain.colorSpace = THREE.NoColorSpace;
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(3, 2);
    const mat = track(new THREE.MeshPhysicalMaterial({ color: 0x9b1515, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, bumpMap: grain, bumpScale: 0.6, envMapIntensity: 1.5 }));
    const seg = quality > 0 ? 64 : 40;
    g.add(new THREE.Mesh(track(new THREE.SphereGeometry(1, seg, seg * 0.75)), mat));
    const seamMat = track(new THREE.MeshStandardMaterial({ color: 0xf1e6c8, roughness: 0.55, metalness: 0.1 }));
    const seam = new THREE.Mesh(track(new THREE.TorusGeometry(1.003, 0.02, 8, 140)), seamMat);
    g.add(seam);
    const N = 64;
    const sg = track(new THREE.BoxGeometry(0.014, 0.03, 0.06));
    const stitches = new THREE.InstancedMesh(sg, seamMat, N * 2);
    const d = new THREE.Object3D();
    let n = 0;
    for (const z of [-0.075, 0.075]) {
      const r = Math.sqrt(1 - z * z) * 1.004;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        d.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
        d.rotation.set(0, 0, a);
        d.rotateX(i % 2 ? 0.55 : -0.55);
        d.updateMatrix();
        stitches.setMatrixAt(n++, d.matrix);
      }
    }
    g.add(stitches);
    g.rotation.x = 0.5;
    return g;
  };

  /* ───────────────── HERO: stadium ───────────────── */
  const buildHero = (): Built => {
    scene.background = col.bg;
    const fog = new THREE.FogExp2(col.bg, 0.0105);
    scene.fog = fog;
    camera.fov = 55;
    camera.position.set(0, 2.6, 16);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x202028, 0.55);
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(6, 12, 10);
    const rim = new THREE.DirectionalLight(0xffffff, 2.2);
    rim.position.set(-8, 3, -6);
    scene.add(hemi, key, rim);

    // ground
    const grass = track(canvasTex(512, 512, (g) => {
      for (let i = 0; i < 24; i++) {
        g.fillStyle = i % 2 ? "#1a3b22" : "#13301b";
        g.fillRect((i * 512) / 24, 0, 512 / 24 + 1, 512);
      }
      for (let i = 0; i < 4000; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
        g.fillRect(Math.random() * 512, Math.random() * 512, 1, 2);
      }
    }));
    const groundMat = track(new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95, metalness: 0 }));
    const ground = new THREE.Mesh(track(new THREE.CircleGeometry(46, 80)), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const outer = new THREE.Mesh(track(new THREE.CircleGeometry(220, 48)), track(new THREE.MeshBasicMaterial({ color: 0x050507 })));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.05;
    scene.add(outer);

    // boundary rope
    const rope = new THREE.Mesh(track(new THREE.TorusGeometry(45, 0.12, 6, 160)), track(new THREE.MeshBasicMaterial({ color: col.light })));
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.12;
    scene.add(rope);

    // pitch + creases
    const pitch = new THREE.Mesh(track(new THREE.PlaneGeometry(3.05, 20.12)), track(new THREE.MeshStandardMaterial({ color: 0x9a875a, roughness: 1 })));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.01;
    scene.add(pitch);
    const lineMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    for (const z of [-8.8, 8.8]) {
      const l = new THREE.Mesh(track(new THREE.PlaneGeometry(3.6, 0.07)), lineMat);
      l.rotation.x = -Math.PI / 2;
      l.position.set(0, 0.02, z);
      scene.add(l);
    }
    // stumps
    const stumpMat = track(new THREE.MeshStandardMaterial({ color: 0xf0e2b6, roughness: 0.5 }));
    const stumpGeo = track(new THREE.CylinderGeometry(0.03, 0.03, 0.71, 10));
    const bailGeo = track(new THREE.CylinderGeometry(0.013, 0.013, 0.12, 6));
    for (const z of [-10.06, 10.06]) {
      for (const x of [-0.1, 0, 0.1]) {
        const s = new THREE.Mesh(stumpGeo, stumpMat);
        s.position.set(x, 0.355, z);
        scene.add(s);
      }
      for (const x of [-0.05, 0.05]) {
        const b = new THREE.Mesh(bailGeo, stumpMat);
        b.rotation.z = Math.PI / 2;
        b.position.set(x, 0.725, z);
        scene.add(b);
      }
    }
    // light pool
    const poolMat = track(new THREE.MeshBasicMaterial({ map: glow, color: col.light, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    const pool = new THREE.Mesh(track(new THREE.PlaneGeometry(90, 90)), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.05;
    scene.add(pool);

    // stands
    const crowd = track(canvasTex(512, 128, (g) => {
      g.fillStyle = "#08080b";
      g.fillRect(0, 0, 512, 128);
      const cols = ["#ffffff", "#ffe9a8", "#ffd400", "#ff7a7a", "#9cc4ff", "#ffffff", "#ffffff"];
      for (let i = 0; i < 3200; i++) {
        g.globalAlpha = 0.25 + Math.random() * 0.75;
        g.fillStyle = cols[(Math.random() * cols.length) | 0];
        g.fillRect(Math.random() * 512, Math.random() * 128, 1.6, 1.6);
      }
      g.globalAlpha = 1;
      g.fillStyle = "#030305";
      for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 512, 2);
    }));
    crowd.wrapS = crowd.wrapT = THREE.RepeatWrapping;
    crowd.repeat.set(10, 1);
    const standMat = track(new THREE.MeshStandardMaterial({ color: 0x1a1a22, map: crowd, emissiveMap: crowd, emissive: col.light, emissiveIntensity: 0.75, roughness: 0.9, side: THREE.DoubleSide }));
    const tiers = quality > 0 ? 6 : 4;
    for (let i = 0; i < tiers; i++) {
      const rb = 46 + i * 4.4;
      const m = new THREE.Mesh(track(new THREE.CylinderGeometry(rb + 4.4, rb, 2.6, quality > 0 ? 120 : 72, 1, true)), standMat);
      m.position.y = 1.3 + i * 2.6;
      scene.add(m);
    }
    const topR = 46 + tiers * 4.4;
    const topY = tiers * 2.6;
    // roof
    const roof = new THREE.Mesh(track(new THREE.RingGeometry(topR - 4, topR + 12, 96)), track(new THREE.MeshStandardMaterial({ color: 0x0c0c10, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide })));
    roof.rotation.x = -Math.PI / 2;
    roof.position.y = topY + 3;
    scene.add(roof);
    const lightRing = new THREE.Mesh(track(new THREE.TorusGeometry(topR, 0.35, 6, 200)), track(new THREE.MeshBasicMaterial({ color: col.light })));
    lightRing.rotation.x = Math.PI / 2;
    lightRing.position.y = topY + 2.8;
    scene.add(lightRing);

    // camera flashes
    const FN = 90;
    const fpos = new Float32Array(FN * 3);
    const fcol = new Float32Array(FN * 3);
    for (let i = 0; i < FN; i++) {
      const a = Math.random() * Math.PI * 2;
      const tier = Math.random() * tiers;
      const r = 46 + tier * 4.4 + 2;
      fpos.set([Math.cos(a) * r, 1.5 + tier * 2.6, Math.sin(a) * r], i * 3);
    }
    const fgeo = track(new THREE.BufferGeometry());
    fgeo.setAttribute("position", new THREE.BufferAttribute(fpos, 3));
    fgeo.setAttribute("color", new THREE.BufferAttribute(fcol, 3));
    const flashes = new THREE.Points(fgeo, track(new THREE.PointsMaterial({ map: glow, size: 2.6, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    flashes.frustumCulled = false;
    scene.add(flashes);

    // floodlight towers
    const lampTex = track(canvasTex(128, 64, (g) => {
      g.fillStyle = "#202024";
      g.fillRect(0, 0, 128, 64);
      for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) {
        const gr = g.createRadialGradient(6 + x * 10.6, 6 + y * 10.6, 0, 6 + x * 10.6, 6 + y * 10.6, 6);
        gr.addColorStop(0, "#fff");
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.fillRect(x * 10.6, y * 10.6, 12, 12);
      }
    }));
    const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x2a2a32, metalness: 0.8, roughness: 0.4 }));
    const lampMat = track(new THREE.MeshBasicMaterial({ map: lampTex, color: col.light }));
    const beamMat = track(new THREE.MeshBasicMaterial({ color: col.light, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const beamGeo = track(new THREE.ConeGeometry(15, 130, 28, 1, true));
    beamGeo.translate(0, -65, 0);
    beamGeo.rotateX(-Math.PI / 2);
    const poleGeo = track(new THREE.CylinderGeometry(0.7, 1.1, 46, 8));
    const lampGeo = track(new THREE.PlaneGeometry(15, 8));
    const lampBack = track(new THREE.BoxGeometry(15.4, 8.4, 0.5));
    const towers = quality > 0 ? 6 : 4;
    for (let i = 0; i < towers; i++) {
      const a = (i / towers) * Math.PI * 2 + 0.5;
      const r = topR + 18;
      const grp = new THREE.Group();
      grp.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 23;
      grp.add(pole);
      const head = new THREE.Group();
      head.position.y = 46;
      const back = new THREE.Mesh(lampBack, poleMat);
      back.position.z = -0.3;
      head.add(back, new THREE.Mesh(lampGeo, lampMat));
      head.add(new THREE.Mesh(beamGeo, beamMat));
      grp.add(head);
      scene.add(grp);
      grp.updateMatrixWorld(true);
      head.lookAt(0, 2, 0);
    }

    const dust = makeParticles(900, 90, 28, 120, 0, 0.28, 0.9);
    const ball = makeBall();
    const ballHolder = new THREE.Group();
    ballHolder.add(ball);
    // orbit ring
    const ringMat = track(new THREE.MeshBasicMaterial({ color: col.accent, transparent: true, opacity: 0.7 }));
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(1.75, 0.007, 6, 120)), ringMat);
    ring.rotation.x = 1.2;
    ballHolder.add(ring);
    const sat = new THREE.Mesh(track(new THREE.SphereGeometry(0.05, 10, 10)), ringMat);
    ballHolder.add(sat);
    const accentLight = new THREE.PointLight(0xffffff, 40, 14, 2);
    ballHolder.add(accentLight);
    accentLight.position.set(-2, 1, 2);
    scene.add(ballHolder);
    let aspect = 1.6;

    return {
      onResize(a) { aspect = a; },
      update(dt, t) {
        st.sx += (st.px - st.sx) * Math.min(1, dt * 3);
        st.sy += (st.py - st.sy) * Math.min(1, dt * 3);
        const p = st.scroll;
        const drift = Math.sin(t * 0.18 * st.speed) * 0.6;
        camera.position.set(st.sx * 1.8 + drift, 2.6 + p * 22 - st.sy * 0.6, 16 - p * 4 + st.zoom);
        camera.lookAt(st.sx * 1.2, 3.4 + p * -6, -30);
        beamMat.opacity = 0.045 + Math.sin(t * 0.7) * 0.01;
        standMat.emissive.copy(col.light);
        standMat.emissiveIntensity = 0.7 + Math.sin(t * 1.3) * 0.06;
        lampMat.color.copy(col.light);
        beamMat.color.copy(col.light);
        poolMat.color.copy(col.light);
        (lightRing.material as THREE.MeshBasicMaterial).color.copy(col.light);
        (rope.material as THREE.MeshBasicMaterial).color.copy(col.light);
        groundMat.color.copy(col.accent).lerp(WHITE, 0.78);
        rim.color.copy(col.accent);
        key.color.copy(col.light);
        accentLight.color.copy(col.accent);
        ringMat.color.copy(col.accent);
        // ball placement is aspect aware
        const wide = Math.min(1, Math.max(0, (aspect - 0.85) / 0.8));
        const bx = wide * 3.5 + st.sx * 0.4;
        const by = 3.1 + (1 - wide) * 2.4 + Math.sin(t * 1.1 * st.speed) * 0.18 - st.sy * 0.2 + p * 16;
        ballHolder.position.set(bx, by, 9.6);
        const sc = (0.75 + wide * 0.3) * (1 - p * 0.3);
        ballHolder.scale.setScalar(sc);
        st.rotY += st.velY;
        st.rotX += st.velX;
        st.velY *= 0.94;
        st.velX *= 0.94;
        ball.rotation.y += dt * 0.55 * st.speed + st.velY;
        ball.rotation.x = 0.5 + st.rotX;
        ring.rotation.z += dt * 0.4 * st.speed;
        sat.position.set(Math.cos(t * 1.4 * st.speed) * 1.75, Math.sin(t * 1.4 * st.speed) * 1.75 * Math.cos(1.2), Math.sin(t * 1.4 * st.speed) * 1.75 * Math.sin(1.2));
        // flashes
        const a = fgeo.attributes.color as THREE.BufferAttribute;
        for (let i = 0; i < FN; i++) {
          const v = Math.max(0, a.getX(i) - dt * 4);
          const nv = v === 0 && Math.random() < 0.004 * st.speed ? 1 : v;
          a.setXYZ(i, nv, nv, nv);
        }
        a.needsUpdate = true;
        dust.update(dt);
      },
    };
  };

  /* ───────────────── BALL showcase ───────────────── */
  const buildBall = (): Built => {
    camera.position.set(0, 0, 5.2);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x303040, 0.6);
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(3, 4, 4);
    const rim = new THREE.DirectionalLight(0xffffff, 3);
    rim.position.set(-4, 1, -3);
    scene.add(hemi, key, rim);
    const ball = makeBall();
    scene.add(ball);
    const ringMat = track(new THREE.MeshBasicMaterial({ color: col.accent, transparent: true, opacity: 0.7 }));
    const rings = [1.6, 2.0].map((r, i) => {
      const m = new THREE.Mesh(track(new THREE.TorusGeometry(r, 0.008, 6, 120)), ringMat);
      m.rotation.set(1.1 + i * 0.5, i * 0.7, 0);
      scene.add(m);
      return m;
    });
    const parts = makeParticles(300, 10, 8, 6, -4, 0.09, 0.35);
    return {
      update(dt, t) {
        st.sx += (st.px - st.sx) * Math.min(1, dt * 3);
        st.sy += (st.py - st.sy) * Math.min(1, dt * 3);
        st.rotY += st.velY;
        st.velY *= 0.94;
        st.velX *= 0.94;
        st.rotX += st.velX;
        ball.rotation.y += dt * 0.6 * st.speed + st.velY;
        ball.rotation.x = 0.5 + st.rotX + st.sy * 0.3;
        ball.position.set(st.sx * 0.2, Math.sin(t * st.speed) * 0.08, 0);
        rings.forEach((r, i) => (r.rotation.z += dt * (0.3 + i * 0.2) * st.speed));
        ringMat.color.copy(col.accent);
        rim.color.copy(col.accent);
        key.color.copy(col.light);
        parts.update(dt);
        camera.position.z = 5.2 + st.zoom * 0.3;
      },
    };
  };

  /* ───────────────── EMBLEM ───────────────── */
  const buildEmblem = (): Built => {
    camera.position.set(0, 0, 8);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x303040, 0.5);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 4, 6);
    const rim = new THREE.DirectionalLight(0xffffff, 2.5);
    rim.position.set(-5, -1, -3);
    scene.add(hemi, key, rim);
    const font = new FontLoader().parse(fontJson as never);
    const text = o.text || "SG";
    const geo = track(new TextGeometry(text, { font, size: 1, depth: 0.3, curveSegments: quality > 0 ? 8 : 4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: quality > 0 ? 4 : 2 }));
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -0.15);
    const width = bb.max.x - bb.min.x;
    const goldMat = track(new THREE.MeshPhysicalMaterial({ color: 0xd9a520, metalness: 1, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.7 }));
    const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x0b0b0e, metalness: 0.9, roughness: 0.35, envMapIntensity: 1 }));
    const silverMat = track(new THREE.MeshStandardMaterial({ color: 0xdfe4ee, metalness: 1, roughness: 0.18, envMapIntensity: 1.5 }));
    const accentMat = track(new THREE.MeshBasicMaterial({ color: col.accent }));
    const group = new THREE.Group();
    const textMesh = new THREE.Mesh(geo, goldMat);
    const fit = Math.min(1, 3.1 / width) * (text.length <= 2 ? 1.9 : 1);
    textMesh.scale.setScalar(fit);
    textMesh.position.z = 0.12;
    const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(2.55, 2.55, 0.16, 6 * 8)), darkMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.z = -0.08;
    const rimM = new THREE.Mesh(track(new THREE.TorusGeometry(2.55, 0.07, 12, 100)), goldMat);
    const rimIn = new THREE.Mesh(track(new THREE.TorusGeometry(2.2, 0.02, 8, 100)), accentMat);
    group.add(disc, rimM, rimIn, textMesh);
    // dot marks around
    const dotGeo = track(new THREE.SphereGeometry(0.035, 8, 8));
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const d = new THREE.Mesh(dotGeo, i % 4 === 0 ? accentMat : silverMat);
      d.position.set(Math.cos(a) * 2.38, Math.sin(a) * 2.38, 0.02);
      group.add(d);
    }
    scene.add(group);
    const g1 = new THREE.Mesh(track(new THREE.TorusGeometry(3.05, 0.025, 8, 140)), silverMat);
    const g2 = new THREE.Mesh(track(new THREE.TorusGeometry(3.4, 0.015, 8, 140)), accentMat);
    scene.add(g1, g2);
    const parts = makeParticles(200, 12, 9, 6, -4.5, 0.1, 0.3);
    let spin = 0;
    return {
      reveal() { spin = 1; },
      update(dt, t) {
        st.sx += (st.px - st.sx) * Math.min(1, dt * 3);
        st.sy += (st.py - st.sy) * Math.min(1, dt * 3);
        st.rotY += st.velY;
        st.velY *= 0.94;
        st.velX *= 0.94;
        st.rotX += st.velX;
        spin = Math.max(0, spin - dt / 1.6);
        const sw = Math.sin(t * 0.6 * st.speed) * 0.5;
        group.rotation.y = (st.auto ? sw : 0) + st.rotY + st.sx * 0.4 + (1 - Math.pow(1 - spin, 3)) * Math.PI * 2 * (spin > 0 ? 1 : 0);
        group.rotation.x = st.rotX - st.sy * 0.25 + Math.sin(t * 0.4 * st.speed) * 0.05;
        g1.rotation.set(t * 0.4 * st.speed, t * 0.25 * st.speed, 0);
        g2.rotation.set(Math.PI / 2 - t * 0.2 * st.speed, t * 0.3 * st.speed, 0);
        accentMat.color.copy(col.accent);
        rim.color.copy(col.accent);
        parts.update(dt);
        camera.position.z = 8 + st.zoom * 0.4;
      },
    };
  };

  /* ───────────────── TROPHY museum ───────────────── */
  const buildTrophy = (): Built => {
    camera.fov = 40;
    camera.position.set(0, 2.9, 9.2);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x101018, 0.45);
    const key = new THREE.SpotLight(0xffffff, 380, 30, 0.5, 0.6, 1.6);
    key.position.set(2, 9, 4);
    key.target.position.set(0, 2, 0);
    const rim = new THREE.DirectionalLight(0xffffff, 2.4);
    rim.position.set(-5, 3, -5);
    const fill = new THREE.PointLight(0xffffff, 24, 12, 2);
    fill.position.set(0, 1.2, 4);
    scene.add(hemi, key, key.target, rim, fill);

    const floorMat = track(new THREE.MeshStandardMaterial({ color: 0x08080b, metalness: 0.85, roughness: 0.28, envMapIntensity: 0.8 }));
    const floor = new THREE.Mesh(track(new THREE.CircleGeometry(9, 64)), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const goldMat = track(new THREE.MeshStandardMaterial({ color: 0xd9a520, metalness: 1, roughness: 0.2, envMapIntensity: 1.7 }));
    const silverMat = track(new THREE.MeshStandardMaterial({ color: 0xe3e7ef, metalness: 1, roughness: 0.16, envMapIntensity: 1.6 }));
    const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x0d0d11, metalness: 0.8, roughness: 0.35 }));
    const accentMat = track(new THREE.MeshBasicMaterial({ color: col.accent }));
    const lockMat = track(new THREE.MeshStandardMaterial({ color: 0x0a0a0e, metalness: 0.3, roughness: 0.55, emissive: col.accent, emissiveIntensity: 0.05, transparent: true, opacity: 0.92 }));
    const ped = new THREE.Mesh(track(new THREE.CylinderGeometry(1.5, 1.8, 0.7, 64)), darkMat);
    ped.position.y = 0.35;
    const pedRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.52, 0.03, 8, 96)), accentMat);
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.y = 0.7;
    const pedTop = new THREE.Mesh(track(new THREE.CylinderGeometry(1.45, 1.5, 0.05, 64)), goldMat);
    pedTop.position.y = 0.72;
    scene.add(ped, pedRing, pedTop);
    // volumetric beam
    const beamMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const beamGeo = track(new THREE.ConeGeometry(2.3, 9, 32, 1, true));
    beamGeo.translate(0, -4.5, 0);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 9, 0);
    scene.add(beam);

    const holder = new THREE.Group();
    holder.position.y = 0.75;
    scene.add(holder);
    let current: THREE.Group | null = null;
    let curKind: TrophyKind = "globe";
    let unlocked = true;
    let scaleT = 1;
    let flash = 0;
    let spin = 0;
    const lathe = (pts: [number, number][], m: THREE.Material) => {
      const g = track(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 56));
      return new THREE.Mesh(g, m);
    };
    const build = (kind: TrophyKind): THREE.Group => {
      const g = new THREE.Group();
      const add = (m: THREE.Object3D) => { g.add(m); return m; };
      if (kind === "globe") {
        add(lathe([[0, 0], [0.8, 0], [0.8, 0.12], [0.6, 0.2], [0.5, 0.35], [0, 0.35]], goldMat));
        for (let i = 0; i < 3; i++) {
          const pts: THREE.Vector3[] = [];
          for (let k = 0; k <= 16; k++) {
            const u = k / 16;
            const a = (i / 3) * Math.PI * 2 + u * 1.5;
            const r = 0.5 + 0.28 * Math.sin(u * Math.PI);
            pts.push(new THREE.Vector3(Math.cos(a) * r, 0.35 + u * 1.85, Math.sin(a) * r));
          }
          add(new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.085, 10)), silverMat));
        }
        const globe = new THREE.Mesh(track(new THREE.SphereGeometry(0.66, 48, 32)), goldMat);
        globe.position.y = 2.6;
        add(globe);
        for (let i = 0; i < 3; i++) {
          const r = new THREE.Mesh(track(new THREE.TorusGeometry(0.67, 0.016, 8, 64)), silverMat);
          r.position.y = 2.6;
          r.rotation.set(i === 0 ? Math.PI / 2 : 0, (i * Math.PI) / 3, 0);
          add(r);
        }
      } else if (kind === "t20") {
        add(lathe([[0, 0], [0.75, 0], [0.75, 0.15], [0.45, 0.28], [0.2, 0.5], [0.16, 1.1], [0.3, 1.3], [0.7, 1.65], [0.95, 2.4], [0.9, 2.5], [0.82, 2.42], [0.55, 1.8], [0.2, 1.5], [0, 1.45]], silverMat));
        const band = new THREE.Mesh(track(new THREE.TorusGeometry(0.93, 0.04, 8, 64)), goldMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = 2.45;
        add(band);
        for (const s of [-1, 1]) {
          const h = new THREE.Mesh(track(new THREE.TorusGeometry(0.42, 0.045, 8, 28, Math.PI)), goldMat);
          h.position.set(s * 0.72, 1.85, 0);
          h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
          add(h);
        }
        const knob = new THREE.Mesh(track(new THREE.SphereGeometry(0.2, 24, 16)), goldMat);
        knob.position.y = 0.8;
        knob.scale.y = 0.6;
        add(knob);
      } else if (kind === "bowl") {
        add(lathe([[0, 0], [0.85, 0], [0.85, 0.1], [0.4, 0.2], [0.14, 0.4], [0.12, 1.3], [0.35, 1.5], [0.8, 1.7], [1.3, 2.35], [1.28, 2.42], [1.15, 2.36], [0.7, 1.95], [0.25, 1.75], [0, 1.7]], silverMat));
        const band = new THREE.Mesh(track(new THREE.TorusGeometry(1.25, 0.04, 8, 72)), goldMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = 2.33;
        add(band);
        const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.28, 0.05, 8, 40)), goldMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.85;
        add(ring);
      } else if (kind === "ipl") {
        add(lathe([[0, 0], [0.75, 0], [0.75, 0.2], [0.5, 0.3], [0.25, 0.6], [0.2, 1.2], [0.5, 1.6], [0.62, 2.3], [0.55, 2.35], [0.45, 2.2], [0.2, 1.7], [0, 1.65]], goldMat));
        for (const s of [-1, 1]) {
          const blade = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 1.6, 0.07)), silverMat);
          blade.position.set(s * 0.62, 1.95, 0);
          blade.rotation.z = s * -0.26;
          add(blade);
        }
        const b = new THREE.Mesh(track(new THREE.SphereGeometry(0.28, 32, 24)), silverMat);
        b.position.y = 2.75;
        add(b);
        const band = new THREE.Mesh(track(new THREE.TorusGeometry(0.28, 0.01, 6, 40)), accentMat);
        band.position.y = 2.75;
        add(band);
      } else {
        add(lathe([[0, 0], [0.55, 0], [0.55, 0.12], [0.2, 0.3], [0.1, 0.4], [0, 0.4]], goldMat));
        const shaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.12, 2.1, 20)), goldMat);
        shaft.position.y = 1.4;
        add(shaft);
        for (let i = 0; i < 4; i++) {
          const r = new THREE.Mesh(track(new THREE.TorusGeometry(0.14, 0.04, 8, 24)), silverMat);
          r.rotation.x = Math.PI / 2;
          r.position.y = 0.7 + i * 0.5;
          add(r);
        }
        const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.5, 40, 28)), goldMat);
        head.position.y = 2.75;
        add(head);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const sp = new THREE.Mesh(track(new THREE.ConeGeometry(0.09, 0.4, 8)), silverMat);
          sp.position.set(Math.cos(a) * 0.4, 3.1, Math.sin(a) * 0.4);
          sp.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
          add(sp);
        }
        const top = new THREE.Mesh(track(new THREE.SphereGeometry(0.14, 20, 14)), silverMat);
        top.position.y = 3.3;
        add(top);
      }
      return g;
    };
    const applyLock = () => {
      if (!current) return;
      current.traverse((n) => {
        const m = n as THREE.Mesh;
        if (!m.isMesh) return;
        if (!m.userData.orig) m.userData.orig = m.material;
        m.material = unlocked ? m.userData.orig : lockMat;
      });
    };
    const setTrophy = (kind: TrophyKind, u: boolean) => {
      const changed = kind !== curKind || !current;
      unlocked = u;
      if (changed) {
        if (current) holder.remove(current);
        current = build(kind);
        curKind = kind;
        holder.add(current);
        scaleT = 0.55;
        spin = 0.6;
      }
      applyLock();
    };
    setTrophy("globe", true);
    const parts = makeParticles(260, 10, 7, 10, 0, 0.07, 0.35);

    return {
      setTrophy,
      reveal() { flash = 1; spin = 1; scaleT = 0.6; st.burst = 1; },
      update(dt, t) {
        st.sx += (st.px - st.sx) * Math.min(1, dt * 3);
        st.sy += (st.py - st.sy) * Math.min(1, dt * 3);
        scaleT += (1 - scaleT) * Math.min(1, dt * 4);
        flash = Math.max(0, flash - dt * 1.2);
        st.burst = Math.max(0, st.burst - dt * 0.5);
        spin = Math.max(0, spin - dt / 1.6);
        if (st.auto && t - st.lastDrag > 2) st.rotY += dt * 0.5 * st.speed;
        st.rotY += st.velY;
        st.velY *= 0.93;
        st.rotX += st.velX;
        st.velX *= 0.9;
        st.rotX = Math.max(-0.5, Math.min(0.6, st.rotX));
        const spinAmt = (1 - Math.pow(1 - spin, 3)) * Math.PI * 2 * (spin > 0 ? 1 : 0);
        holder.rotation.y = st.rotY + spinAmt;
        holder.rotation.x = st.rotX;
        const s = (0.95 + Math.sin(t * 1.4 * st.speed) * 0.006) * (0.4 + scaleT * 0.6) + flash * 0.05;
        holder.scale.setScalar(s);
        holder.position.y = 0.75 + (unlocked ? Math.sin(t * 1.1 * st.speed) * 0.04 : 0);
        accentMat.color.copy(col.accent);
        lockMat.emissive.copy(col.accent);
        key.intensity = 380 + flash * 1400;
        key.color.copy(col.light);
        rim.color.copy(col.accent);
        beamMat.color.copy(col.light);
        beamMat.opacity = 0.05 + flash * 0.25;
        fill.color.copy(col.accent2);
        camera.position.set(st.sx * 0.8, 2.9 - st.sy * 0.4, 9.2 + st.zoom);
        camera.lookAt(0, 2.3, 0);
        parts.update(dt);
      },
    };
  };

  const built: Built = o.kind === "hero" ? buildHero() : o.kind === "ball" ? buildBall() : o.kind === "emblem" ? buildEmblem() : buildTrophy();

  /* ───────────────── loop ───────────────── */
  let w = 0;
  let h = 0;
  const resize = () => {
    const cw = o.canvas.clientWidth || 300;
    const ch = o.canvas.clientHeight || 300;
    if (cw === w && ch === h) return;
    w = cw;
    h = ch;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    built.onResize?.(cw / ch);
  };
  resize();

  let raf = 0;
  let last = performance.now();
  let paused = false;
  let disposed = false;
  let frames = 0;
  let acc = 0;
  let start = performance.now();
  const minFrame = () => (quality === 0 ? 1 / 30 : 0);
  let sinceRender = 0;

  const applyQuality = (q: 0 | 1 | 2) => {
    quality = q;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALITY_DPR[q]));
    renderer.setSize(w, h, false);
    scene.traverse((n) => {
      const p = n as THREE.Points;
      if (p.isPoints && p.geometry.attributes.position && p.geometry.attributes.color === undefined) {
        const total = p.geometry.attributes.position.count;
        p.geometry.setDrawRange(0, Math.floor(total * QUALITY_PART[q]));
      }
    });
  };

  const tick = (now: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (paused) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.1);
    sinceRender += dt;
    if (sinceRender < minFrame()) return;
    const step = sinceRender;
    sinceRender = 0;
    const k = 1 - Math.exp(-step * 3.5);
    col.accent.lerp(tgt.accent, k);
    col.accent2.lerp(tgt.accent2, k);
    col.light.lerp(tgt.light, k);
    col.bg.lerp(tgt.bg, k);
    if (scene.fog) (scene.fog as THREE.FogExp2).color.copy(col.bg);
    built.update(step, (now - start) / 1000);
    renderer.render(scene, camera);
    // adaptive quality
    frames++;
    acc += step;
    if (acc >= 1.5) {
      const fps = frames / acc;
      perfStats.fps = Math.round(fps);
      perfStats.quality = quality;
      perfStats.kind = o.kind;
      perfStats.draws = renderer.info.render.calls;
      if (o.adaptive && fps < 32 && quality > 0 && (now - start) > 3500) {
        applyQuality((quality - 1) as 0 | 1);
        o.onQuality?.(quality);
      }
      frames = 0;
      acc = 0;
    }
  };
  raf = requestAnimationFrame(tick);

  const lost = (e: Event) => {
    e.preventDefault();
    o.onLost?.();
  };
  o.canvas.addEventListener("webglcontextlost", lost);

  return {
    setTheme: (id) => setTarget(id),
    setQuality: (q) => applyQuality(q),
    setReduced: (b) => { st.speed = b ? 0.15 : 1; },
    setParticles: (b) => { st.particles = b; },
    setPointer: (x, y) => { st.px = x; st.py = y; },
    setScroll: (p) => { st.scroll = Math.max(0, Math.min(1, p)); },
    setPaused: (b) => { paused = b; last = performance.now(); },
    setAuto: (b) => { st.auto = b; },
    drag: (dx, dy) => { st.velY += dx * 0.0016; st.velX += dy * 0.0012; st.lastDrag = (performance.now() - start) / 1000; },
    zoom: (d) => { st.zoom = Math.max(-3, Math.min(3, st.zoom + d)); },
    resize,
    setTrophy: (k, u) => built.setTrophy?.(k, u),
    reveal: () => built.reveal?.(),
    burst: () => { st.burst = 1; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      o.canvas.removeEventListener("webglcontextlost", lost);
      scene.traverse((n) => {
        const m = n as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
      });
      disposables.forEach((d) => { try { d.dispose(); } catch { /* ignore */ } });
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
