// Bewegungs-Presets als Tokens (Konzept 6). Reine Funktionen: gegeben Preset,
// lokale Zeit t (s) und Slide-Dauer -> Transform-Werte pro Ebene. Keine CSS-Keyframes,
// damit sich jeder Frame per seek(t) exakt reproduzieren lässt (MP4-Export).

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

// Gestaffelter Fade-Up: liefert {opacity, dy} für ein Element mit Verzögerung.
function fadeUp(t, delay, dur, dist) {
  const p = easeOut(clamp01((t - delay) / dur));
  return { opacity: p, dy: (1 - p) * dist };
}
function pop(t, delay, dur) {
  const p = easeOut(clamp01((t - delay) / dur));
  return { opacity: p, scale: 0.6 + p * 0.4 };
}

export const PRESETS = {
  calm: {
    slideDuration: 4.5,
    reveal(t) {
      // Gegenläufiges Mini-Zoom über die gesamte Dauer: Hintergrund fährt langsam
      // heraus, Overlay langsam hinein — wirkt edel und lebendig.
      const p = clamp01(t / this.slideDuration);
      const e = easeOut(p);
      return {
        bg: { scale: 1.06 - e * 0.055, dx: 0, dy: -e * 10 },
        overlay: { dx: 0, dy: e * 8, scale: 1.0 + e * 0.05, opacityMul: 1 },
        kicker: fadeUp(t, 0.0, 0.7, 24),
        headline: fadeUp(t, 0.12, 0.8, 36),
        subline: fadeUp(t, 0.24, 0.8, 28),
        body: fadeUp(t, 0.34, 0.8, 26),
        decor: (i) => fadeUp(t, 0.3 + i * 0.1, 0.8, 20),
      };
    },
  },
  punchy: {
    slideDuration: 3.2,
    reveal(t) {
      const bgP = easeOut(clamp01(t / 1.5));
      const e = easeOut(clamp01(t / this.slideDuration));
      return {
        bg: { scale: 1.15 - bgP * 0.1, dx: 0, dy: 0 },                    // schneller Zoom-in
        overlay: { dx: 0, dy: 0, scale: 1.0 + e * 0.06, opacityMul: 0.9 + Math.sin(t * 3) * 0.1 },
        kicker: fadeUp(t, 0.0, 0.3, 20),
        headline: fadeUp(t, 0.1, 0.4, 30),
        subline: fadeUp(t, 0.2, 0.4, 24),
        body: fadeUp(t, 0.3, 0.4, 22),
        decor: (i) => pop(t, 0.28 + i * 0.12, 0.36),
      };
    },
  },
};

export function getPreset(name) {
  return PRESETS[name] || PRESETS.calm;
}

// End-Zustand (statisch) für prefers-reduced-motion und PNG-Export.
export function staticReveal() {
  return {
    bg: { scale: 1.02, dx: 0, dy: 0 },
    overlay: { dx: 0, dy: 0, scale: 1.0, opacityMul: 1 },
    kicker: { opacity: 1, dy: 0 },
    headline: { opacity: 1, dy: 0 },
    subline: { opacity: 1, dy: 0 },
    body: { opacity: 1, dy: 0 },
    decor: () => ({ opacity: 1, dy: 0, scale: 1 }),
  };
}

export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
