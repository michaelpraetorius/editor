// KI-Generierung: erzeugt aus Thema/Zielgruppe/Tonalität/Struktur ein deck.json (nur Text).
// Zwei Wege, je nach Schlüssel:
//   - OpenRouter (sk-or…): OpenAI-kompatibler Endpunkt, Nutzer via Login (bring your own AI).
//   - Anthropic direkt (sk-ant…): Messages API mit CORS-Direktzugriff.
// Alles im Browser; nichts wird serverseitig gespeichert.

import { LIMITS } from '../model/limits.js';

const ANTHROPIC_URL  = 'https://api.anthropic.com/v1/messages';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Modelle für den direkten Anthropic-Key (Fallback-Weg im Key-Feld).
export const MODELS = [
  { id: 'claude-sonnet-5',           label: 'Claude Sonnet 5 (ausgewogen)' },
  { id: 'claude-opus-5',             label: 'Claude Opus 5 (stärkste)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell)' },
];
export const DEFAULT_MODEL = 'claude-sonnet-5';

const limitLines = Object.entries(LIMITS)
  .map(([f, l]) => `  - ${f}: ${l.min}–${l.max} Zeichen, max ${l.lines} Zeile(n)`).join('\n');

function systemPrompt() {
  return `Du bist ein Content-Generator für einen markenkonformen Slide-Editor.
Antworte AUSSCHLIESSLICH mit einem gültigen deck.json-Objekt – kein Fließtext, keine Erklärung, kein Markdown, keine Code-Fences.

Struktur:
{
  "meta": { "title": "<kurzer Deck-Titel>", "structure": "listicle" },
  "slides": [
    { "role": "opener|point|cta", "kicker": "<Dachzeile>", "headline": "<Kernaussage>", "subline": "<optional, darf \\"\\" sein>", "body": "<1–2 Sätze>" }
  ]
}

Feld-Regeln (Zeichen unbedingt einhalten):
${limitLines}
- kicker: kurze Dachzeile/Kategorie. headline: die zentrale Aussage. subline: optionale Zwischenzeile (darf leer sein). body: 1–2 konkrete Sätze.
- Sprache: Deutsch, außer die Tonalität verlangt etwas anderes. Keine Emojis, keine Hashtags.
- Setze KEINE Hintergründe, Farben oder Assets – nur Text. Gib NUR das JSON-Objekt aus.`;
}

function userPrompt({ thema, zielgruppe, tonalitaet, struktur, anzahl }) {
  const n = anzahl ? `Erzeuge genau ${anzahl} Folien.` : `Wähle eine sinnvolle Anzahl Folien (3–6).`;
  return [
    `Thema: ${thema || '—'}`,
    `Zielgruppe: ${zielgruppe || '—'}`,
    `Tonalität: ${tonalitaet || '—'}`,
    `Struktur/Aufbau: ${struktur || '—'}`,
    n,
    `Die erste Folie ist der Einstieg (role "opener"); eine abschließende Folie darf ein Call-to-Action sein (role "cta").`,
  ].join('\n');
}

// Robust: Code-Fences entfernen, von der ersten { bis zur letzten } schneiden, parsen.
function parseDeck(text) {
  let t = (text || '').trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i !== -1 && j !== -1) t = t.slice(i, j + 1);
  let deck;
  try { deck = JSON.parse(t); }
  catch { throw new Error('Antwort der KI war kein gültiges JSON.'); }
  if (!deck || !Array.isArray(deck.slides) || !deck.slides.length) {
    throw new Error('Die KI hat kein Deck mit Folien geliefert.');
  }
  return deck;
}

// opts: { apiKey, model, thema, zielgruppe, tonalitaet, struktur, anzahl }
export async function generateDeck(opts) {
  const { apiKey } = opts;
  if (!apiKey) throw new Error('Nicht verbunden – bitte anmelden oder Key eingeben.');
  const viaOpenRouter = apiKey.startsWith('sk-or');
  const sys = systemPrompt(), usr = userPrompt(opts);

  let url, headers, body;
  if (viaOpenRouter) {
    url = OPENROUTER_URL;
    headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': location.origin,
      'X-Title': 'Content Pipeline Editor',
    };
    // OpenRouter braucht einen Provider-Präfix (anthropic/…); manuell gewählte
    // Anthropic-Slugs (ohne „/") entsprechend ergänzen.
    let m = opts.model || 'anthropic/claude-sonnet-5';
    if (!m.includes('/')) m = 'anthropic/' + m;
    body = {
      model: m,
      max_tokens: 2000,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
    };
  } else {
    url = ANTHROPIC_URL;
    headers = {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    body = {
      model: opts.model || DEFAULT_MODEL,
      max_tokens: 2000,
      system: sys,
      messages: [{ role: 'user', content: usr }],
    };
  }

  let res;
  try { res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }); }
  catch { throw new Error('Netzwerkfehler beim KI-Aufruf.'); }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const e = await res.json(); msg = e?.error?.message || (typeof e?.error === 'string' ? e.error : msg); } catch {}
    if (res.status === 401) msg = 'Zugang ungültig oder abgelaufen (401).';
    throw new Error(msg);
  }

  const data = await res.json();
  const text = viaOpenRouter
    ? (data?.choices?.[0]?.message?.content || '')
    : (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return parseDeck(text);
}
