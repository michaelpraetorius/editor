// Zentrales Asset-Register (Konzept 5.2). Assets werden NUR per ID referenziert,
// nie per Pfad — Auflösung passiert hier. Eingebaute Start-Bibliothek als
// SVG-Data-URIs, damit die App ohne externe Dateien rein im Browser läuft.

function svg(inner, w, h) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}

// ---- Hintergründe (Verläufe) --------------------------------------------
function gradientBg(id, c1, c2, angle = 160) {
  const rad = (angle * Math.PI) / 180;
  const x2 = 50 + Math.cos(rad) * 50, y2 = 50 + Math.sin(rad) * 50;
  const inner = `
    <defs><linearGradient id="g" x1="${100 - x2}%" y1="${100 - y2}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="1080" height="1920" fill="url(#g)"/>`;
  return { id, type: 'background', luminance: 'dark', w: 1080, h: 1920,
    safeArea: { top: 0.2, bottom: 0.55 }, tags: [], src: svg(inner, 1080, 1920) };
}

// ---- Overlays (Helix, weiße Linienkunst) --------------------------------
function helixOverlay(id, anchor) {
  let path = '';
  for (let i = 0; i < 42; i++) {
    const y = i * 46;
    const x = 540 + Math.sin(i * 0.5) * 360;
    const r = 6 + Math.abs(Math.cos(i * 0.5)) * 10;
    path += `<circle cx="${x.toFixed(1)}" cy="${y}" r="${r.toFixed(1)}" fill="#fff" opacity="0.9"/>`;
    const x2 = 540 - Math.sin(i * 0.5) * 360;
    path += `<circle cx="${x2.toFixed(1)}" cy="${y}" r="${r.toFixed(1)}" fill="#fff" opacity="0.5"/>`;
    if (i % 2 === 0) path += `<line x1="${x.toFixed(1)}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y}" stroke="#fff" stroke-width="2" opacity="0.4"/>`;
  }
  return { id, type: 'overlay', blend: 'screen', defaultOpacity: 0.35, anchor,
    w: 1080, h: 1932, src: svg(path, 1080, 1932) };
}

// ---- Decor (Cliparts, transparent) --------------------------------------
const CLIPARTS = {
  'clip-molecule': `<g fill="none" stroke="#fff" stroke-width="8">
      <circle cx="100" cy="100" r="34" fill="#fff"/><circle cx="220" cy="60" r="24" fill="#fff"/>
      <circle cx="230" cy="190" r="28" fill="#fff"/><circle cx="70" cy="230" r="20" fill="#fff"/>
      <line x1="100" y1="100" x2="220" y2="60"/><line x1="100" y1="100" x2="230" y2="190"/>
      <line x1="100" y1="100" x2="70" y2="230"/><line x1="220" y1="60" x2="230" y2="190"/></g>`,
  'clip-arrow': `<g fill="#fff"><path d="M40 150 H210 M150 90 L230 150 L150 210" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  'clip-spark': `<g fill="#fff"><path d="M150 20 L172 118 L270 140 L172 162 L150 260 L128 162 L30 140 L128 118 Z"/></g>`,
  'clip-dot-grid': `<g fill="#fff">${Array.from({length: 25}, (_, i) => {
      const c = i % 5, r = Math.floor(i / 5);
      return `<circle cx="${40 + c * 55}" cy="${40 + r * 55}" r="10"/>`;
    }).join('')}</g>`,
};

function clipart(id) {
  return { id, type: 'decor', transparent: true, defaultScale: 1.0, tags: [],
    w: 300, h: 300, src: svg(CLIPARTS[id], 300, 300) };
}

// ---- Logo (blockige Wortmarke, Platzhalter — ersetzbar) -----------------
function logoRadunff() {
  // grobe Pixel-/Blockoptik wie im Screenshot: drei gestapelte Zeilen in Lime
  const rows = ['RADU', 'NFF', 'COM'];
  const cell = 26, gap = 5;
  let g = '';
  rows.forEach((word, r) => {
    for (let c = 0; c < word.length; c++) {
      const x = c * (cell + gap), y = r * (cell + gap);
      g += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="#c9de3a"/>`;
      g += `<text x="${x + cell / 2}" y="${y + cell / 2 + 6}" font-family="Arial" font-weight="700" font-size="18" fill="#0f232b" text-anchor="middle">${word[c]}</text>`;
    }
  });
  const w = 4 * (cell + gap) - gap, h = 3 * (cell + gap) - gap;
  return { id: 'logo-radunff', type: 'logo', transparent: true, w, h, src: svg(g, w, h) };
}

// Bewusst leer bis auf das Logo-Asset (für später) — es werden ausschließlich
// die eigenen Dateien aus /assets verwendet (Gradienten + DNA).
// Die Generatoren gradientBg/helixOverlay/clipart bleiben für spätere Nutzung erhalten.
export const ASSET_REGISTRY = {
  'logo-radunff': logoRadunff(),
};

// Eigene, zur Laufzeit registrierte Assets (aus deck.assets / Uploads).
const customAssets = new Map();

export function registerCustomAsset(asset) {
  customAssets.set(asset.id, asset);
  return asset.id;
}
// Alle eigenen Assets eines Decks in die Laufzeit-Registry spiegeln.
export function registerDeckAssets(deck) {
  Object.entries(deck.assets || {}).forEach(([id, a]) => customAssets.set(id, { id, ...a }));
}

export function getAsset(id) {
  return ASSET_REGISTRY[id] || customAssets.get(id) || null;
}

export function assetsByType(type) {
  return [...Object.values(ASSET_REGISTRY), ...customAssets.values()].filter((a) => a.type === type);
}

// Image-Cache: id -> Promise<HTMLImageElement>. Zusätzlich `resolved` als
// synchroner Zugriff für den Renderer/Export (Bilder werden vorher vorgeladen).
const imageCache = new Map();
const resolved = new Map();

export function loadAssetImage(id) {
  if (imageCache.has(id)) return imageCache.get(id);
  const asset = getAsset(id);
  if (!asset) return Promise.resolve(null);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { resolved.set(id, img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = asset.src;
  });
  imageCache.set(id, p);
  return p;
}

// Synchroner Zugriff auf ein bereits geladenes Bild (oder null).
export function getLoadedImage(id) {
  return resolved.get(id) || null;
}

// Die komplette (kleine) Registry vorladen — beim Start aufgerufen, damit
// Renderer und Thumbnails immer synchron zeichnen können.
export async function preloadAll() {
  await Promise.all(Object.keys(ASSET_REGISTRY).map((id) => loadAssetImage(id)));
}

// Alle Assets eines Decks vorladen (für Renderer/Export).
export async function preloadDeckAssets(deck) {
  const ids = new Set();
  for (const s of deck.slides) {
    if (s.background?.assetId) ids.add(s.background.assetId);
    if (s.overlay?.assetId) ids.add(s.overlay.assetId);
    for (const d of s.decor || []) if (d.assetId) ids.add(d.assetId);
  }
  await Promise.all([...ids].map((id) => loadAssetImage(id)));
}
