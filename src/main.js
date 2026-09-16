// Bootstrap: Fonts + Assets laden, Store/Renderer/UI verdrahten, Shortcuts.
import { Store } from './core/store.js';
import { Renderer } from './render/renderer.js';
import { InlineEditor } from './ui/inline-edit.js';
import { UI } from './ui/ui.js';
import { preloadAll, preloadDeckAssets, getAsset } from './model/assets.js';
import { loadExternalAssets } from './model/external-assets.js';
import { BRAND_DISPLAY } from './model/brand.js';

// Belegt jede Slide mit einem Gradient (z0) + einer DNA (z10) aus dem Ordner,
// sofern noch nicht (gültig) gesetzt. Rundlauf über die vorhandenen Dateien.
function applyFolderBackgrounds(store, folder) {
  const { backgrounds, overlays } = folder;
  store.deck.slides.forEach((s, i) => {
    const bgOk = s.background?.assetId && getAsset(s.background.assetId);
    if (!bgOk && backgrounds.length) {
      s.background = { ...s.background, assetId: backgrounds[i % backgrounds.length] };
    }
    const ovOk = s.overlay?.assetId && getAsset(s.overlay.assetId);
    if (!ovOk && overlays.length) {
      const a = getAsset(overlays[i % overlays.length]);
      s.overlay = { assetId: overlays[i % overlays.length], opacity: a?.defaultOpacity ?? 0.45, blend: a?.blend || 'source-over' };
    }
  });
}

// Prüft, ob eine (lokal installierte) Schrift verfügbar ist — Vergleich der
// Textbreite gegen einen Fallback. Für die Kontrolle nach Installation der Marken-Schrift.
function fontAvailable(family) {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    const s = 'Marke ÄÖÜ agmw 123';
    ctx.font = '72px monospace';
    const base = ctx.measureText(s).width;
    ctx.font = `72px ${family}, monospace`;
    return Math.abs(ctx.measureText(s).width - base) > 0.5;
  } catch { return false; }
}

// Kleiner, stabiler String-Hash (djb2) zur Erkennung "neues Deck vs. schon geladen".
function simpleHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function decodeB64Utf8(s) {
  return decodeURIComponent(escape(atob(decodeURIComponent(s))));
}

// Ermittelt ein Start-Deck aus (Priorität):
//  1. Link-Fragment  #deck=<base64(JSON)>   → Deck steckt im Link (teilbar)
//  2. URL-Parameter  ?deck=<url>            → Deck von einer URL laden
//  3. lokale Datei   deck.json              → vom Agenten geschrieben
async function getDeckSource() {
  const m = location.hash.match(/[#&]deck=([^&]+)/);
  if (m) { try { return { text: decodeB64Utf8(m[1]), kind: 'link' }; } catch {} }
  const u = new URLSearchParams(location.search).get('deck');
  if (u) { try { const r = await fetch(u, { cache: 'no-store' }); if (r.ok) return { text: await r.text(), kind: 'url' }; } catch {} }
  try { const r = await fetch('deck.json', { cache: 'no-store' }); if (r.ok) return { text: await r.text(), kind: 'file' }; } catch {}
  return null;
}

// Lädt ein neues Deck NUR, wenn es sich vom zuletzt geladenen unterscheidet —
// so überschreibt ein Reload nicht die Bearbeitungen des Nutzers, aber eine neue
// Generierung (geänderte deck.json / neuer Link) wird frisch übernommen.
async function loadInitialDeck(store) {
  const src = await getDeckSource();
  if (!src) return;
  const sig = 'deck:' + simpleHash(src.text);
  if (localStorage.getItem('cpe.deckSig') === sig) return;   // schon geladen -> Edits behalten
  try {
    store.loadDeck(JSON.parse(src.text));
    localStorage.setItem('cpe.deckSig', sig);
    console.info(`[Deck] geladen aus ${src.kind}`);
  } catch (e) { console.warn('[Deck] konnte nicht geladen werden:', e); }
}

// Build-Kennung. MUSS bei jedem Deploy gemeinsam mit version.txt erhöht werden.
const BUILD = '2026-09-16-1';

// Selbstheilung gegen gemischten Browser-/Pages-Cache: liegt eine neuere Version
// vor (version.txt, no-store), lädt die Seite genau einmal frisch neu.
async function checkVersion() {
  try {
    const res = await fetch('version.txt?ts=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return false;
    const latest = (await res.text()).trim();
    if (!latest || latest === BUILD) return false;
    const k = 'cpe.reloadedFor';
    if (sessionStorage.getItem(k) === latest) return false;   // schon versucht → keine Endlosschleife
    sessionStorage.setItem(k, latest);
    location.reload();
    return true;
  } catch { return false; }
}

async function boot() {
  if (await checkVersion()) return;              // neuer Build → Reload, hier abbrechen

  // Schriften müssen für Canvas-Textsatz bereitstehen (Konzept 8.2).
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
  await preloadAll();

  const brandFont = fontAvailable(`'${BRAND_DISPLAY}'`);
  console.info(`[Schrift] Marken-Display-Schrift ${brandFont ? 'verfügbar ✔ (wird verwendet)' : 'nicht gefunden → Fallback Inter. Name in src/model/brand.js (BRAND_DISPLAY) setzen.'}`);

  const store = new Store();
  await loadInitialDeck(store);                // ggf. Deck aus Link / URL / deck.json laden
  const folder = await loadExternalAssets();   // Gradienten + DNA aus /assets registrieren
  applyFolderBackgrounds(store, folder);       // Slides automatisch damit belegen
  await preloadDeckAssets(store.deck);
  const stageEl = document.getElementById('stage');
  const renderer = new Renderer(stageEl, store);
  const inlineEditor = new InlineEditor(store, renderer);
  const ui = new UI(store, renderer, inlineEditor, folder);

  // Rebuild bei Deck-Änderung, Selektions-Highlight bei Auswahländerung
  store.on('deck', () => renderer.rebuild());
  store.on('select', () => renderer.onSelectionChange());
  renderer.fit();

  // Nav-Buttons
  document.getElementById('prevBtn').onclick = () => store.prev();
  document.getElementById('nextBtn').onclick = () => store.next();

  // Tastatur
  document.addEventListener('keydown', (e) => {
    if (inlineEditor.field != null) return;             // beim Tippen ignorieren
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); }
    else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); store.redo(); }
    else if (e.key === 'ArrowRight') store.next();
    else if (e.key === 'ArrowLeft') store.prev();
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      const sel = store.selection;
      if (sel?.kind === 'decor') { e.preventDefault(); store.removeDecor(sel.id); }
      else if (sel?.kind === 'logo') { e.preventDefault(); store.deck.brand.show = false; store.selection = null; store.commit('logo-hide'); }
    }
  });

  // Neuer Teilen-Link in bereits offenem Tab: neu laden, damit das Deck greift.
  window.addEventListener('hashchange', () => { if (location.hash.includes('deck=')) location.reload(); });

  window.__cpe = { store, renderer, ui };   // für Debugging in der Konsole
}

boot();
