// KI-Generierung: ruft Claude DIREKT aus dem Browser auf (bring your own key)
// und erzeugt daraus ein deck.json (nur Text). Nichts wird serverseitig gespeichert;
// der API-Key bleibt im Browser. Anthropic erlaubt Direktzugriff per CORS-Header.

import { LIMITS } from '../model/limits.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

// Modelle für den Test mit Claude (Auswahl im Modal).
export const MODELS = [
  { id: 'claude-sonnet-5',            label: 'Claude Sonnet 5 (ausgewogen)' },
  { id: 'claude-opus-5',              label: 'Claude Opus 5 (stärkste)' },
  { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5 (schnell)' },
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
  const n = anzahl
    ? `Erzeuge genau ${anzahl} Folien.`
    : `Wähle eine sinnvolle Anzahl Folien (3–6).`;
  return [
    `Thema: ${thema || '—'}`,
    `Zielgruppe: ${zielgruppe || '—'}`,
    `Tonalität: ${tonalitaet || '—'}`,
    `Struktur/Aufbau: ${struktur || '—'}`,
    n,
    `Die erste Folie ist der Einstieg (role "opener"); eine abschließende Folie darf ein Call-to-Action sein (role "cta").`,
  ].join('\n');
}

// Erwartet { apiKey, model, thema, zielgruppe, tonalitaet, struktur, anzahl }
export async function generateDeck(opts) {
  const { apiKey, model = DEFAULT_MODEL } = opts;
  if (!apiKey) throw new Error('Kein API-Key angegeben.');

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: systemPrompt(),
        messages: [
          { role: 'user', content: userPrompt(opts) },
        ],
      }),
    });
  } catch (e) {
    throw new Error('Netzwerkfehler beim Aufruf der Claude-API.');
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const e = await res.json(); if (e?.error?.message) msg = e.error.message; } catch {}
    if (res.status === 401) msg = 'API-Key ungültig (401).';
    throw new Error(msg);
  }

  const data = await res.json();
  const text = (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return parseDeck(text);
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
