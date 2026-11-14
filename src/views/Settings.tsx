import { useCallback, useEffect, useRef, useState } from "react";
import { Database, Download, HardDrive, RefreshCw, Smartphone, Trash2, Upload } from "lucide-react";
import { SoundControls } from "../components/Shell";
import { requestGyro } from "../components/Scene3D";
import { Modal, Reveal, Switch, Tag, ViewHeader } from "../components/ui";
import { device } from "../lib/perf";
import type { PerfMode } from "../lib/perf";
import { APP_VERSION, clearAllData, clearOfflineCaches, deleteRecord, exportBackup, formatBytes, getUsage, importBackup, listRecords, requestPersistence, type UsageReport, type VaultRow } from "../lib/storage";
import { THEMES, THEME_ORDER } from "../lib/themes";
import { useApp } from "../state";

function Panel({ title, no, children, id }: { title: string; no: string; children: React.ReactNode; id?: string }) {
  return (
    <Reveal><section id={id} className="glass p-6 lg:p-8 mb-5"><div className="relative z-[1]">
      <div className="flex items-center gap-3 mb-6"><span className="mono text-[10px] text-accent">{no}</span><h2 className="h-display text-2xl lg:text-3xl">{title}</h2></div>{children}
    </div></section></Reveal>
  );
}
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0"><div className="min-w-0"><div className="text-sm font-medium">{label}</div>{hint && <div className="text-xs text-muted">{hint}</div>}</div><div className="shrink-0">{children}</div></div>;
}
function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return <div className="flex gap-1.5 flex-wrap justify-end" role="radiogroup" aria-label={label}>{options.map(([v, l]) => <button key={v} role="radio" aria-checked={value === v} className={`tab !min-h-[36px] !px-3 ${value === v ? "active" : ""}`} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

export default function Settings() {
  const { settings, setSettings, theme, setTheme, quality, canInstall, installed, install, online, swState, toast, award, setSearchOpen, setHelpOpen, updateReady, applyUpdate } = useApp();
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [rows, setRows] = useState<VaultRow[]>([]);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => { setUsage(await getUsage()); setRows(await listRecords()); }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const doExport = async () => {
    setBusy(true);
    try { const n = await exportBackup(); toast(`Backup exported (${formatBytes(n)}). Keep it somewhere safe.`, "ok"); award("backup"); }
    catch { toast("Export failed — storage may be unavailable.", "err"); }
    setBusy(false);
  };
  const doImport = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 120 * 1024 * 1024) { toast("File is too large to import safely.", "err"); return; }
    setBusy(true);
    try {
      const res = await importBackup(await f.text(), mode);
      toast(`Restored ${res.lsKeys} settings and ${res.records} records. Reloading…`, "ok");
      setTimeout(() => window.location.reload(), 1300);
    } catch (e) { toast((e as Error).message || "Import failed", "err"); }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  };
  const wipe = async () => {
    await clearAllData();
    setConfirm(false); setTyped("");
    toast("All local data deleted. Reloading…", "warn");
    setTimeout(() => window.location.reload(), 1000);
  };
  const checkUpdate = async () => {
    try { const reg = await navigator.serviceWorker?.getRegistration(); if (!reg) { toast("No service worker is active in this context.", "warn"); return; } await reg.update(); toast(reg.waiting ? "An update is ready — use the Update button." : "You're on the latest version.", "info"); }
    catch { toast("Could not check for updates (offline?).", "warn"); }
  };
  const pct = usage && usage.quota && usage.usage ? Math.min(100, (usage.usage / usage.quota) * 100) : 0;

  return (
    <div className="view-pad max-w-5xl">
      <ViewHeader no="14" title="Settings & DataVault" sub="Preferences · sound · data" />

      <Panel no="A" title="Appearance & performance">
        <Row label="Theme" hint="Saved in LocalStorage"><div className="flex gap-2">{THEME_ORDER.map((t) => <button key={t} aria-label={THEMES[t].name} aria-pressed={theme === t} onClick={() => setTheme(t)} className={`w-9 h-9 rounded-full border-2 ${theme === t ? "border-ink" : "border-transparent"}`} style={{ background: `linear-gradient(135deg, ${THEMES[t].accent} 50%, ${THEMES[t].accent2} 50%)` }} />)}</div></Row>
        <Row label="Performance mode" hint={`Auto picked quality ${["Low", "Balanced", "High"][quality]} for this device`}><Seg label="Performance mode" value={settings.perf} onChange={(v: PerfMode) => setSettings({ perf: v })} options={[["auto", "Auto"], ["high", "High"], ["balanced", "Balanced"], ["low", "Low"]]} /></Row>
        <Row label="Motion" hint="Auto follows your system's reduced-motion setting"><Seg label="Motion" value={settings.motion} onChange={(v) => setSettings({ motion: v })} options={[["auto", "Auto"], ["reduce", "Reduced"], ["full", "Full"]]} /></Row>
        <Row label="Custom cursor" hint="Desktop with mouse only"><Switch checked={settings.cursor} onChange={(b) => setSettings({ cursor: b })} label="Custom cursor" /></Row>
        <Row label="Floating particles" hint="Disable to save battery"><Switch checked={settings.particles} onChange={(b) => setSettings({ particles: b })} label="Particles" /></Row>
        <Row label="Smooth scrolling"><Switch checked={settings.smooth} onChange={(b) => setSettings({ smooth: b })} label="Smooth scrolling" /></Row>
        <Row label="Motion parallax (gyroscope)" hint="Tilt your phone on supported devices">
          <div className="flex items-center gap-3">{device.touch && <button className="btn btn-ghost btn-sm" onClick={async () => toast((await requestGyro()) ? "Motion access granted" : "Motion access unavailable or denied", "info")}><Smartphone size={14} /> Allow</button>}<Switch checked={settings.gyro} onChange={(b) => setSettings({ gyro: b })} label="Gyroscope" /></div></Row>
        <Row label="Show FPS / 3D stats"><Switch checked={settings.showFps} onChange={(b) => setSettings({ showFps: b })} label="Show FPS" /></Row>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[["CPU cores", String(device.cores)], ["Memory", `≥${device.memory} GB`], ["WebGL", device.webgl ? "Yes" : "No (CSS 3D)"], ["Input", device.touch ? "Touch" : "Mouse"]].map(([k, v]) => <div key={k} className="rounded-2xl border border-line p-3"><div className="mono text-[9px] text-muted">{k}</div><div className="text-sm font-semibold mt-1">{v}</div></div>)}
        </div>
        <p className="text-xs text-muted mt-3">In Auto mode the 3D engine also lowers quality by itself if the frame rate drops.</p>
      </Panel>

      <Panel no="B" title="Sound design"><SoundControls /><p className="text-xs text-muted mt-5">Sound is opt-in and never autoplays. All effects, ambience and music are synthesised live — there are no audio files and no copyrighted music.</p></Panel>

      <Panel no="C" title="Install, offline & updates" id="pwa">
        <Row label="Install as app" hint={installed ? "Already running as an installed app" : canInstall ? "Add MSD to your home screen / desktop" : "Use your browser's menu → “Install app” / “Add to Home Screen”"}>
          <button className="btn btn-sm" disabled={!canInstall} onClick={install}><Download size={14} /> {installed ? "Installed" : "Install"}</button></Row>
        <Row label="Connection"><span className={`chip ${online ? "chip-ok" : "chip-approx"}`}>{online ? "Online" : "Offline"}</span></Row>
        <Row label="Service worker" hint="Powers the offline app shell"><span className="chip">{swState}</span></Row>
        <Row label="Version" hint={updateReady ? "A newer version is ready" : "Updates are announced with a notification"}>
          <div className="flex items-center gap-2"><span className="chip">v{APP_VERSION}</span>{updateReady ? <button className="btn btn-sm" onClick={applyUpdate}><RefreshCw size={13} /> Update</button> : <button className="btn btn-ghost btn-sm" onClick={checkUpdate}><RefreshCw size={13} /> Check</button>}</div></Row>
        <Row label="Offline cache" hint="Removes cached app files (your data is kept)"><button className="btn btn-ghost btn-sm" onClick={async () => { const n = await clearOfflineCaches(); toast(n ? "Offline cache cleared — reload while online to rebuild it." : "No offline cache found.", "info"); }}>Clear cache</button></Row>
        <div className="grid md:grid-cols-2 gap-4 mt-5 text-sm">
          <div className="rounded-2xl border border-line p-4"><div className="mono text-[10px] text-accent mb-2">Works offline after first load</div><ul className="text-muted space-y-1 text-[13px] list-disc pl-4"><li>All 14 sections, themes, timeline, stats, quiz & games</li><li>3D scenes (generated in-browser)</li><li>Settings, DataVault, uploads & scores</li><li>Custom sound engine</li></ul></div>
          <div className="rounded-2xl border border-line p-4"><div className="mono text-[10px] text-amber-300 mb-2">Externally hosted · needs internet</div><ul className="text-muted space-y-1 text-[13px] list-disc pl-4"><li>MS Dhoni photos (Wikimedia Commons) — cached only after you view them once</li><li>Web fonts (Google Fonts) — fall back to system fonts offline</li><li>GitHub & Instagram links</li></ul></div>
        </div>
      </Panel>

      <Panel no="D" title="DataVault" id="datavault">
        <div className="rounded-2xl border border-line p-4 mb-5 text-[13px] text-muted leading-relaxed"><b className="text-ink">Honest note:</b> everything is stored locally in this browser (LocalStorage + IndexedDB). It is not permanent — clearing site data, private mode, uninstalling the browser or storage pressure can erase it, and it is not synced anywhere. <b className="text-ink">Export a backup</b> to keep your data safe.</div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2"><div className="eyebrow flex items-center gap-2"><HardDrive size={14} /> Storage usage</div><button className="btn btn-ghost btn-sm" onClick={() => void refresh()}><RefreshCw size={13} /> Refresh</button></div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.max(pct, 1)}%` }} /></div>
          <div className="flex justify-between text-xs text-muted mt-2"><span>Site total: {formatBytes(usage?.usage)} (includes offline cache)</span><span>Quota ≈ {formatBytes(usage?.quota)}</span></div>
          {usage && (<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
            {[["Settings", formatBytes(usage.lsBytes)], ["Uploaded media", `${formatBytes(usage.mediaBytes)} · ${usage.counts.media}`], ["Records", `${formatBytes(usage.recordBytes)}`], ["Persistent", usage.persisted === null ? "n/a" : usage.persisted ? "Granted" : "Not granted"]].map(([k, v]) => <div key={k} className="rounded-2xl border border-line p-3"><div className="mono text-[9px] text-muted">{k}</div><div className="text-sm font-semibold mt-1">{v}</div></div>)}</div>)}
          <button className="btn btn-ghost btn-sm mt-4" onClick={async () => { const ok = await requestPersistence(); toast(ok ? "Persistent storage granted — your browser will try not to evict this data." : "Persistent storage not granted. Keep exporting backups.", ok ? "ok" : "warn"); void refresh(); }}>Request persistent storage</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-line p-5"><div className="eyebrow mb-3 flex items-center gap-2"><Download size={14} /> Export backup</div><p className="text-xs text-muted mb-4">Downloads a JSON file with your settings, favourites, collections, scores, trophy progress and uploaded images.</p><button className="btn" disabled={busy} onClick={doExport}>Export JSON</button></div>
          <div className="rounded-2xl border border-line p-5"><div className="eyebrow mb-3 flex items-center gap-2"><Upload size={14} /> Import / restore</div>
            <Seg label="Import mode" value={mode} onChange={setMode} options={[["merge", "Merge"], ["replace", "Replace all"]]} />
            <p className="text-xs text-muted my-3">{mode === "merge" ? "Adds the backup's data to what you already have." : "Deletes current data first, then restores the backup."}</p>
            <input ref={fileRef} id="imp" type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void doImport(e.target.files?.[0])} />
            <label htmlFor="imp" className={`btn btn-ghost cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>Choose backup file</label></div>
        </div>

        <div className="eyebrow mb-3 flex items-center gap-2"><Database size={14} /> Saved records ({rows.length})</div>
        <div className="rounded-2xl border border-line max-h-[320px] overflow-y-auto divide-y divide-line">
          {rows.length === 0 && <div className="p-5 text-sm text-muted text-center">Nothing stored yet.</div>}
          {rows.map((r) => (
            <div key={r.source + r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"><span className="flex-1 min-w-0 truncate">{r.label}</span><span className="mono text-[9px] text-muted">{formatBytes(r.size)}</span>
              <button className="icon-btn !w-9 !h-9 !rounded-xl" aria-label={`Delete ${r.label}`} onClick={async () => { await deleteRecord(r); toast("Record deleted" + (r.source === "ls" ? " (applies after reload)" : ""), "info"); void refresh(); }}><Trash2 size={14} /></button></div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap rounded-2xl border border-red-400/30 bg-red-500/5 p-5"><div><div className="font-semibold text-red-300">Clear all local data</div><div className="text-xs text-muted">Deletes settings, favourites, uploads, scores and progress from this browser. Cannot be undone.</div></div><button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}><Trash2 size={14} /> Clear all…</button></div>
      </Panel>

      <Panel no="E" title="Help & about">
        <div className="flex gap-3 flex-wrap mb-5"><button className="btn btn-ghost btn-sm" onClick={() => setSearchOpen(true)}>Open search</button><button className="btn btn-ghost btn-sm" onClick={() => setHelpOpen(true)}>Keyboard shortcuts</button></div>
        <p className="text-sm text-muted leading-relaxed">MSD — THE LEGEND v{APP_VERSION} · Designed & developed by <b className="text-ink">Sohom Giri</b>. Unofficial fan-made tribute; not endorsed by MS Dhoni, BCCI, ICC, CSK or the IPL. Statistics follow widely published records; items tagged <Tag v="approx" /> are approximate and <Tag v="fan" /> items are opinion.</p>
      </Panel>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirm delete">
        <h3 className="h-display text-3xl text-red-300">Delete everything?</h3>
        <p className="text-sm text-muted mt-3">This permanently erases all MSD data stored in this browser. Consider exporting a backup first. Type <b className="text-ink">DELETE</b> to confirm.</p>
        <input className="input mt-5" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" />
        <div className="flex gap-3 mt-5"><button className="btn btn-ghost flex-1" onClick={() => setConfirm(false)}>Cancel</button><button className="btn btn-danger flex-1" disabled={typed !== "DELETE"} onClick={wipe}>Delete all</button></div>
      </Modal>
    </div>
  );
}
