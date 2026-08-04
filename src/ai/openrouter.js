// OpenRouter-Login per OAuth PKCE – „bring your own AI" ohne Key-Kopieren.
// Der Nutzer meldet sich bei OpenRouter an; die App bekommt einen nutzer-eigenen
// Schlüssel zurück (der Nutzer zahlt über sein OpenRouter-Guthaben). Alles im
// Browser, der Schlüssel liegt nur in sessionStorage (weg beim Schließen).

const AUTH_URL = 'https://openrouter.ai/auth';
const KEY_URL  = 'https://openrouter.ai/api/v1/auth/keys';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';

const SS_KEY = 'cpe.orKey';
const SS_VERIFIER = 'cpe.orVerifier';

// Fallback, falls die Modell-Liste nicht erreichbar ist.
const FALLBACK_MODELS = [
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (ausgewogen)' },
  { id: 'anthropic/claude-opus-5',   label: 'Claude Opus 5 (stärkste)' },
];

export function getOrKey()  { return sessionStorage.getItem(SS_KEY) || null; }
export function clearOrKey() { sessionStorage.removeItem(SS_KEY); }

function b64url(bytes) {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return new Uint8Array(buf);
}
function randomVerifier() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return b64url(a);
}

// Leitet die Seite zu OpenRouter (Login-Fenster). Kommt mit ?code= zurück.
export async function startOpenRouterLogin() {
  const verifier = randomVerifier();
  sessionStorage.setItem(SS_VERIFIER, verifier);
  const challenge = b64url(await sha256(verifier));
  const callback = location.origin + location.pathname;      // ohne Query/Hash
  const url = `${AUTH_URL}?callback_url=${encodeURIComponent(callback)}`
            + `&code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=S256`;
  location.href = url;
}

// Beim Laden aufrufen: tauscht ein evtl. vorhandenes ?code= gegen einen Key.
// Gibt den Key zurück (oder null, wenn kein Code da war / Fehler).
export async function completeOpenRouterLogin() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code) return null;

  const verifier = sessionStorage.getItem(SS_VERIFIER) || '';
  // URL sofort säubern, damit ein Reload den Code nicht erneut einlöst.
  params.delete('code');
  const clean = location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
  history.replaceState(null, '', clean);

  try {
    const res = await fetch(KEY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
    });
    if (!res.ok) throw new Error('Token-Tausch fehlgeschlagen (' + res.status + ')');
    const data = await res.json();
    if (!data?.key) throw new Error('Kein Schlüssel in der Antwort.');
    sessionStorage.setItem(SS_KEY, data.key);
    sessionStorage.removeItem(SS_VERIFIER);
    return data.key;
  } catch (e) {
    console.warn('[OpenRouter] Login fehlgeschlagen:', e);
    sessionStorage.removeItem(SS_VERIFIER);
    return null;
  }
}

function rank(id) {
  if (id.includes('sonnet')) return 0;
  if (id.includes('haiku'))  return 1;
  if (id.includes('opus'))   return 2;
  return 3;
}

// Verfügbare Claude-Modelle bei OpenRouter (saubere Aliase ohne Datums-Suffix).
export async function fetchClaudeModels() {
  try {
    const res = await fetch(MODELS_URL);
    if (!res.ok) throw new Error('models ' + res.status);
    const { data } = await res.json();
    const out = [];
    const seen = new Set();
    (data || [])
      .filter((m) => m.id && m.id.startsWith('anthropic/claude'))
      .filter((m) => !/\d{8}$/.test(m.id) && !/-fast$/.test(m.id))   // keine datierten/-fast-Varianten
      .forEach((m) => {
        if (seen.has(m.id)) return;
        seen.add(m.id);
        out.push({ id: m.id, label: (m.name || m.id).replace(/^Anthropic:\s*/, '') });
      });
    out.sort((a, b) => rank(a.id) - rank(b.id));
    return out.length ? out : FALLBACK_MODELS;
  } catch (e) {
    console.warn('[OpenRouter] Modell-Liste nicht ladbar:', e);
    return FALLBACK_MODELS;
  }
}

export const DEFAULT_OR_MODEL = 'anthropic/claude-sonnet-5';
