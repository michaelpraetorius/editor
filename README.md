# Content Pipeline Editor v2

Canvas-basierter Editor (Konva) für Listicles / Karussells / Reels. Rein im Browser,
kein Build-Step. `deck.json` ist die einzige Wahrheit — Renderer und alle Exportwege
lesen sie, der Editor verändert sie.

## Starten

```bash
python3 -m http.server 4599
```

Dann http://localhost:4599/index.html öffnen (Chrome/Edge für MP4-Export).
Der Zustand wird per Autosave in `localStorage` gehalten.

## Architektur

```
index.html            App-Shell (Toolbar, Thumbs, Stage, Inspector) + Vendor-Libs
styles.css            UI-Styling
vendor/               Konva, jsPDF, mp4-muxer (lokal vendored)
src/
  main.js             Bootstrap: Fonts/Assets laden, Store/Renderer/UI verdrahten
  core/
    store.js          deck.json-State, Undo/Redo, Autosave, Selektion, Events
    emitter.js        Mini-Event-Emitter
  model/
    schema.js         Normalisierung + Defaults (SCHEMA_VERSION)
    example-deck.js   Handgeschriebenes 10-Slide-Beispiel (Listicle)
    formats.js        9:16 / 4:5 / 1:1 + Sicherheitszonen (0..1)
    themes.js         Palette + Schriftpaar + Motion
    layouts.js        text-bottom / -center / -top / split
    limits.js         Harte Zeichenlimits (Warnung, kein Abschneiden)
    assets.js         Asset-Register (eingebaute SVGs) + Bild-Cache
  render/
    paint.js          REINES Zeichnen des Ebenenstapels z0..z50 bei Zeit t
    renderer.js       Live-Editor: Fit, Drag&Drop, Selektion, Safe-Zones, Timeline
    motion.js         Bewegungs-Presets (calm/punchy), seek(t)-fähig
    text-fit.js       Typo-Defaults + Auto-Fit
  ui/
    ui.js             Toolbar, Thumbnails, Inspector, Timeline, Export-Fortschritt
    inline-edit.js    DOM-Overlay-Texteditor mit Zeichenzähler/Limit
  export/
    offscreen.js      Full-Res-Renderer (nutzt paint.js) für PNG/PDF/MP4
    png.js  pdf.js  mp4.js
```

**Kernprinzip:** `paint.js` wird identisch vom Live-Editor UND vom Export benutzt →
WYSIWYG. Positionen sind 0..1 (überleben Formatwechsel), Assets nur per ID referenziert.

## Status (Konzept-Phasen)

- [x] Phase 1 — Datenmodell, Asset-Register, Themes, Layouts, Beispiel-Deck
- [x] Phase 3 — Canvas-Editor: Format, Text mit Limits, Ebenen, Decor-Drag+Snapping,
      Themes, Scrim, Safe-Zones, PNG + PDF, Undo/Redo, Autosave, JSON I/O
- [x] Phase 4 — Timeline, Motion-Presets, MP4-Export (WebCodecs + mp4-muxer)
- [ ] Phase 2 — Generierung A–D → deck.json (noch offen)

## Bekannte nächste Schritte

- Generierungs-Stufe (Brief → Outline → Copy → deck.json)
- Textblock frei verschiebbar (textOffset ist im Modell, UI-Drag fehlt)
- Eigene Assets hochladen (Register ist bislang eingebaut)
- Audio-Track im MP4 (Muxer-Kette müsste Audio mitnehmen)
- Fonts lokal vendoren (aktuell Google Fonts; für Offline/Export-Garantie)
