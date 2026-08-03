# Agent-Briefing — Content-Pipeline-Editor

Dieses Dokument erklärt einem KI-Agenten, **wozu diese Anwendung gedacht ist** und
**wie er sie in einer automatisierten Content-Pipeline einsetzt** (Code aus GitLab,
Assets aus SharePoint, Texte KI-generiert → fertige Vorschau/Export).

---

## 1. Was ist das? (Zweck)

Eine **reine Browser-App ohne Backend**, die aus einer Datenstruktur (`deck.json`)
fertige, markenkonforme Content-Slides rendert (Hintergrund-Gradient + transparentes
DNA-Overlay + Text im festen Layout) und als **PNG / PDF / MP4** exportiert.

**Kernprinzip — bitte verinnerlichen:**
> `deck.json` ist die **einzige Wahrheit**. Der Agent bedient **nicht** die Oberfläche
> und baut **kein** Layout. Er erzeugt/verändert ausschließlich `deck.json` — Layout,
> Typografie, Marken-Look, Animation und Export liefert die App.

Das macht die Automatisierung robust: Der Agent ist ein **Text-/Daten-Generator**,
kein UI-Roboter.

---

## 2. Bestandteile & Herkunft

| Baustein            | Herkunft                        | Rolle |
|---------------------|---------------------------------|-------|
| **Applikation/Code**| Git (intern: **GitLab**)        | Der Editor selbst. Enthält KEINE Assets. |
| **Marken-Assets**   | **SharePoint**                  | Hintergründe, Overlays (DNA), Artwork. |
| **Texte**           | **KI-generiert** vom Agenten    | Kommen als `deck.json` in die App. |

Die Assets sind bewusst **nicht im Git** (per `.gitignore` ausgeschlossen). Im Repo
liegt nur die Ordnerstruktur. Der Agent befüllt sie zur Laufzeit aus SharePoint.

---

## 3. Der Workflow (Ziel)

```
Nutzer-Input:  Thema + Zielgruppe + Tonalität + Struktur
      │
      ▼
1. Agent holt die APP aus dem GitLab           (git clone/pull)
2. Agent holt die ASSETS aus SharePoint    →   assets/backgrounds|overlays|artwork/
3. Agent GENERIERT die Texte (KI)          →   passend zu Thema/Zielgruppe/Tonalität/Struktur
4. Agent schreibt daraus ein  deck.json
5. App lädt deck.json                       →  FERTIGE VORSCHAU (Slides im Marken-Look)
6. Export PNG / PDF / MP4
```

Der Agent muss also drei Dinge zusammenbringen: **Code (Git)**, **Assets (SharePoint)**
und **Texte (KI) → deck.json**.

---

## 4. Was der Agent produzieren muss: `deck.json`

Der Agent füllt vor allem **Textfelder + Rolle** pro Slide. Hintergrund und Overlay
werden von der App **automatisch** aus den Asset-Ordnern belegt (reihum) — der Agent
muss sie nur setzen, wenn er gezielt steuern will.

Minimalbeispiel (die App ergänzt fehlende Felder mit Defaults):

```json
{
  "meta":  { "title": "7 Signale für besseren Schlaf",
             "structure": "listicle", "format": "4-5", "lang": "de" },
  "theme": { "id": "radunff", "motion": "calm" },
  "slides": [
    { "role": "hook",
      "kicker": "SCHLAF",
      "headline": "7 Signale, dass dein Schlaf besser wird",
      "subline": "Kleine Zeichen, große Wirkung.",
      "body": "Woran du merkst, dass du auf dem richtigen Weg bist." },
    { "role": "item",
      "kicker": "01",
      "headline": "Du wachst vor dem Wecker auf",
      "subline": "Der Körper rhythmisiert sich.",
      "body": "Ein Zeichen für einen stabilen Schlafzyklus." }
  ]
}
```

### Textrollen pro Slide (Reihenfolge = so gerendert, vertikal zentriert)
| Feld       | Bedeutung        | Richtwert Zeichen | Hinweis |
|------------|------------------|-------------------|---------|
| `kicker`   | Dachzeile/Eyebrow| 12–48             | kurz, Label-artig |
| `headline` | Kernaussage      | 12–48             | größte, wichtigste Zeile |
| `subline`  | Zuspitzung       | 12–60             | ergänzt die Headline |
| `body`     | kurzer Fließtext | 40–200            | ein bis zwei Sätze |

Der Textblock **wächst aus der Mitte** (nach oben und unten). Sehr lange Texte werden
automatisch etwas verkleinert, damit sie in die Safe-Area passen — trotzdem sollten
die Richtwerte eingehalten werden, sonst wirkt es überladen.

### Rollen & Struktur
- `role`: `hook` | `context` | `item` | `cta`
- `meta.structure`: z. B. `"listicle"` → Reihenfolge **hook → context → n×item → cta**.
  Der Agent bestimmt Anzahl/Abfolge der Slides über die vom Nutzer gewählte Struktur.
- `meta.format`: `"9-16"` (Reel/Story) | `"4-5"` (Feed) | `"1-1"` (Square).

### Optional (nur bei gezielter Steuerung)
- `slides[].background.assetId` / `slides[].overlay` — sonst automatisch belegt.
- `slides[].colors` — Textfarbe je Feld aus der Marken-Palette (Default: Marken-Blau).
- `slides[].decor` — Artwork-Elemente (Bild-IDs aus `assets/artwork/`).

---

## 5. Assets aus SharePoint bereitstellen

Der Agent lädt die Marken-Dateien aus SharePoint und legt sie lokal ab:

```
assets/
  backgrounds/   → Hintergründe        (.jpg/.png)
  overlays/      → DNA-Overlays         (.png, transparent)
  artwork/       → Cliparts/Artwork     (.png, transparent)
```

Die App **erkennt sie automatisch** beim Start (Verzeichnis-Listing des Dev-Servers;
Fallback: `assets/manifest.json`). Kein Registrieren/Umbenennen nötig — reinlegen genügt.

> Offene Entscheidung (mit dem Team zu klären): Ob der SharePoint-Sync **direkt in
> diese Ordner** schreibt (empfohlen, keine Code-Änderung nötig) oder ob ein
> **konfigurierbarer Asset-Pfad** in den App-Einstellungen sinnvoller ist (falls die
> Assets in einem separaten SharePoint-Sync-Ordner liegen). Siehe Abschnitt 7.

---

## 6. Vorschau & Export

- **Starten:** `python3 serve.py 4599` → `http://localhost:4599/index.html`
  (reine Browser-App, kein Backend; MP4-Export nur in Chrome/Edge = WebCodecs).
- **Vorschau:** sobald `deck.json` geladen ist, steht die fertige, animierte Vorschau.
- **Export:** Button „Export" → PNG (aktuelle/alle Folien), PDF, Video (MP4).

> Für **vollautomatischen** Export ohne Mensch am Rechner wäre ein Headless-Browser
> (z. B. Puppeteer/Playwright, der `serve.py` startet, `deck.json` lädt und exportiert)
> der nächste Schritt. Für die reine Vorschau/Freigabe ist das nicht nötig.

---

## 7. Integrationspunkte & offene Entscheidungen (mit dem Team)

1. **deck.json in die App bekommen.** Aktuell lädt die App ein Beispiel-Deck bzw. den
   letzten Stand aus dem Browser-Speicher. Für die Pipeline braucht es einen klaren
   Einstieg. Empfohlene, kleine Ergänzung (noch nicht gebaut):
   - App liest beim Start eine Datei `deck.json` aus dem Projekt (falls vorhanden), **oder**
   - per URL-Parameter `?deck=<pfad|url>`.
   → Der Agent schreibt das generierte Deck einfach dorthin.
2. **Asset-Pfad.** Standard: fest `assets/{backgrounds,overlays,artwork}/`.
   Falls die Assets woanders liegen müssen, kann der Pfad konfigurierbar gemacht werden.
3. **GitLab statt GitHub.** Identischer Ablauf, nur andere Remote-URL. Assets bleiben
   per `.gitignore` außerhalb des Repos (kommen aus SharePoint).

---

## 8. Was der Agent NICHT tun muss

- Keine UI-Klicks, kein Layout bauen, keine Typografie/Marken-Logik anwenden.
- Keine Assets ins Git legen.
- Er liefert **Struktur + Texte als `deck.json`** und stellt die **Assets** bereit —
  den Rest macht die App.

---

## 9. Vollständige `deck.json`-Referenz (für den System-Prompt)

Die App **normalisiert** jedes Deck: fehlende Felder werden mit Defaults ergänzt. Der Agent
muss also nur setzen, was er steuern will — **Pflicht ist praktisch nur `slides[]` mit Texten
+ `role`**. Ungültige/fehlende Felder brechen nichts.

### Top-Level
```jsonc
{
  "meta": {
    "title":     "string",                 // frei
    "structure": "listicle",               // Bauplan (bestimmt Rollen-Abfolge)
    "format":    "9-16" | "4-5" | "1-1",   // Default "9-16"
    "lang":      "de"                       // Default "de"
  },
  "theme": {
    "id":     "radunff" | "ink-light",     // Default "radunff" (heller Marken-Look)
    "motion": "calm" | "punchy"            // Default "calm" (edles Gegenläufig-Zoom)
  },
  "brand": { "show": false },              // Platzhalter-Logo aus (Default)
  "slides": [ /* siehe unten */ ]
}
```

### Ein Slide
```jsonc
{
  "role":     "hook" | "context" | "item" | "cta",   // inhaltliche Rolle
  "kicker":   "string",   // Dachzeile   · 12–48 Zeichen
  "headline": "string",   // Kernaussage · 12–48 Zeichen
  "subline":  "string",   // Zuspitzung  · 12–60 Zeichen
  "body":     "string",   // Fließtext   · 40–200 Zeichen

  // --- ab hier alles OPTIONAL (nur bei gezielter Steuerung) ---
  "colors":   { "headline": "#1f6fb2", "subline": "#164193" },  // Textfarbe je Feld
  "background": { "assetId": "bg-<dateiname>" },                 // sonst auto (reihum)
  "overlay":    { "assetId": "ov-<dateiname>", "opacity": 0.45 },// sonst auto; null = keins
  "scrim":    0,                                                 // 0..1 Abdunklung (Default 0)
  "decor": [                                                     // Artwork-Elemente
    { "assetId": "art-<dateiname>", "x": 0.5, "y": 0.5,
      "scale": 1, "rot": 0, "opacity": 1, "layer": "mid" }       // layer: back|mid|front
  ]
}
```

### Erlaubte Werte / Konstanten
- **format:** `9-16` (Reel/Story), `4-5` (Feed), `1-1` (Square).
- **role:** `hook`, `context`, `item`, `cta`.
- **structure:** aktuell `listicle` → Abfolge **hook → context → n×item → cta**.
- **theme.id:** `radunff` (Default, hell), `ink-light`.
- **motion:** `calm` (Default), `punchy`.
- **Textfarben (Marken-Palette, für `colors`):**
  `#1f6fb2` (Marken-Blau, Default), `#164193` (Dunkelblau), `#e5007d` (Magenta),
  `#e2334a` (Rot), `#ef7d00` (Orange), `#2c9a86` (Teal), `#7d4a9e` (Lila), `#2b2b3a` (Anthrazit).

### Asset-IDs (wenn gezielt gesetzt)
IDs werden aus dem **Dateinamen** abgeleitet, mit Präfix:
- Hintergrund: `bg-<slug>`  (Datei in `assets/backgrounds/`)
- Overlay:     `ov-<slug>`  (Datei in `assets/overlays/`)
- Artwork:     `art-<slug>` (Datei in `assets/artwork/`)

`<slug>` = Dateiname ohne Endung, kleingeschrieben, Sonderzeichen → `-`.
Beispiel: `Verlauf_Blau.jpg` → `bg-verlauf-blau`.
**Empfehlung:** Hintergrund/Overlay **nicht** manuell setzen — die App belegt sie
automatisch reihum aus dem Ordner. Nur Artwork (`decor`) wird bewusst gesetzt.

### Feld-Richtwerte (Zeichen) — Zusammenfassung
| Feld | min | max |
|------|-----|-----|
| kicker | 12 | 48 |
| headline | 12 | 48 |
| subline | 12 | 60 |
| body | 40 | 200 |

Der Textblock ist **vertikal zentriert** und wächst aus der Mitte; bei Überlänge greift ein
sanftes Auto-Verkleinern. Die Richtwerte trotzdem einhalten — sonst wirkt die Slide überladen.
