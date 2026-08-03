// Minimaler Event-Emitter für die Kommunikation zwischen Store, Renderer und UI.
export class Emitter {
  constructor() { this._h = new Map(); }
  on(evt, fn) {
    if (!this._h.has(evt)) this._h.set(evt, new Set());
    this._h.get(evt).add(fn);
    return () => this._h.get(evt)?.delete(fn);
  }
  emit(evt, payload) {
    this._h.get(evt)?.forEach((fn) => fn(payload));
  }
}
