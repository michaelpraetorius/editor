// Lädt eigene Assets automatisch aus dem Projekt-Ordner /assets:
//   backgrounds/*  -> Hintergrund (z0)
//   overlays/*     -> Overlay/DNA (z10, transparent)
//   artwork/*      -> Artwork/Cliparts (als Bild einfügbar = decor)
// Auto-Discovery über das Verzeichnis-Listing des Dev-Servers; Fallback manifest.json.

import { registerCustomAsset, loadAssetImage } from './assets.js';

const IMG_RE = /\.(jpe?g|png|webp|svg)$/i;
const BASE = 'assets/';
const DIRS = { backgrounds: 'backgrounds/', overlays: 'overlays/', artwork: 'artwork/' };

function slug(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}
function labelOf(name) { return name.replace(/\.[^.]+$/, ''); }

// Verzeichnis-Listing (HTML) parsen. []: leer · null: nicht auflistbar.
async function listDir(dir) {
  try {
    const res = await fetch(BASE + dir, { cache: 'no-cache' });
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && IMG_RE.test(h) && !h.startsWith('/') && !h.includes('..'));
  } catch { return null; }
}

async function fromManifest() {
  try {
    const res = await fetch(BASE + 'manifest.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();   // { backgrounds:[], overlays:[], artwork:[] } (Pfade relativ zu /assets)
  } catch { return null; }
}

function register(dir, href, type, prefix, extra, bust) {
  const name = decodeURIComponent(href);
  const src = BASE + dir + href + '?v=' + bust;      // Cache-Bust: immer aktuelle Datei
  const id = `${prefix}-${slug(name)}`;
  registerCustomAsset({ id, type, src, label: labelOf(name), external: true, ...extra });
  return id;
}

export async function loadExternalAssets() {
  const bust = Date.now();
  let bgF = await listDir(DIRS.backgrounds);
  let ovF = await listDir(DIRS.overlays);
  let artF = await listDir(DIRS.artwork);

  if (bgF === null && ovF === null && artF === null) {
    const m = await fromManifest();
    if (m) {
      bgF = (m.backgrounds || []).map((p) => p.replace(DIRS.backgrounds, ''));
      ovF = (m.overlays || []).map((p) => p.replace(DIRS.overlays, ''));
      artF = (m.artwork || []).map((p) => p.replace(DIRS.artwork, ''));
    }
  }
  bgF = bgF || []; ovF = ovF || []; artF = artF || [];

  const backgrounds = bgF.map((h) => register(DIRS.backgrounds, h, 'background', 'bg', {}, bust));
  const overlays = ovF.map((h) => register(DIRS.overlays, h, 'overlay', 'ov', { blend: 'source-over', defaultOpacity: 0.45 }, bust));
  const artwork = artF.map((h) => register(DIRS.artwork, h, 'decor', 'art', { transparent: true }, bust));

  // Hintergründe + Overlays vorladen; Artwork erst beim Einfügen (kann viel sein).
  await Promise.all([...backgrounds, ...overlays].map((id) => loadAssetImage(id)));
  return { backgrounds, overlays, artwork };
}
