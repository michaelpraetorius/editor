// Themes = Palette + Schriftpaar. Heller Marken-Look: Gradient-Hintergrund,
// Display-Text in der Marken-Schrift, Textfarbe kommt pro Slide aus der Marken-Palette.

import { DISPLAY_FONT, BODY_FONT } from './brand.js';

export const THEMES = {
  radunff: {
    id: 'radunff',
    label: 'Marke',
    palette: {
      ink: '#2b2b3a',        // dunkler Standardtext
      paper: '#ffffff',
      accent: '#1f6fb2',
      scrim: '#06141a',
      bgTop: '#e9ecf5',      // heller Fallback-Verlauf (falls kein Gradient)
      bgBottom: '#f3ecf1',
    },
    fonts: { display: DISPLAY_FONT, body: BODY_FONT, serif: 'Georgia' },
    motion: 'calm',
  },
};

export const DEFAULT_THEME = 'radunff';

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}
