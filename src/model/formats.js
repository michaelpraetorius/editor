// Format-Definitionen. Bezugsbreite immer 1080 px (Konzept 5.5).
// Sperrzonen als normalisierte 0..1-Werte, damit sie mit dem Canvas skalieren.

export const FORMATS = {
  '9-16': {
    id: '9-16',
    label: '9:16',
    w: 1080,
    h: 1920,
    // Reel/Story — UI-Overlays oben/unten/rechts
    safe: { top: 220 / 1920, bottom: 500 / 1920, left: 80 / 1080, right: 180 / 1080 },
  },
  '4-5': {
    id: '4-5',
    label: '4:5',
    w: 1080,
    h: 1350,
    safe: { top: 80 / 1350, bottom: 80 / 1350, left: 80 / 1080, right: 80 / 1080 },
  },
  '1-1': {
    id: '1-1',
    label: '1:1',
    w: 1080,
    h: 1080,
    safe: { top: 80 / 1080, bottom: 80 / 1080, left: 80 / 1080, right: 80 / 1080 },
  },
};

export const DEFAULT_FORMAT = '9-16';

export function getFormat(id) {
  return FORMATS[id] || FORMATS[DEFAULT_FORMAT];
}

// Safe-Rect in Pixeln für ein konkretes Format (x, y, w, h).
export function safeRect(fmt) {
  const x = fmt.safe.left * fmt.w;
  const y = fmt.safe.top * fmt.h;
  const w = fmt.w - (fmt.safe.left + fmt.safe.right) * fmt.w;
  const h = fmt.h - (fmt.safe.top + fmt.safe.bottom) * fmt.h;
  return { x, y, w, h };
}
