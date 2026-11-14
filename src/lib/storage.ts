/**
 * MSD local-first storage layer.
 *  - LocalStorage  → small settings / preferences (prefix "msd:")
 *  - IndexedDB     → larger user data (uploaded media, favourites, collections, leaderboard)
 * NOTE: browser storage is NOT permanent. Users can clear it, browsers may evict it under storage
 * pressure, and it never leaves the device. Export a JSON backup regularly.
 */
export const APP_VERSION = "1.0.0";
export const PREFIX = "msd:";
const DB_NAME = "msd-legend";
const DB_VERSION = 1;
export const STORES = ["media", "scores", "favs", "collections", "kv"] as const;
export type StoreName = (typeof STORES)[number];

export const storageBus = new EventTarget();
function emitError(message: string) {
  storageBus.dispatchEvent(new CustomEvent("error", { detail: message }));
}
function describe(e: unknown): string {
  const err = e as { name?: string; message?: string };
  if (err?.name === "QuotaExceededError" || /quota/i.test(err?.message || "")) {
    return "Storage is full. Export a backup, then delete some saved items in Settings → DataVault.";
  }
  return err?.message || "Storage error";
}

/* ───────────── LocalStorage ───────────── */
export const ls = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      emitError(describe(e));
      return false;
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
  keys(): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
    } catch {
      /* ignore */
    }
    return out;
  },
  bytes(): number {
    let n = 0;
    for (const k of ls.keys()) {
      const v = localStorage.getItem(PREFIX + k) || "";
      n += (PREFIX.length + k.length + v.length) * 2;
    }
    return n;
  },
};

/* ───────────── IndexedDB ───────────── */
let dbPromise: Promise<IDBDatabase> | null = null;
export const idbSupported = typeof indexedDB !== "undefined";

function openDB(): Promise<IDBDatabase> {
  if (!idbSupported) return Promise.reject(new Error("IndexedDB is not available in this browser."));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("media")) db.createObjectStore("media", { keyPath: "id" });
      if (!db.objectStoreNames.contains("scores")) db.createObjectStore("scores", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("favs")) db.createObjectStore("favs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("collections")) db.createObjectStore("collections", { keyPath: "id" });
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv", { keyPath: "key" });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error("Could not open IndexedDB"));
    };
    req.onblocked = () => reject(new Error("IndexedDB blocked by another tab"));
  });
  return dbPromise;
}

function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let tx: IDBTransaction;
        try {
          tx = db.transaction(store, mode);
        } catch (e) {
          reject(e);
          return;
        }
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error || req.error);
        tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
      })
  );
}

export const idb = {
  async put<T extends object>(store: StoreName, value: T): Promise<IDBValidKey | null> {
    try {
      return await run(store, "readwrite", (s) => s.put(value));
    } catch (e) {
      emitError(describe(e));
      return null;
    }
  },
  async get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
    try {
      return (await run(store, "readonly", (s) => s.get(key))) as T | undefined;
    } catch {
      return undefined;
    }
  },
  async all<T>(store: StoreName): Promise<T[]> {
    try {
      return (await run(store, "readonly", (s) => s.getAll())) as T[];
    } catch {
      return [];
    }
  },
  async delete(store: StoreName, key: IDBValidKey): Promise<boolean> {
    try {
      await run(store, "readwrite", (s) => s.delete(key));
      return true;
    } catch (e) {
      emitError(describe(e));
      return false;
    }
  },
  async clear(store: StoreName): Promise<void> {
    try {
      await run(store, "readwrite", (s) => s.clear());
    } catch (e) {
      emitError(describe(e));
    }
  },
  async count(store: StoreName): Promise<number> {
    try {
      return await run(store, "readonly", (s) => s.count());
    } catch {
      return 0;
    }
  },
};

/* ───────────── Domain records ───────────── */
export interface MediaRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: number;
}
export interface ScoreRecord {
  id?: number;
  game: string;
  name: string;
  score: number;
  detail?: string;
  ts: number;
}
export interface FavRecord {
  id: string;
  kind: "photo" | "wallpaper" | "upload";
  ts: number;
}
export interface CollectionRecord {
  id: string;
  name: string;
  items: string[];
  createdAt: number;
}

/* ───────────── Usage ───────────── */
export interface UsageReport {
  quota: number | null;
  usage: number | null;
  persisted: boolean | null;
  lsBytes: number;
  mediaBytes: number;
  recordBytes: number;
  counts: Record<string, number>;
}

export async function getUsage(): Promise<UsageReport> {
  let quota: number | null = null;
  let usage: number | null = null;
  let persisted: boolean | null = null;
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      quota = est.quota ?? null;
      usage = est.usage ?? null;
    }
    if (navigator.storage?.persisted) persisted = await navigator.storage.persisted();
  } catch {
    /* ignore */
  }
  const media = await idb.all<MediaRecord>("media");
  const mediaBytes = media.reduce((a, m) => a + (m.size || 0), 0);
  let recordBytes = 0;
  const counts: Record<string, number> = { media: media.length };
  for (const s of ["scores", "favs", "collections", "kv"] as StoreName[]) {
    const rows = await idb.all<object>(s);
    counts[s] = rows.length;
    recordBytes += JSON.stringify(rows).length * 2;
  }
  return { quota, usage, persisted, lsBytes: ls.bytes(), mediaBytes, recordBytes, counts };
}

export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export function formatBytes(n: number | null | undefined): string {
  if (n === null || n === undefined) return "n/a";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/* ───────────── Records list (DataVault) ───────────── */
export interface VaultRow {
  source: "ls" | StoreName;
  id: string;
  label: string;
  size: number;
  ts?: number;
}

export async function listRecords(): Promise<VaultRow[]> {
  const rows: VaultRow[] = [];
  for (const k of ls.keys()) {
    const raw = localStorage.getItem(PREFIX + k) || "";
    rows.push({ source: "ls", id: k, label: `Setting · ${k}`, size: raw.length * 2 });
  }
  for (const m of await idb.all<MediaRecord>("media")) rows.push({ source: "media", id: m.id, label: `Upload · ${m.name}`, size: m.size, ts: m.createdAt });
  for (const s of await idb.all<ScoreRecord>("scores")) rows.push({ source: "scores", id: String(s.id), label: `Score · ${s.game} · ${s.name} · ${s.score}`, size: 80, ts: s.ts });
  for (const f of await idb.all<FavRecord>("favs")) rows.push({ source: "favs", id: f.id, label: `Favourite · ${f.id}`, size: 60, ts: f.ts });
  for (const c of await idb.all<CollectionRecord>("collections")) rows.push({ source: "collections", id: c.id, label: `Collection · ${c.name} (${c.items.length})`, size: 100 + c.items.length * 20, ts: c.createdAt });
  return rows;
}

export async function deleteRecord(row: VaultRow): Promise<boolean> {
  if (row.source === "ls") {
    ls.remove(row.id);
    return true;
  }
  const key = row.source === "scores" ? Number(row.id) : row.id;
  return idb.delete(row.source, key);
}

export async function clearAllData(): Promise<void> {
  for (const k of ls.keys()) ls.remove(k);
  for (const s of STORES) await idb.clear(s);
}

export async function clearOfflineCaches(): Promise<number> {
  if (!("caches" in window)) return 0;
  const keys = (await caches.keys()).filter((k) => k.startsWith("msd-"));
  await Promise.all(keys.map((k) => caches.delete(k)));
  return keys.length;
}

/* ───────────── Backup / restore ───────────── */
function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

export interface BackupFile {
  app: "msd-legend";
  schema: 1;
  version: string;
  exportedAt: string;
  note: string;
  ls: Record<string, unknown>;
  idb: Record<string, unknown[]>;
}

export async function buildBackup(): Promise<BackupFile> {
  const lsData: Record<string, unknown> = {};
  for (const k of ls.keys()) lsData[k] = ls.get(k, null);
  const idbData: Record<string, unknown[]> = {};
  for (const s of STORES) {
    const rows = await idb.all<Record<string, unknown>>(s);
    if (s === "media") {
      const out: unknown[] = [];
      for (const r of rows as unknown as MediaRecord[]) out.push({ ...r, blob: await blobToDataURL(r.blob) });
      idbData[s] = out;
    } else idbData[s] = rows;
  }
  return {
    app: "msd-legend",
    schema: 1,
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    note: "Unofficial fan project backup. Browser storage is not permanent — keep this file somewhere safe.",
    ls: lsData,
    idb: idbData,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportBackup(): Promise<number> {
  const data = await buildBackup();
  const json = JSON.stringify(data, null, 2);
  downloadBlob(new Blob([json], { type: "application/json" }), `msd-legend-backup-${new Date().toISOString().slice(0, 10)}.json`);
  return json.length;
}

export interface ImportResult {
  lsKeys: number;
  records: number;
}

export function validateBackup(data: unknown): data is BackupFile {
  const d = data as Partial<BackupFile> | null;
  return !!d && typeof d === "object" && d.app === "msd-legend" && typeof d.schema === "number" && d.schema === 1 && typeof d.ls === "object" && typeof d.idb === "object" && d.ls !== null && d.idb !== null;
}

export async function importBackup(text: string, mode: "merge" | "replace"): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!validateBackup(parsed)) throw new Error("This is not a valid MSD — THE LEGEND backup file.");
  if (mode === "replace") await clearAllData();
  let lsKeys = 0;
  let records = 0;
  for (const [k, v] of Object.entries(parsed.ls)) {
    if (typeof k === "string" && k.length < 80 && ls.set(k, v)) lsKeys++;
  }
  for (const s of STORES) {
    const rows = (parsed.idb as Record<string, unknown[]>)[s];
    if (!Array.isArray(rows)) continue;
    for (const raw of rows) {
      const row = { ...(raw as Record<string, unknown>) };
      if (s === "media" && typeof row.blob === "string") {
        try {
          row.blob = await (await fetch(row.blob as string)).blob();
        } catch {
          continue;
        }
      }
      if (s === "scores") delete row.id; // let autoincrement assign (avoids collisions on merge)
      if (await idb.put(s, row)) records++;
    }
  }
  return { lsKeys, records };
}
