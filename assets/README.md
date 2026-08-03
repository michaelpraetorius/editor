# assets/

Eigene Marken-Assets für den Editor. Werden beim Start automatisch geladen
(Verzeichnis-Listing des Dev-Servers; Fallback `assets/manifest.json`).

```
assets/
  backgrounds/   → Hintergrund der Slides   (.jpg / .png / .webp)
  overlays/      → Overlay/DNA (transparent) (.png)
  artwork/       → Artwork/Cliparts (als Bild einfügbar)
```

- **Hintergrund** liegt unten (Gradient ~23 % über Weiß), das transparente **Overlay**
  darüber; **Artwork** wird als Bild-Element eingefügt (verschieben/skalieren/löschen,
  Rechtsklick für die Ebene, Background-Eraser für weiße Ränder).
- Eigene Dateien einfach in den jeweiligen Ordner legen und die Seite neu laden.
  Dateinamen sind egal (Umlaute erlaubt), Reihenfolge folgt dem Namen.
- Overlay-PNGs und Artwork sollten **transparent** sein.

> Hinweis: Die eigentlichen Bilddateien sind per `.gitignore` vom Repo ausgeschlossen
> (Markenmaterial). Im Repo liegt nur die Ordnerstruktur.
