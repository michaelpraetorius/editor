// Harte Zeichenlimits (Konzept 3). Warnung statt Abschneiden.
export const LIMITS = {
  kicker:   { min: 12, max: 48, lines: 1 },
  headline: { min: 12, max: 48, lines: 2 },
  subline:  { min: 12, max: 60, lines: 2 },
  body:     { min: 40, max: 200, lines: 4 },
};

export function checkLimit(field, value) {
  const lim = LIMITS[field];
  if (!lim) return { status: 'ok', len: (value || '').length, lim: null };
  const len = (value || '').length;
  let status = 'ok';
  if (len > lim.max) status = 'over';
  else if (len > lim.max * 0.9) status = 'warn';
  return { status, len, lim };
}
