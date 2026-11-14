import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FolderPlus, Heart, ImageOff, Maximize2, Trash2, Upload, X } from "lucide-react";
import { PHOTOS } from "../lib/data";
import { WALL_CATS, WALL_VARIANTS, drawWallpaper, type WallCat } from "../lib/wallpapers";
import { downloadBlob, formatBytes, idb, type CollectionRecord, type MediaRecord } from "../lib/storage";
import { Reveal, TiltCard, ViewHeader, useFocus } from "../components/ui";
import { sound } from "../lib/sound";
import { useApp } from "../state";

interface Item { id: string; title: string; caption: string; src: string; credit?: string; link?: string; kind: "photo" | "wallpaper" | "upload"; wall?: { cat: WallCat; v: number } }

function Img({ src, alt, className = "", w, h }: { src: string; alt: string; className?: string; w?: number; h?: number }) {
  const [bad, setBad] = useState(false);
  if (bad) return <div className={`grid place-items-center text-center p-4 bg-white/5 text-muted ${className}`} style={{ aspectRatio: w && h ? `${w}/${h}` : "4/3" }}><div><ImageOff className="mx-auto mb-2" size={22} /><span className="text-[11px]">Photo unavailable offline until it has been viewed once online.</span></div></div>;
  return <img src={src} alt={alt} loading="lazy" decoding="async" width={w} height={h} onError={() => setBad(true)} className={className} />;
}

function WallCanvas({ cat, v, className = "" }: { cat: WallCat; v: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawWallpaper(ref.current, cat, v, 270, 480);
    document.fonts?.ready.then(() => ref.current && drawWallpaper(ref.current, cat, v, 270, 480));
  }, [cat, v]);
  return <canvas ref={ref} className={className} aria-label={`${cat.name} wallpaper — ${WALL_VARIANTS[v]}`} role="img" />;
}

const TABS = ["Photos", "Wallpapers", "Favourites", "My uploads", "Collections"] as const;

export default function MediaVault() {
  const { favs, toggleFav, toast, award } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Photos");
  const [wcat, setWcat] = useState<string>("all");
  const [lb, setLb] = useState<{ list: Item[]; i: number } | null>(null);
  const [uploads, setUploads] = useState<(MediaRecord & { url: string })[]>([]);
  const [cols, setCols] = useState<CollectionRecord[]>([]);
  const [newCol, setNewCol] = useState("");
  const urls = useRef<string[]>([]);
  const file = useRef<HTMLInputElement>(null);

  const photoItems: Item[] = useMemo(() => PHOTOS.map((p) => ({ id: p.id, title: p.title, caption: p.caption, src: p.src, kind: "photo" as const, credit: `${p.author} · ${p.license}`, link: p.page })), []);
  const wallItems: Item[] = useMemo(() => WALL_CATS.flatMap((c) => WALL_VARIANTS.map((n, v) => ({ id: `w-${c.id}-${v}`, title: `${c.name} · ${n}`, caption: "Original generated artwork (1080×1920).", src: "", kind: "wallpaper" as const, wall: { cat: c, v } }))), []);
  const loadUploads = useCallback(async () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    const rows = await idb.all<MediaRecord>("media");
    const mapped = rows.sort((a, b) => b.createdAt - a.createdAt).map((r) => { const url = URL.createObjectURL(r.blob); urls.current.push(url); return { ...r, url }; });
    setUploads(mapped);
  }, []);
  const loadCols = useCallback(async () => setCols((await idb.all<CollectionRecord>("collections")).sort((a, b) => a.createdAt - b.createdAt)), []);
  useEffect(() => { void loadUploads(); void loadCols(); return () => urls.current.forEach((u) => URL.revokeObjectURL(u)); }, [loadUploads, loadCols]);
  const uploadItems: Item[] = uploads.map((u) => ({ id: u.id, title: u.name, caption: `Your upload · ${formatBytes(u.size)} · stored on this device only`, src: u.url, kind: "upload" as const }));
  const all = useMemo(() => [...photoItems, ...wallItems, ...uploadItems], [photoItems, wallItems, uploadItems]);
  const byId = (id: string) => all.find((x) => x.id === id);

  useFocus("media", (id) => { const i = photoItems.findIndex((p) => p.id === id); if (i >= 0) { setTab("Photos"); setLb({ list: photoItems, i }); } });

  const download = async (it: Item) => {
    try {
      if (it.kind === "wallpaper" && it.wall) {
        const c = document.createElement("canvas");
        await document.fonts?.ready;
        drawWallpaper(c, it.wall.cat, it.wall.v, 1080, 1920);
        const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/png"));
        if (blob) downloadBlob(blob, `msd-wallpaper-${it.id}.png`);
        toast("Wallpaper saved to your downloads", "ok");
      } else {
        const res = await fetch(it.src);
        const blob = await res.blob();
        downloadBlob(blob, `msd-${it.id}.${blob.type.includes("png") ? "png" : "jpg"}`);
        toast(it.credit ? `Downloaded. Please credit: ${it.credit}` : "Downloaded", "ok");
      }
    } catch {
      if (it.src) { window.open(it.src, "_blank", "noopener"); toast("Direct download was blocked — opened in a new tab instead.", "warn"); }
      else toast("Download failed", "err");
    }
  };

  const onFiles = async (fl: FileList | null) => {
    if (!fl) return;
    for (const f of Array.from(fl)) {
      if (!f.type.startsWith("image/")) { toast(`${f.name} is not an image`, "warn"); continue; }
      if (f.size > 8 * 1024 * 1024) { toast(`${f.name} is larger than 8 MB`, "warn"); continue; }
      const rec: MediaRecord = { id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, type: f.type, size: f.size, blob: f, createdAt: Date.now() };
      const ok = await idb.put("media", rec);
      if (ok) toast(`Saved ${f.name} locally`, "ok");
    }
    if (file.current) file.current.value = "";
    void loadUploads();
  };
  const delUpload = async (id: string) => { await idb.delete("media", id); if (favs.includes(id)) toggleFav(id, "upload"); void loadUploads(); toast("Upload deleted", "info"); };

  const createCol = async () => {
    const name = newCol.trim();
    if (!name) return;
    await idb.put("collections", { id: `c-${Date.now()}`, name, items: [], createdAt: Date.now() } as CollectionRecord);
    setNewCol("");
    void loadCols();
    sound.play("success");
  };
  const saveCol = async (c: CollectionRecord) => { await idb.put("collections", c); void loadCols(); };

  const favItems = favs.map(byId).filter(Boolean) as Item[];
  const FavBtn = ({ it }: { it: Item }) => (
    <button className={`icon-btn !w-9 !h-9 !rounded-xl backdrop-blur ${favs.includes(it.id) ? "on" : ""}`} aria-pressed={favs.includes(it.id)} aria-label={favs.includes(it.id) ? "Remove from favourites" : "Add to favourites"} onClick={(e) => { e.stopPropagation(); toggleFav(it.id, it.kind); }}><Heart size={15} fill={favs.includes(it.id) ? "currentColor" : "none"} /></button>
  );
  const card = (it: Item, list: Item[], i: number) => (
    <Reveal key={it.id} delay={(i % 6) * 50} className="mb-4 break-inside-avoid">
      <TiltCard className="group cursor-pointer" max={4} onClick={() => setLb({ list, i })}>
        <div className="relative z-[1]">
          {it.kind === "wallpaper" && it.wall ? <WallCanvas cat={it.wall.cat} v={it.wall.v} className="w-full h-auto block" /> : <Img src={it.src} alt={it.title + ". " + it.caption} className="w-full h-auto block" w={PHOTOS.find((p) => p.id === it.id)?.w} h={PHOTOS.find((p) => p.id === it.id)?.h} />}
          <div className="absolute top-2 right-2 flex gap-1.5"><FavBtn it={it} /></div>
          <div className="p-4"><div className="text-sm font-semibold">{it.title}</div><div className="text-[11px] text-muted mt-1 line-clamp-2">{it.credit ? `Photo: ${it.credit}` : it.caption}</div></div>
        </div>
      </TiltCard>
    </Reveal>
  );
  const grid = (list: Item[]) => <div className="columns-2 lg:columns-3 xl:columns-4 gap-4">{list.map((it, i) => card(it, list, i))}</div>;

  return (
    <div className="view-pad">
      <ViewHeader no="10" title="Media Vault" sub="Gallery · wallpapers · collections" />
      <div className="glass !rounded-full p-1.5 flex gap-1 overflow-x-auto no-scrollbar mb-8 w-fit max-w-full" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab !border-0 whitespace-nowrap ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}{t === "Favourites" && favs.length ? ` · ${favs.length}` : ""}</button>)}
      </div>

      {tab === "Photos" && (<>
        {grid(photoItems)}
        <div className="glass p-5 mt-4 text-xs text-muted leading-relaxed"><div className="relative z-[1]"><b className="text-ink">Attribution.</b> Photos are hosted on Wikimedia Commons and used under Creative Commons licences (CC BY / CC BY-SA). Each image shows its author and licence; the lightbox links to the original file page. Images load from the internet — they are cached for offline use only after you have viewed them once. No video files are included.</div></div>
      </>)}

      {tab === "Wallpapers" && (<>
        <div className="flex gap-2 flex-wrap mb-6">
          <button className={`tab ${wcat === "all" ? "active" : ""}`} onClick={() => setWcat("all")}>All</button>
          {WALL_CATS.map((c) => <button key={c.id} className={`tab ${wcat === c.id ? "active" : ""}`} onClick={() => setWcat(c.id)}>{c.name}</button>)}
        </div>
        {grid(wallItems.filter((w) => wcat === "all" || w.wall?.cat.id === wcat))}
        <p className="text-xs text-muted mt-2">Wallpapers are original typographic artwork generated in your browser at 1080×1920 — not photographs. Download is always user-initiated.</p>
      </>)}

      {tab === "Favourites" && (favItems.length ? grid(favItems) : <Empty text="No favourites yet. Tap the heart on any photo, wallpaper or upload." />)}

      {tab === "My uploads" && (
        <div>
          <div className="glass p-6 mb-6 flex items-center gap-4 flex-wrap"><div className="relative z-[1] flex-1 min-w-[220px]"><div className="font-semibold">Add your own images</div><div className="text-xs text-muted mt-1">Stored in this browser's IndexedDB (max 8 MB each). They never leave your device. Browser storage is not guaranteed permanent — export a backup from Settings.</div></div>
            <input ref={file} type="file" accept="image/*" multiple className="sr-only" id="upl" onChange={(e) => void onFiles(e.target.files)} />
            <label htmlFor="upl" className="btn relative z-[1] cursor-pointer"><Upload size={15} /> Choose images</label></div>
          {uploadItems.length ? (
            <div className="columns-2 lg:columns-3 xl:columns-4 gap-4">
              {uploadItems.map((it, i) => (
                <Reveal key={it.id} className="mb-4 break-inside-avoid"><TiltCard className="cursor-pointer" max={4} onClick={() => setLb({ list: uploadItems, i })}><div className="relative z-[1]">
                  <img src={it.src} alt={it.title} loading="lazy" className="w-full h-auto block" />
                  <div className="absolute top-2 right-2 flex gap-1.5"><FavBtn it={it} /><button className="icon-btn !w-9 !h-9 !rounded-xl backdrop-blur" aria-label={`Delete ${it.title}`} onClick={(e) => { e.stopPropagation(); void delUpload(it.id); }}><Trash2 size={15} /></button></div>
                  <div className="p-3 text-xs truncate">{it.title}</div></div></TiltCard></Reveal>
              ))}
            </div>
          ) : <Empty text="No uploads yet." />}
        </div>
      )}

      {tab === "Collections" && (
        <div>
          <form className="flex gap-3 mb-6 max-w-xl" onSubmit={(e) => { e.preventDefault(); void createCol(); }}>
            <input className="input" placeholder="New collection name (e.g. Finals)" value={newCol} maxLength={40} onChange={(e) => setNewCol(e.target.value)} aria-label="New collection name" />
            <button className="btn" type="submit"><FolderPlus size={15} /> Create</button>
          </form>
          {cols.length === 0 && <Empty text="Create a collection, then add favourites to it." />}
          <div className="grid lg:grid-cols-2 gap-4">
            {cols.map((c) => (
              <div key={c.id} className="glass p-5"><div className="relative z-[1]">
                <div className="flex items-center justify-between mb-3"><h3 className="h-display text-2xl">{c.name} <span className="mono text-[10px] text-muted">({c.items.length})</span></h3>
                  <button className="icon-btn !w-9 !h-9" aria-label={`Delete collection ${c.name}`} onClick={async () => { await idb.delete("collections", c.id); void loadCols(); toast("Collection deleted", "info"); }}><Trash2 size={15} /></button></div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 min-h-[72px]">
                  {c.items.map((id) => { const it = byId(id); return it ? <div key={id} className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-line">{it.kind === "wallpaper" && it.wall ? <WallCanvas cat={it.wall.cat} v={it.wall.v} className="w-full h-full object-cover" /> : <img src={it.src} alt={it.title} className="w-full h-full object-cover" />}<button className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 grid place-items-center" aria-label={`Remove ${it.title}`} onClick={() => saveCol({ ...c, items: c.items.filter((x) => x !== id) })}><X size={16} /></button></div> : null; })}
                  {c.items.length === 0 && <span className="text-xs text-muted self-center">Empty</span>}
                </div>
                <select className="input mt-3" aria-label={`Add favourite to ${c.name}`} value="" onChange={(e) => { if (e.target.value && !c.items.includes(e.target.value)) { void saveCol({ ...c, items: [...c.items, e.target.value] }); award("archivist"); } }}>
                  <option value="">+ Add a favourite…</option>
                  {favItems.filter((f) => !c.items.includes(f.id)).map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div></div>
            ))}
          </div>
        </div>
      )}

      {lb && <Lightbox state={lb} setState={setLb} download={download} FavBtn={FavBtn} />}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="glass p-10 text-center text-muted text-sm"><div className="relative z-[1]">{text}</div></div>;
}

function Lightbox({ state, setState, download, FavBtn }: { state: { list: Item[]; i: number }; setState: (s: { list: Item[]; i: number } | null) => void; download: (i: Item) => void; FavBtn: React.ComponentType<{ it: Item }> }) {
  const { list, i } = state;
  const it = list[i];
  const box = useRef<HTMLDivElement>(null);
  const go = useCallback((d: number) => setState({ list, i: (i + d + list.length) % list.length }), [i, list, setState]);
  const wallRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setState(null); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", fn);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = prev; };
  }, [go, setState]);
  useEffect(() => { if (it.wall && wallRef.current) drawWallpaper(wallRef.current, it.wall.cat, it.wall.v, 540, 960); }, [it]);
  const fs = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void box.current?.requestFullscreen?.(); };
  return (
    <div ref={box} className="fixed inset-0 z-[130] bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`Image viewer: ${it.title}`}>
      <div className="flex items-center justify-between p-4 gap-3">
        <div className="min-w-0"><div className="font-semibold truncate">{it.title}</div><div className="mono text-[9px] text-muted">{i + 1} / {list.length}</div></div>
        <div className="flex gap-2"><FavBtn it={it} /><button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Download" onClick={() => download(it)}><Download size={16} /></button><button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Fullscreen" onClick={fs}><Maximize2 size={16} /></button><button className="icon-btn !w-10 !h-10 !rounded-xl" aria-label="Close viewer" onClick={() => setState(null)}><X size={16} /></button></div>
      </div>
      <div className="flex-1 min-h-0 relative grid place-items-center px-2 sm:px-16">
        {it.wall ? <canvas ref={wallRef} className="max-h-full max-w-full object-contain" style={{ height: "100%", aspectRatio: "9/16" }} /> : <Img src={it.src} alt={it.title} className="max-h-full max-w-full object-contain" />}
        {list.length > 1 && <>
          <button className="icon-btn absolute left-2 top-1/2 -translate-y-1/2" aria-label="Previous image" onClick={() => go(-1)}><ChevronLeft size={20} /></button>
          <button className="icon-btn absolute right-2 top-1/2 -translate-y-1/2" aria-label="Next image" onClick={() => go(1)}><ChevronRight size={20} /></button></>}
      </div>
      <div className="p-4 text-center text-sm text-muted">
        <p>{it.caption}</p>
        {it.credit && <p className="text-xs mt-1">Photo: {it.credit}{it.link && <> · <a className="text-accent inline-flex items-center gap-1" href={it.link} target="_blank" rel="noopener noreferrer">Source <ExternalLink size={11} /></a></>}</p>}
      </div>
    </div>
  );
}
