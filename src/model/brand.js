// Markenwerte: Textfarben (kräftige Kontrastfarben aus der Pastell-/Markenwelt)
// und die Marken-Schrift. Zentral, damit leicht anpassbar.

// Marken-Display-Schrift: Name der LOKAL installierten Schrift hier eintragen.
// Fallback ist Inter, solange die Schrift nicht installiert ist.
export const BRAND_DISPLAY = 'Brand Display';
export const DISPLAY_FONT = `'${BRAND_DISPLAY}', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
export const BODY_FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Umschaltbare Textfarben (Kontrast zu den hellen Gradienten).
export const TEXT_COLORS = [
  { id: 'blau',      hex: '#1f6fb2' },
  { id: 'dunkelblau',hex: '#164193' },
  { id: 'magenta',   hex: '#e5007d' },
  { id: 'rot',       hex: '#e2334a' },
  { id: 'orange',    hex: '#ef7d00' },
  { id: 'teal',      hex: '#2c9a86' },
  { id: 'lila',      hex: '#7d4a9e' },
  { id: 'anthrazit', hex: '#2b2b3a' },
];

export const DEFAULT_TEXT_COLOR = '#1f6fb2';   // Marken-Blau (Default)
