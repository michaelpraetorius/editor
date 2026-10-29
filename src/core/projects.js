// Lokale Projektverwaltung: mehrere benannte Decks, gespeichert in IndexedDB
// (bleibt auf dem eigenen Rechner im Browser, überlebt Reloads, viel Platz).
// Ein Projekt = { id, name, deck, updatedAt }.

const DB = 'cpe-editor', STORE = 'projects', VER = 1;
const LS_ACTIVE = 'cpe.activeProject';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function store(mode) {
  const db = await openDB();
  return db.transaction(STORE, mode).objectStore(STORE);
}

export function newId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
export function getActiveId() { try { return localStorage.getItem(LS_ACTIVE); } catch { return null; } }
export function setActiveId(id) { try { localStorage.setItem(LS_ACTIVE, id); } catch {} }

export async function listProjects() {
  try {
    const s = await store('readonly');
    return await new Promise((res) => {
      const r = s.getAll();
      r.onsuccess = () => res((r.result || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      r.onerror = () => res([]);
    });
  } catch { return []; }
}
export async function getProject(id) {
  try {
    const s = await store('readonly');
    return await new Promise((res) => {
      const r = s.get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
  } catch { return null; }
}
export async function saveProject(p) {
  p.updatedAt = Date.now();
  const s = await store('readwrite');
  return new Promise((res, rej) => {
    const r = s.put(p);
    r.onsuccess = () => res(p);
    r.onerror = () => rej(r.error);
  });
}
export async function deleteProject(id) {
  try {
    const s = await store('readwrite');
    await new Promise((res) => { const r = s.delete(id); r.onsuccess = () => res(); r.onerror = () => res(); });
  } catch {}
}

// Beim Start: aktives Projekt ins Deck laden – oder erstes Projekt anlegen.
// externalDeckLoaded = true, wenn gerade ein #deck/url/deck.json geladen wurde.
export async function bootProjects(store_, { externalDeckLoaded } = {}) {
  const deckCopy = () => JSON.parse(JSON.stringify(store_.deck));
  try {
    const all = await listProjects();

    if (externalDeckLoaded) {               // geteiltes Deck -> neues Projekt
      const p = { id: newId(), name: store_.deck.meta?.title || 'Import', deck: deckCopy() };
      await saveProject(p); setActiveId(p.id);
      return { activeId: p.id, name: p.name, hadProjectDeck: false };
    }
    if (all.length === 0) {                 // erstes Projekt aus dem aktuellen Deck
      const p = { id: newId(), name: store_.deck.meta?.title || 'Projekt 1', deck: deckCopy() };
      await saveProject(p); setActiveId(p.id);
      return { activeId: p.id, name: p.name, hadProjectDeck: false };
    }
    const active = all.find((p) => p.id === getActiveId()) || all[0];
    setActiveId(active.id);
    store_.loadDeck(active.deck);            // aktives Projekt übernehmen
    return { activeId: active.id, name: active.name, hadProjectDeck: true };
  } catch (e) {
    console.warn('[Projekte] Init fehlgeschlagen, nutze Autosave-Deck:', e);
    return { activeId: null, name: null, hadProjectDeck: false };
  }
}
