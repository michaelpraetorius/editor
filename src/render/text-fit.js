// Textsatz-Helfer für Canvas. Vier Textrollen nach dem Screenshot-Prinzip:
// kicker (Serif kursiv, Lime, oben) · headline (weiß, groß) ·
// subline (Lime, fett) · body (weiß). Konva übernimmt den Wortumbruch,
// wir regeln nur die Schriftgröße per Auto-Fit.

// fontKey: display (Marken-Schrift) | body (Inter). Farbe kommt pro Slide aus slide.textColor.
export const TYPE = {
  kicker:   { size: 30, weight: '600', lh: 1.25, spacing: 0,  fontKey: 'body' },
  headline: { size: 92, weight: '700', lh: 1.04, spacing: -1, fontKey: 'display' },
  subline:  { size: 42, weight: '700', lh: 1.2,  spacing: 0,  fontKey: 'display' },
  body:     { size: 34, weight: '400', lh: 1.4,  spacing: 0,  fontKey: 'body' },
};

// Verkleinert die Schrift, bis der Text in maxHeight passt (nie vergrößern).
export function fitFontSize(konvaText, baseSize, maxHeight, minSize = 18) {
  let size = baseSize;
  konvaText.fontSize(size);
  if (!maxHeight || konvaText.height() <= maxHeight) return { size, fitted: false };
  while (size > minSize) {
    size -= 2;
    konvaText.fontSize(size);
    if (konvaText.height() <= maxHeight) return { size, fitted: true };
  }
  return { size: minSize, fitted: true };
}
