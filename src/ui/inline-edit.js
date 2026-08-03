// Nahtloser Inline-Editor: legt ein UNSICHTBAR gestyltes Textfeld exakt über den
// Canvas-Text (gleiche Schrift/Größe/Farbe/Position) und blendet den Canvas-Text
// währenddessen aus — es wirkt, als schreibe man direkt ins Layout. Kein Popup.

import { checkLimit } from '../model/limits.js';

export class InlineEditor {
  constructor(store, renderer) {
    this.store = store;
    this.renderer = renderer;
    this.field = null;

    this.el = document.createElement('div');
    this.el.className = 'inline-edit';
    this.el.style.display = 'none';
    this.el.innerHTML = `<textarea spellcheck="true" rows="1"></textarea><span class="cnt"></span>`;
    document.body.appendChild(this.el);
    this.textarea = this.el.querySelector('textarea');
    this.counter = this.el.querySelector('.cnt');

    this.textarea.addEventListener('input', () => this._onInput());
    this.textarea.addEventListener('blur', () => this.close());
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); this.close(); }
    });
  }

  open(field) {
    const node = this.renderer._nodes?.text?.[field];
    const rect = this.renderer.screenRectFor(field);
    if (!node || !rect) return;
    this.field = field;
    const s = rect.scale;

    // Typografie 1:1 vom gerenderten Canvas-Text übernehmen (inkl. Auto-Fit-Größe).
    const ta = this.textarea;
    ta.value = this.store.slide[field] || '';
    Object.assign(ta.style, {
      fontFamily: node.fontFamily(),
      fontSize: (node.fontSize() * s) + 'px',
      fontWeight: String(node.fontStyle() || '400'),
      lineHeight: String(node.lineHeight() || 1.2),
      letterSpacing: ((node.letterSpacing() || 0) * s) + 'px',
      color: node.fill(),
      caretColor: node.fill(),
      textAlign: node.align() || 'left',
      width: rect.width + 'px',
    });
    Object.assign(this.el.style, { display: 'block', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px' });

    // Auswahl setzen (Positionsrahmen bleibt sichtbar) + Canvas-Text ausblenden.
    this.store.select({ kind: 'text', field });
    this.renderer.editingField = field;
    this.renderer.rebuild();

    this._autoHeight();
    this._updateCounter();
    ta.focus();
    ta.select();
  }

  _onInput() {
    this.store.slide[this.field] = this.textarea.value;
    this._updateCounter();
    this.store.touch();
    this.renderer.rebuild();                     // Layout reflowen (Feld bleibt ausgeblendet)
    const rect = this.renderer.screenRectFor(this.field);
    if (rect) {
      this.el.style.left = rect.left + 'px';
      this.el.style.top = rect.top + 'px';
      this.el.style.width = rect.width + 'px';
      this.textarea.style.width = rect.width + 'px';
      this.textarea.style.fontSize = (this.renderer._nodes.text[this.field].fontSize() * rect.scale) + 'px';
    }
    this._autoHeight();
  }

  _autoHeight() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  _updateCounter() {
    const { status, len, lim } = checkLimit(this.field, this.textarea.value);
    if (!lim) { this.counter.textContent = ''; return; }
    this.counter.textContent = `${len} / ${lim.max}`;
    this.counter.className = 'cnt ' + status;
  }

  close() {
    if (this.field == null) return;
    const field = this.field;
    this.field = null;
    this.el.style.display = 'none';
    this.renderer.editingField = null;
    this.renderer.rebuild();                     // Canvas-Text wieder einblenden
    this.store.commit('edit-text:' + field);
  }
}
