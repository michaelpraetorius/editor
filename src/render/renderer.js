// Live-Editor-Renderer. Besitzt die Konva-Stage, skaliert sie in den Viewport,
// baut die aktuelle Slide bei jeder Änderung neu (WYSIWYG mit Export via paintSlide)
// und ergänzt die Interaktivität: Selektion, Decor-Drag mit Snapping, Transformer,
// Safe-Zone-Overlay und Timeline-Playback (seek(t)).

import { paintSlide } from './paint.js';
import { getFormat, safeRect } from '../model/formats.js';
import { getPreset } from './motion.js';

const Konva = window.Konva;
const SNAP = 0.012;   // Snapping-Toleranz in normalisierten Einheiten

export class Renderer {
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this.t = null;              // null = statischer Endzustand
    this.playing = false;
    this.showSafe = true;       // Raster standardmäßig an
    this.editingField = null;   // Feld, das gerade inline bearbeitet wird (ausgeblendet)
    this._raf = null;

    this.stage = new Konva.Stage({ container, width: 100, height: 100 });
    this.layer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer({ listening: false });  // Safe-Zones, nicht exportiert
    this.stage.add(this.layer);
    this.stage.add(this.overlayLayer);

    this.transformer = new Konva.Transformer({
      rotateEnabled: true, borderStroke: '#4ea1ff', anchorStroke: '#4ea1ff',
      anchorFill: '#0e1726', anchorSize: 12, keepRatio: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    });
    this.layer.add(this.transformer);
    this.transformer.on('transform', () => this._emitSelectionRect());

    this.stage.on('click tap', (e) => {
      if (e.target === this.stage) { this.store.select(null); }
    });

    // ResizeObserver statt window.resize: feuert auch bei der Initialgröße,
    // sobald das Grid steht — behebt zu frühes fit() mit falscher Breite.
    this._ro = new ResizeObserver(() => this.fit());
    this._ro.observe(this.container.parentElement || this.container);
  }

  // Skaliert die Stage so, dass die Slide in den verfügbaren Platz passt.
  // Bezug ist das Eltern-Element (.stage-wrap), NICHT der Stage-Container selbst
  // — dessen Größe entspricht nach Konva-Init nur dem Canvas.
  fit() {
    const fmt = getFormat(this.store.format);
    const host = this.container.parentElement || this.container;
    const pad = 44; // .stage-wrap padding (22px je Seite)
    const cw = Math.max(80, (host.clientWidth || 800) - pad);
    const ch = Math.max(80, (host.clientHeight || 600) - pad);
    const s = Math.min(cw / fmt.w, ch / fmt.h);
    this.scale = s;
    this.stage.width(fmt.w * s);
    this.stage.height(fmt.h * s);
    this.layer.scale({ x: s, y: s });
    this.overlayLayer.scale({ x: s, y: s });
    this.rebuild();
  }

  rebuild() {
    const store = this.store;
    // alte Inhalte weg, Transformer behalten
    this.layer.getChildren((n) => n !== this.transformer).forEach((n) => n.destroy());
    this.transformer.nodes([]);

    const slide = store.slide;
    if (!slide) { this.layer.draw(); return; }
    const { group, nodes, fmt } = paintSlide(slide, store.deck, {
      format: store.format, t: this.t, chrome: true,
    });
    this.layer.add(group);
    this._nodes = nodes;
    this._fmt = fmt;

    if (!this.playing) this._wireInteractivity(nodes, fmt);
    this._drawSafeZones();
    // Beim Inline-Editieren den Canvas-Text ausblenden (das DOM-Feld zeigt ihn).
    if (this.editingField && nodes.text[this.editingField]) nodes.text[this.editingField].opacity(0);
    this.layer.draw();
  }

  _wireInteractivity(nodes, fmt) {
    const store = this.store;

    // Decor: draggable + Selektion + Snapping
    nodes.decor.forEach(({ node, decor }) => {
      node.draggable(true);
      node.on('mousedown touchstart', () => store.select({ kind: 'decor', id: decor.id }));
      node.on('contextmenu', (e) => {
        e.evt.preventDefault();
        store.select({ kind: 'decor', id: decor.id });
        this.onDecorContext?.(decor.id, e.evt.clientX, e.evt.clientY);
      });
      node.on('dragmove', () => {
        // Snapping an Raster-/Mittelachsen und Safe-Kanten
        const nx = node.x() / fmt.w, ny = node.y() / fmt.h;
        const snapped = this._snap(nx, ny, fmt);
        node.x(snapped.x * fmt.w); node.y(snapped.y * fmt.h);
        store.touch(); this._emitSelectionRect();
      });
      node.on('dragend transformend', () => {
        decor.x = node.x() / fmt.w;
        decor.y = node.y() / fmt.h;
        if (node._unit) decor.scale = node.scaleX() / node._unit;
        decor.rot = node.rotation();
        store.commit('move-decor');
      });
    });

    // Text: EIN Klick öffnet Bearbeitung, Ziehen verschiebt.
    Object.entries(nodes.text).forEach(([field, node]) => {
      node.draggable(true);
      let moved = false;
      node.on('mousedown touchstart', () => { moved = false; store.select({ kind: 'text', field }); });
      node.on('dragmove', () => {
        moved = true;
        const nx = node.x() / fmt.w;
        const left = fmt.safe.left, center = 0.5 - (node.width() / 2) / fmt.w;
        if (Math.abs(nx - left) < SNAP) node.x(left * fmt.w);
        else if (Math.abs(nx - center) < SNAP) node.x(center * fmt.w);
        store.touch();
      });
      node.on('dragend', () => {
        const slide = store.slide;
        slide.pos = slide.pos || {};
        slide.pos[field] = { x: (node.x() - node._defX) / fmt.w, y: (node.y() - node._defY) / fmt.h };
        store.commit('move-text');
      });
      // Einfacher Klick wählt nur aus (mousedown), Doppelklick editiert.
      node.on('dblclick dbltap', () => this.onEditText?.(field));
    });

    // Logo: verschiebbar + skalierbar
    if (nodes.logo) {
      const lg = nodes.logo;
      lg.draggable(true);
      lg.on('mousedown touchstart', () => store.select({ kind: 'logo' }));
      lg.on('dragmove', () => { store.touch(); this._emitSelectionRect(); });
      lg.on('dragend', () => {
        store.deck.brand.x = lg.x() / fmt.w; store.deck.brand.y = lg.y() / fmt.h;
        store.commit('move-logo');
      });
      lg.on('transformend', () => {
        store.deck.brand.scale = lg.scaleX() / (lg._logoUnit || 1);
        store.deck.brand.x = lg.x() / fmt.w; store.deck.brand.y = lg.y() / fmt.h;
        store.commit('scale-logo');
      });
    }

    this._applySelection();
  }

  _snap(x, y, fmt) {
    const targets = [];
    const safe = { l: fmt.safe.left, r: 1 - fmt.safe.right, t: fmt.safe.top, b: 1 - fmt.safe.bottom };
    const xs = [0.5, safe.l, safe.r];
    const ys = [0.5, safe.t, safe.b];
    let rx = x, ry = y;
    for (const tx of xs) if (Math.abs(x - tx) < SNAP) rx = tx;
    for (const ty of ys) if (Math.abs(y - ty) < SNAP) ry = ty;
    return { x: rx, y: ry };
  }

  _applySelection() {
    const sel = this.store.selection;
    const tr = this.transformer;
    if (!sel || !this._nodes) { tr.nodes([]); this._selNode = null; this._emitSelectionRect(); this.layer.batchDraw(); return; }

    let node = null, resize = false, rotate = false;
    if (sel.kind === 'decor') {
      node = this._nodes.decor.find((d) => d.decor.id === sel.id)?.node;
      resize = true; rotate = true;
    } else if (sel.kind === 'logo') {
      node = this._nodes.logo; resize = true; rotate = false;
    } else if (sel.kind === 'text') {
      node = this._nodes.text[sel.field]; resize = false; rotate = false;  // nur Auswahlrahmen
    }

    tr.resizeEnabled(resize);
    tr.rotateEnabled(rotate);
    tr.nodes(node ? [node] : []);
    this._selNode = node;
    this._emitSelectionRect();
    this.layer.batchDraw();
  }

  onSelectionChange() { if (!this.playing) this._applySelection(); }

  // Bildschirm-Rect eines Nodes (Viewport-Koordinaten, für DOM-Overlays).
  screenRectForNode(node) {
    if (!node) return null;
    const box = this.stage.container().getBoundingClientRect();
    const r = node.getClientRect({ relativeTo: this.stage });
    return { left: box.left + r.x, top: box.top + r.y, width: r.width, height: r.height };
  }

  // Meldet der UI die Position/Art der aktuellen Auswahl (oder null).
  _emitSelectionRect() {
    const sel = this.store.selection;
    if (this.playing || !this._selNode || !sel) { this.onSelectionRect?.(null, null); return; }
    this.onSelectionRect?.(this.screenRectForNode(this._selNode), sel.kind);
  }

  _drawSafeZones() {
    this.overlayLayer.destroyChildren();
    if (!this.showSafe) { this.overlayLayer.draw(); return; }
    const fmt = getFormat(this.store.format);
    const safe = safeRect(fmt);
    // Außenbereich (Sperrzone) leicht abdunkeln + Rahmen
    this.overlayLayer.add(new Konva.Rect({
      x: safe.x, y: safe.y, width: safe.w, height: safe.h,
      stroke: '#4ea1ff', strokeWidth: 2, dash: [12, 8], opacity: 0.8,
    }));
    // Sperrzonen-Bänder
    const bands = [
      { x: 0, y: 0, width: fmt.w, height: safe.y },
      { x: 0, y: safe.y + safe.h, width: fmt.w, height: fmt.h - (safe.y + safe.h) },
    ];
    bands.forEach((b) => this.overlayLayer.add(new Konva.Rect({
      ...b, fill: '#ff5c7a', opacity: 0.12,
    })));
    this.overlayLayer.draw();
  }

  setSafeZones(on) { this.showSafe = on; this._drawSafeZones(); }

  // Assets aus der Leiste per Drag&Drop auf die Slide. handler(kind, id, x, y)
  // mit x,y als normalisierte 0..1-Position des Drop-Punkts.
  enableAssetDrop(handler) {
    const el = this.container;
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const fmt = getFormat(this.store.format);
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / (this.scale || 1) / fmt.w));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / (this.scale || 1) / fmt.h));
      // Eigene Bilddateien vom Rechner
      const files = [...(e.dataTransfer.files || [])].filter((f) => f.type.startsWith('image/'));
      if (files.length) { this.onFileDrop?.(files, x, y, this.logoContains(x, y)); return; }
      // Chips aus der Leiste
      const payload = e.dataTransfer.getData('text/plain');
      if (!payload) return;
      const [kind, id] = payload.split(':');
      handler(kind, id, x, y);
    });
  }

  // Liegt (nx,ny) über dem Logo? (für „Datei aufs Logo ziehen = ersetzen")
  logoContains(nx, ny) {
    const lg = this._nodes?.logo; if (!lg) return false;
    const fmt = getFormat(this.store.format);
    const px = nx * fmt.w, py = ny * fmt.h;
    const w = lg.width() * lg.scaleX(), h = lg.height() * lg.scaleY();
    return px >= lg.x() && px <= lg.x() + w && py >= lg.y() && py <= lg.y() + h;
  }

  // ---- Timeline ---------------------------------------------------------
  slideDuration() {
    const slide = this.store.slide;
    const name = slide?.motion || this.store.deck.theme.motion || 'calm';
    return getPreset(name).slideDuration;
  }

  seek(t) {
    this.t = t;
    this.rebuild();
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.store.select(null);
    const dur = this.slideDuration();
    const start = performance.now();
    const loop = (now) => {
      if (!this.playing) return;
      const t = ((now - start) / 1000) % dur;
      this.t = t;
      this.rebuild();
      this._raf = requestAnimationFrame(loop);
      this.onFrame?.(t, dur);
    };
    this._raf = requestAnimationFrame(loop);
  }

  pause() {
    this.playing = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this.rebuild();
  }

  stopToStatic() { this.pause(); this.t = null; this.rebuild(); }

  // Screen-Rect eines Textfelds für das Inline-Editor-Overlay.
  screenRectFor(field) {
    const n = this._nodes?.text?.[field];
    if (!n) return null;
    const box = this.stage.container().getBoundingClientRect();
    const r = n._layoutRect;
    const s = this.scale;
    return { left: box.left + r.x * s, top: box.top + r.y * s, width: r.w * s, height: r.h * s, scale: s, node: n };
  }
}
