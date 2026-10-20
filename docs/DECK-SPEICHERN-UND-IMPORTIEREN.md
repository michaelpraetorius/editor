# Deck speichern & importieren

Kurzanleitung zum Sichern und Weitergeben von Decks – ohne KI-Key, ohne Asset-Ordner.

Editor: **https://michaelpraetorius.github.io/editor/**

---

## Deck speichern (Download)

**Export ▾ → „Deck-Datei (ZIP, mit Bildern) …"**

Es wird eine Datei heruntergeladen: **`<titel>.deck.zip`**. Darin steckt **alles**:
- `deck.json` – das Layout (Format, pro Folie Hintergrund/Overlay/Artwork, Textfarben, Positionen)
- ein Ordner **`assets/`** mit den **verwendeten Bildern als echte Dateien** (Hintergrund als JPEG, Overlays/Artwork als PNG)

Die Bilder sind also **echte Dateien im ZIP** (keine kryptischen Data-URLs), das ZIP ist
**komprimiert** und dadurch kleiner. Die Datei ist **vollständig und portabel** – sie
funktioniert auf jedem Rechner und auch auf der gehosteten Version, ganz ohne Asset-Ordner.
Alles passiert im Browser (kein Server).

---

## Deck importieren – diese Formate gehen

Alle Wege liegen unter **Deck ▾**.

| Format | Was drin ist | Wofür |
|---|---|---|
| **`.deck.zip`** (aus „Deck speichern") | Layout **+ Bilder als Dateien** | fertiges Deck weitergeben / sichern |
| **`deck.json`** (nur Text) | nur Texte (+ ggf. Layout), **ohne** Bilder | KI-/Briefing-Ausgabe; Bilder werden beim Laden automatisch belegt |

### Drei Import-Wege

1. **Datei wählen:** Deck ▾ → **„Deck importieren (ZIP oder JSON) …"** → `.deck.zip` oder `.json` auswählen.
2. **Reinziehen:** eine `.zip`- oder `.json`-Datei einfach **per Drag & Drop** in die App ziehen.
3. **Text einfügen:** Deck ▾ → **„Deck einfügen (Text) …"** → JSON reinkopieren (verträgt auch
   Code-Fences wie ```` ```json ```` und Text drumherum). Nur für reines `deck.json` ohne Bilder.

Nach dem Import ist die Vorschau sofort gefüllt. Bei einem reinen `deck.json` ohne Bilder
setzt der Editor Hintergrund und Overlay automatisch; bei einer `.deck.zip` kommen die
gespeicherten Bilder mit.

---

## Typischer Ablauf zum Weitergeben

1. Deck fertig gestalten.
2. **Export ▾ → „Deck-Datei (ZIP, mit Bildern)"** → `.deck.zip` herunterladen.
3. Datei weitergeben (z. B. per Mail oder geteiltem Ordner).
4. Empfänger: Editor öffnen → **„Deck importieren"** → die `.deck.zip` wählen. Fertig – alles da,
   **kein KI-Key und kein Asset-Ordner nötig.**
