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

async function boot() {
  // Schriften müssen für Canvas-Textsatz bereitstehen (Konzept 8.2).
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
  await preloadAll();

  const brandFont = fontAvailable(`'${BRAND_DISPLAY}'`);
  console.info(`[Schrift] Marken-Display-Schrift ${brandFont ? 'verfügbar ✔ (wird verwendet)' : 'nicht gefunden → Fallback Inter. Name in src/model/brand.js (BRAND_DISPLAY) setzen.'}`);

  const store = new Store();
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

  window.__cpe = { store, renderer, ui };   // für Debugging in der Konsole
}

boot();
