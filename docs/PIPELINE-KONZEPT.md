# Content-Pipeline — Vorhaben & Zusammenfassung

**Für:** die interne KI / das Entwicklungsteam beim Kunden
**Zweck dieses Dokuments:** erklären, *was wir vorhaben*, wie die Teile zusammenspielen
(GitLab, SharePoint, KI) und *was wir von eurer Seite brauchen*.
Das technische „Wie" für den Agenten steht in **[AGENT.md](../AGENT.md)**.

---

## 1. Ausgangslage — was bereits existiert

Wir haben einen **fertigen, browserbasierten Slide-Editor** gebaut (reine Web-App, kein
Backend). Er rendert aus einer Datenstruktur (`deck.json`) **markenkonforme Content-Slides**
(Hintergrund-Gradient + transparentes Overlay + Text im festen Marken-Layout)
und exportiert **PNG / PDF / MP4**.

- Der Code liegt aktuell in einem privaten Git-Repo und soll **in euer internes GitLab**
  überführt werden.
- Die **Marken-Assets** (Gradienten, DNA-Overlays, Artwork) sind **bewusst nicht im Code** —
  sie liegen bei euch in **SharePoint**.

---

## 2. Das Ziel (Vision)

Eine **automatisierte Content-Pipeline**:

> Ein Nutzer gibt **Thema, Zielgruppe, Tonalität und Struktur** ein → eine **KI erzeugt
> die Texte** → daraus entsteht **sofort eine fertige, markenkonforme Vorschau** (mehrere
> Slides), die exportiert werden kann — **ohne manuelles Layouten**.

Der Mensch liefert Idee und Freigabe; Marke, Layout, Typografie, Animation und Export
kommen automatisch.

---

## 3. Warum das sauber funktioniert (Kernidee)

Die App ist **datengetrieben**: `deck.json` ist die **einzige Wahrheit**. Die KI muss also
**keine Oberfläche bedienen** und **kein Layout bauen** — sie erzeugt nur die Daten (Struktur
+ Texte). Alles Visuelle liefert die App deterministisch aus dem `deck.json`.

Das macht die Automatisierung robust und wartungsarm: der Agent ist ein **Text-/Daten-Generator**,
kein UI-Roboter.

---

## 4. Der geplante Ablauf & die Rollen der Systeme

```
Nutzer-Input:  Thema + Zielgruppe + Tonalität + Struktur
      │
      ▼
[ GitLab ]     → liefert die Applikation (Code)          → Agent: git clone/pull
[ SharePoint ] → liefert die Marken-Assets               → Agent legt sie in assets/…
[ KI/Agent ]   → erzeugt die Texte passend zum Input     → schreibt deck.json
[ App ]        → rendert daraus die fertige Vorschau      → Export PNG/PDF/MP4
```

| System        | Rolle |
|---------------|-------|
| **GitLab**    | Versionierung & Bereitstellung der App (Code, ohne Assets). |
| **SharePoint**| Quelle der Marken-Assets (Hintergrund / Overlay / Artwork). |
| **KI/Agent**  | Wandelt Nutzer-Input in Struktur + Texte → `deck.json`. |
| **App**       | Rendert Vorschau, wendet Marke/Layout/Animation an, exportiert. |

---

## 5. Aufgabe der internen KI / des Agenten

1. **App holen** aus dem GitLab.
2. **Assets holen** aus SharePoint → in `assets/{backgrounds, overlays, artwork}/` ablegen.
3. **Texte generieren** (Thema + Zielgruppe + Tonalität + Struktur) und als **`deck.json`**
   schreiben — pro Slide die Felder *kicker / headline / subline / body* + *role*.
   (Feldbedeutung, Zeichen-Richtwerte und ein Beispiel: siehe **AGENT.md**, Abschnitt 4.)
4. **Vorschau/Export** anstoßen.

Der Agent liefert also **Struktur + Texte + Assets** — den Rest macht die App.

---

## 6. Was wir gemeinsam klären / von eurer Seite brauchen

1. **GitLab-Repo:** In welches interne Repo spiegeln wir den Code? Zugang/Rechte für den Agenten.
2. **SharePoint-Zugriff:** Wo genau liegen die Marken-Assets, und **wie kommt der Agent dran**
   (Sync-Ordner, Graph-API, o. Ä.)? Empfehlung: der Sync/Abzug schreibt **direkt** in die drei
   Asset-Ordner der App — dann ist keine Code-Anpassung nötig (die App erkennt Assets automatisch).
3. **`deck.json`-Übergabe:** Kleiner Einstieg in der App, damit ein generiertes Deck **automatisch**
   in die Vorschau geht (App liest `deck.json` beim Start bzw. per URL-Parameter). **Bauen wir.**
4. **Export-Automatisierung:** Für vollautomatischen Export ohne Mensch am Rechner käme ein
   Headless-Browser dazu. Für reine Vorschau/Freigabe nicht nötig — **Bedarf gemeinsam festlegen.**
5. **Asset-Pfad konfigurierbar?** Nur nötig, falls die Assets zwingend außerhalb des Projekts
   liegen müssen. Standard ist der feste Ordner-Aufbau (empfohlen).

---

## 7. Nächste Schritte (Vorschlag)

1. Code aus GitHub ins **interne GitLab** überführen.
2. **SharePoint-Zugriff** auf die Assets klären und den Sync in die Asset-Ordner einrichten.
3. **`deck.json`-Einstieg** in der App ergänzen (klein, von uns).
4. Ersten End-to-End-Durchlauf testen: Input → Texte → `deck.json` → Vorschau → Export.
5. Bei Bedarf **Headless-Export** ergänzen.

---

*Technische Details & Datenschema für den Agenten: siehe [AGENT.md](../AGENT.md).*
