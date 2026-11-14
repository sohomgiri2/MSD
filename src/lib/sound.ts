/**
 * Procedural sound engine (WebAudio). Nothing is autoplayed: the AudioContext is only created
 * after the user opted in AND performed a gesture. All sounds/music are synthesised in-browser —
 * no audio files and no copyrighted music are used.
 */
export type SoundName = "click" | "nav" | "theme" | "unlock" | "success" | "error" | "hit" | "tick" | "open" | "whoosh";

export interface SoundPrefs {
  enabled: boolean;
  volume: number; // 0..1
  muted: boolean;
  ui: boolean;
  ambience: boolean;
  music: boolean;
  track: number;
  permission: "unset" | "granted" | "later" | "never";
}

export const defaultSoundPrefs: SoundPrefs = {
  enabled: false, volume: 0.6, muted: false, ui: true, ambience: false, music: false, track: 0, permission: "unset",
};

export const TRACKS = [
  { name: "Golden Hour", mood: "Warm · slow · cinematic", bpm: 66, root: 57, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 4] },
  { name: "Blue Horizon", mood: "Wide · calm · nocturnal", bpm: 58, root: 55, scale: [0, 2, 3, 7, 8], prog: [0, 3, 5, 2] },
  { name: "Neon Strike", mood: "Pulse · fast · electric", bpm: 104, root: 52, scale: [0, 3, 5, 7, 10], prog: [0, 0, 5, 3] },
];

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class SoundEngine {
  prefs: SoundPrefs = { ...defaultSoundPrefs };
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private musBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private ambNodes: AudioNode[] = [];
  private ambTimer: number | null = null;
  private musTimer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  /** Create/resume the context. Must be called from a user gesture. */
  private ensure(): boolean {
    if (!this.prefs.enabled) return false;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      try {
        this.ctx = new AC();
      } catch {
        return false;
      }
      this.master = this.ctx.createGain();
      this.uiBus = this.ctx.createGain();
      this.ambBus = this.ctx.createGain();
      this.musBus = this.ctx.createGain();
      this.ambBus.gain.value = 0;
      this.musBus.gain.value = 0;
      const comp = this.ctx.createDynamicsCompressor();
      this.uiBus.connect(this.master);
      this.ambBus.connect(this.master);
      this.musBus.connect(this.master);
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.applyVolume();
    return true;
  }

  private applyVolume() {
    if (!this.ctx || !this.master) return;
    const v = this.prefs.muted || !this.prefs.enabled ? 0 : this.prefs.volume;
    this.master.gain.setTargetAtTime(v * v, this.ctx.currentTime, 0.05);
  }

  /** Apply new preferences (call after any change). */
  configure(p: SoundPrefs) {
    this.prefs = p;
    if (!p.enabled) {
      this.stopAmbience(true);
      this.stopMusic(true);
      this.applyVolume();
      if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
      this.emit();
      return;
    }
    if (this.ctx) {
      this.applyVolume();
      if (this.ctx.state === "suspended" && !p.muted) void this.ctx.resume();
      p.ambience ? this.startAmbience() : this.stopAmbience();
      p.music ? this.startMusic() : this.stopMusic();
    }
    this.emit();
  }

  /** Called on first user gesture after enabling, to start requested layers */
  activate() {
    if (!this.ensure()) return;
    if (this.prefs.ambience) this.startAmbience();
    if (this.prefs.music) this.startMusic();
  }

  get musicPlaying() {
    return this.musTimer !== null;
  }
  get ambiencePlaying() {
    return this.ambTimer !== null;
  }

  /* ───── primitives ───── */
  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, bus: GainNode, slide?: number, attack = 0.005) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  private noise(t: number, dur: number, vol: number, bus: GainNode, freq = 2000, q = 1, type: BiquadFilterType = "bandpass") {
    if (!this.ctx || !this.noiseBuf) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  play(name: SoundName) {
    if (!this.prefs.enabled || this.prefs.muted || !this.prefs.ui) return;
    if (!this.ensure() || !this.ctx || !this.uiBus) return;
    const t = this.ctx.currentTime;
    const b = this.uiBus;
    switch (name) {
      case "click":
        this.tone(1500, t, 0.06, "square", 0.05, b, 900);
        this.noise(t, 0.03, 0.05, b, 5000, 2);
        break;
      case "tick":
        this.tone(2200, t, 0.03, "sine", 0.05, b);
        break;
      case "nav":
        this.tone(520, t, 0.12, "triangle", 0.09, b, 780);
        this.tone(780, t + 0.07, 0.16, "sine", 0.07, b, 1040);
        break;
      case "open":
        this.tone(380, t, 0.18, "sine", 0.08, b, 760);
        break;
      case "whoosh":
        this.noise(t, 0.4, 0.12, b, 900, 0.7);
        break;
      case "theme":
        [0, 4, 7, 12, 16].forEach((n, i) => this.tone(mtof(72 + n), t + i * 0.055, 0.5, "sine", 0.07, b));
        this.noise(t, 0.5, 0.06, b, 6000, 3, "highpass");
        break;
      case "unlock":
        this.noise(t, 0.9, 0.12, b, 4000, 0.6, "highpass");
        [0, 7, 12, 16, 19, 24].forEach((n, i) => {
          this.tone(mtof(60 + n), t + 0.05 + i * 0.09, 1.1, "triangle", 0.09, b);
          this.tone(mtof(72 + n) * 2, t + 0.05 + i * 0.09, 0.8, "sine", 0.03, b);
        });
        this.tone(mtof(36), t, 1.4, "sine", 0.18, b, 30);
        break;
      case "success":
        [0, 4, 7, 12].forEach((n, i) => this.tone(mtof(67 + n), t + i * 0.08, 0.35, "triangle", 0.09, b));
        break;
      case "error":
        this.tone(220, t, 0.25, "sawtooth", 0.07, b, 110);
        break;
      case "hit":
        this.tone(160, t, 0.14, "sine", 0.3, b, 55);
        this.noise(t, 0.08, 0.25, b, 1800, 1.2);
        break;
    }
  }

  /* ───── ambience: synthetic stadium murmur ───── */
  startAmbience() {
    if (!this.ensure() || !this.ctx || !this.ambBus || !this.noiseBuf || this.ambTimer !== null) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 520;
    bp.Q.value = 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.18;
    lfo.connect(lfoG).connect(g.gain);
    src.connect(bp).connect(lp).connect(g).connect(this.ambBus);
    src.start();
    lfo.start();
    this.ambNodes = [src, lfo];
    this.ambBus.gain.cancelScheduledValues(ctx.currentTime);
    this.ambBus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
    const swell = () => {
      if (!this.ctx || !this.ambBus) return;
      const t = this.ctx.currentTime;
      const peak = 0.6 + Math.random() * 0.5;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(peak, t, 0.7);
      g.gain.setTargetAtTime(0.5, t + 2.2, 1.4);
      bp.frequency.setTargetAtTime(520 + Math.random() * 420, t, 0.6);
    };
    this.ambTimer = window.setInterval(swell, 7000);
    this.emit();
  }
  stopAmbience(immediate = false) {
    if (this.ambTimer !== null) {
      clearInterval(this.ambTimer);
      this.ambTimer = null;
    }
    if (this.ctx && this.ambBus) {
      const nodes = this.ambNodes;
      this.ambNodes = [];
      this.ambBus.gain.setTargetAtTime(0, this.ctx.currentTime, immediate ? 0.02 : 0.4);
      setTimeout(() => nodes.forEach((n) => { try { (n as AudioScheduledSourceNode).stop(); } catch { /* ignore */ } }), immediate ? 100 : 2000);
    }
    this.emit();
  }

  /* ───── generative music (original, algorithmic) ───── */
  startMusic() {
    if (!this.ensure() || !this.ctx || !this.musBus || this.musTimer !== null) return;
    this.musBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musBus.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.6);
    this.nextNote = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.musTimer = window.setInterval(() => this.schedule(), 120);
    this.emit();
  }
  stopMusic(immediate = false) {
    if (this.musTimer !== null) {
      clearInterval(this.musTimer);
      this.musTimer = null;
    }
    if (this.ctx && this.musBus) this.musBus.gain.setTargetAtTime(0, this.ctx.currentTime, immediate ? 0.02 : 0.3);
    this.emit();
  }
  setTrack(i: number) {
    this.prefs = { ...this.prefs, track: i };
    this.step = 0;
    this.emit();
  }
  private schedule() {
    if (!this.ctx || !this.musBus) return;
    const tr = TRACKS[this.prefs.track % TRACKS.length];
    const beat = 60 / tr.bpm;
    const eighth = beat / 2;
    while (this.nextNote < this.ctx.currentTime + 0.4) {
      const t = this.nextNote;
      const bar = Math.floor(this.step / 8);
      const chordDeg = tr.prog[bar % tr.prog.length];
      const rootNote = tr.root + tr.scale[chordDeg % tr.scale.length];
      if (this.step % 8 === 0) {
        // pad chord (root, fifth, octave) + sub bass
        [0, 7, 12, 16].forEach((n) => this.padNote(mtof(rootNote + n), t, beat * 4 * 0.95, 0.05));
        this.tone(mtof(rootNote - 12), t, beat * 3.5, "sine", 0.14, this.musBus, undefined, 0.05);
      }
      // arpeggio pluck from scale (seeded-ish pseudo-random walk)
      const pat = [0, 2, 4, 2, 3, 1, 4, 2];
      if (tr.bpm > 90 || this.step % 2 === 0 || Math.random() > 0.55) {
        const idx = (pat[this.step % 8] + chordDeg) % tr.scale.length;
        const oct = 12 * (1 + (this.step % 8 > 4 ? 1 : 0));
        this.tone(mtof(tr.root + tr.scale[idx] + 12 + oct), t, eighth * 2.6, "triangle", 0.045, this.musBus);
      }
      if (tr.bpm > 90 && this.step % 4 === 0) this.tone(120, t, 0.18, "sine", 0.16, this.musBus, 45); // soft kick
      this.nextNote += eighth;
      this.step++;
    }
  }
  private padNote(freq: number, t: number, dur: number, vol: number) {
    if (!this.ctx || !this.musBus) return;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o2.type = "sawtooth";
    o.frequency.value = freq;
    o2.frequency.value = freq * 1.004;
    f.type = "lowpass";
    f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    o2.connect(f);
    f.connect(g).connect(this.musBus);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
  }
}

export const sound = new SoundEngine();
