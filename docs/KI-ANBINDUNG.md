# KI-Anbindung – welcher Anbieter geht wie

Der Dialog **„Mit AI verbinden"** erzeugt die Folien-Texte, indem er direkt aus dem
Browser eine KI aufruft (bring your own key). Entscheidend ist, ob der jeweilige
Anbieter **direkte Browser-Aufrufe (CORS)** erlaubt. Getestet von der Live-Origin
`https://michaelpraetorius.github.io` (Stand Okt 2026):

| Anbieter | Direkt aus dem Browser? | Status |
|---|---|---|
| **Anthropic (Claude)** | ✅ ja (CORS-Header `anthropic-dangerous-direct-browser-access`) | im Dialog wählbar |
| **Mistral** | ✅ ja (CORS erlaubt, Standard-Bearer) | im Dialog wählbar |
| **OpenAI (GPT)** | ❌ nein (CORS blockiert, `Failed to fetch`) | nur über Proxy – siehe unten |

Der Key wird **nur im Browser** gehalten (`sessionStorage`, pro Anbieter getrennt),
nie gespeichert oder an Dritte gesendet – nur an den gewählten Anbieter.

---

## 1. Anthropic (Claude) – direkt

**Key besorgen:** [console.anthropic.com](https://console.anthropic.com/settings/keys) → anmelden →
unter **Billing** Guthaben aufladen (ab wenigen $) → **API keys → Create Key** → kopieren.
Schlüssel beginnt mit `sk-ant-…`.

**Im Dialog:** Anbieter „Anthropic (Claude)" wählen, Key einfügen, Modell wählen (Sonnet 5 / Opus 5 / Haiku 4.5).

**Technik (für Entwickler):**
- Endpunkt: `POST https://api.anthropic.com/v1/messages`
- Header: `x-api-key: <key>`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`
- Gültiges JSON wird über **Tool-Use** erzwungen (`tools` + `tool_choice`), Text-Parsing nur als Fallback.
- Code: `callAnthropic()` in `src/ai/generate.js`.

---

## 2. Mistral – direkt

**Key besorgen:** [console.mistral.ai](https://console.mistral.ai/api-keys) → anmelden →
unter **Billing/Plans** Zahlungsweg hinterlegen (Pay-as-you-go) → **API Keys → Create new key** → kopieren.

**Im Dialog:** Anbieter „Mistral" wählen, Key einfügen, Modell wählen (Large / Medium / Small – `*-latest`-Aliase, lösen automatisch auf die aktuelle Version auf).

**Technik (für Entwickler):**
- Endpunkt: `POST https://api.mistral.ai/v1/chat/completions` (OpenAI-kompatibel)
- Header: `Authorization: Bearer <key>`
- Body: `messages:[{role:'system',…},{role:'user',…}]`, `response_format:{ type:'json_object' }`
- JSON-Modus garantiert gültiges JSON (Syntax), nicht das Schema → wir validieren clientseitig (`parseDeck`).
- Code: `callMistral()` in `src/ai/generate.js`.

---

## 3. OpenAI (GPT) – nur über Proxy

**Warum nicht direkt?** `api.openai.com` sendet für authentifizierte Routen **keine CORS-Header**.
Ein Browser-Aufruf wird deshalb geblockt (`TypeError: Failed to fetch`). Der SDK-Schalter
`dangerouslyAllowBrowser: true` hebt nur die SDK-Warnung auf, nicht die Server-CORS-Sperre.
Ein direkter Einbau in den Dialog ist damit **nicht möglich.**

Zwei Wege, OpenAI trotzdem zu nutzen:

**a) Externe Route (ohne Code):** Das Briefing aus [EXTERNES-DECK-BRIEFING.md](EXTERNES-DECK-BRIEFING.md)
in ChatGPT einfügen → JSON kopieren → im Editor **Deck ▾ → „Deck einfügen (Text)"**. Kein Key in der App.

**b) Kleiner Proxy (ein Backend):** Ein serverseitiger Endpunkt hält den Key und leitet an OpenAI weiter.
Minimalbeispiel (Cloudflare Worker):

```js
export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const body = await req.text();
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_KEY}` }, // Key als Worker-Secret
      body,
    });
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json', ...cors } });
  },
};
```

Im Editor würde man dann einen Anbieter „OpenAI (Proxy)" ergänzen, der statt `api.openai.com`
die Proxy-URL aufruft (ohne Key im Browser – den hält der Worker). Kosten trägt der Key-Inhaber.

---

## Neuen Anbieter ergänzen (z. B. dmGPT)

Im dm-Umfeld (GitLab, dmGPT) würde man den passenden Connector direkt einbauen. Muster:

1. In `src/ai/generate.js` unter `PROVIDERS` einen Eintrag mit `label`, `defaultModel`, `models` anlegen.
2. Eine `callXxx(apiKey, model, system, usr)`-Funktion schreiben (Endpunkt, Header, Body) und in
   `generateDeck()` per `provider` abzweigen. Rückgabe ist das Deck-Objekt (über `parseDeck` validiert).
3. In `src/ui/ui.js` unter `PROVIDER_UI` Platzhalter + Hilfetext (wo gibt's den Key) ergänzen.

Ist der jeweilige Endpunkt CORS-fähig (wie Anthropic/Mistral), läuft es direkt im Browser.
Wenn nicht (wie OpenAI), braucht es einen Proxy wie oben.
