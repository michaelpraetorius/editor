# Deck speichern & importieren

Kurzanleitung zum Sichern und Weitergeben von Decks – ohne KI-Key, ohne Asset-Ordner.

Editor: **https://michaelpraetorius.github.io/editor/**

---

## Deck speichern (Download)

**Deck ▾ → „Deck speichern (Datei, mit Assets) …"**

Es wird eine Datei heruntergeladen: **`<titel>.deck.json`**. Sie enthält **alles**:
- das Layout (Format, pro Folie Hintergrund/Overlay/Artwork, Textfarben, Positionen)
- **die verwendeten Bilder eingebettet** (Hintergrund als JPEG, Overlays/Artwork als PNG)

Dadurch ist die Datei **vollständig und portabel** – sie funktioniert auf jedem Rechner
und auch auf der gehosteten Version, ganz ohne separaten Asset-Ordner.

> Hinweis: Die Datei kann einige MB groß werden (die Bilder stecken ja drin). Die Größe
> wird dir nach dem Speichern kurz angezeigt.

---

## Deck importieren – diese Formate gehen

Alle Wege liegen unter **Deck ▾**. Importiert wird immer **JSON** – in zwei Ausprägungen:

| Format | Was drin ist | Wofür |
|---|---|---|
| **`.deck.json`** (aus „Deck speichern") | Layout **+ eingebettete Bilder** | fertiges Deck weitergeben / sichern |
| **`deck.json`** (nur Text) | nur Texte (+ ggf. Layout), **ohne** Bilder | KI-/Briefing-Ausgabe; Bilder werden beim Laden automatisch belegt |

### Drei Import-Wege

1. **Datei wählen:** Deck ▾ → **„Deck importieren …"** → `.deck.json` oder `.json` auswählen.
2. **Reinziehen:** eine `.json`-Datei einfach **per Drag & Drop** in die App ziehen.
3. **Text einfügen:** Deck ▾ → **„Deck einfügen (Text) …"** → JSON reinkopieren (verträgt auch
   Code-Fences wie ```` ```json ```` und Text drumherum).

Nach dem Import ist die Vorschau sofort gefüllt. Bei einem reinen `deck.json` ohne Bilder
setzt der Editor Hintergrund und Overlay automatisch; bei einer `.deck.json` kommen die
gespeicherten Bilder mit.

---

## Typischer Ablauf zum Weitergeben

1. Deck fertig gestalten.
2. **„Deck speichern (Datei, mit Assets)"** → `.deck.json` herunterladen.
3. Datei weitergeben (z. B. per Mail oder geteiltem Ordner).
4. Empfänger: Editor öffnen → **„Deck importieren"** → Datei wählen. Fertig – alles da,
   **kein KI-Key und kein Asset-Ordner nötig.**
