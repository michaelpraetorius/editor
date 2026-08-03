// Offscreen-Renderer in voller Auflösung (1080-Basis) für PNG/PDF/MP4.
// Nutzt dieselbe paintSlide-Funktion wie der Editor -> Export = Vorschau.
// Eine Stage wird wiederverwendet und pro Frame neu bemalt (wichtig für Video).

import { paintSlide } from '../render/paint.js';
import { getFormat } from '../model/formats.js';
import { preloadDeckAssets } from '../model/assets.js';

const Konva = window.Konva;

export class OffscreenRenderer {
  constructor() {
    this.host = document.createElement('div');
    this.host.style.cssText = 'position:absolute;left:-99999px;top:0;';
    document.body.appendChild(this.host);
    this.stage = new Konva.Stage({ container: this.host, width: 10, height: 10 });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this._fmtId = null;
  }

  _ensureSize(fmt) {
    if (this._fmtId === fmt.id) return;
    this._fmtId = fmt.id;
    this.stage.width(fmt.w);
    this.stage.height(fmt.h);
  }

  // Zeichnet eine Slide bei Zeit t (null = statischer Endzustand) und gibt das
  // <canvas>-Element der Stage zurück (nicht zerstören zwischen Frames).
  paint(slide, deck, format, t = null) {
    const fmt = getFormat(format || deck.meta.format);
    this._ensureSize(fmt);
    this.layer.destroyChildren();
    const { group } = paintSlide(slide, deck, { format: fmt.id, t, chrome: true });
    this.layer.add(group);
    this.layer.draw();
    return this.stage.toCanvas({ pixelRatio: 1 });
  }

  dataURL(slide, deck, format, t = null) {
    this.paint(slide, deck, format, t);
    return this.stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' });
  }

  // Kleine Vorschau (für Thumbnail-Streifen), direkt herunterskaliert.
  thumbDataURL(slide, deck, format, px = 120) {
    const fmt = getFormat(format || deck.meta.format);
    this.paint(slide, deck, format, null);
    return this.stage.toDataURL({ pixelRatio: px / fmt.w, mimeType: 'image/png' });
  }

  destroy() {
    this.stage.destroy();
    this.host.remove();
  }
}

// Bequemer Einstieg: Assets sicher vorladen, dann Renderer liefern.
export async function withOffscreen(deck) {
  await preloadDeckAssets(deck);
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
  return new OffscreenRenderer();
}
