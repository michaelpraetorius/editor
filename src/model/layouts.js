// Layout-Varianten (Konzept 5.4). Jedes Layout definiert nur, WO der Textblock
// (kicker/headline/body) innerhalb der Safe-Area sitzt. Ein Layout, drei Zuschnitte.
// anchor: vertikale Ausrichtung des Textblocks; align: horizontale Textausrichtung.

export const LAYOUTS = {
  'text-bottom': { id: 'text-bottom', label: 'Text unten',  anchor: 'bottom', align: 'left' },
  'text-center': { id: 'text-center', label: 'Text mitte',  anchor: 'center', align: 'left' },
  'text-top':    { id: 'text-top',    label: 'Text oben',   anchor: 'top',    align: 'left' },
  'split':       { id: 'split',       label: 'Split',       anchor: 'top',    align: 'left', splitGraphic: true },
};

export const DEFAULT_LAYOUT = 'text-bottom';

export function getLayout(id) {
  return LAYOUTS[id] || LAYOUTS[DEFAULT_LAYOUT];
}
