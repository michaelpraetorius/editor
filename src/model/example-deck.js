// Beispiel-Deck: nur Textinhalte. Hintergrund (Gradient + DNA) wird beim Start
// automatisch aus dem Ordner /assets belegt. Keine Elemente, kein Logo.

export const EXAMPLE_DECK = {
  meta: { title: 'Demo', structure: 'listicle', format: '4-5', lang: 'de' },
  theme: { id: 'radunff', motion: 'calm' },
  brand: { show: false },
  slides: [
    { role: 'hook',
      kicker: 'Und diesen Text liest du ganz am Schluss.',
      headline: 'Diesen Text liest du zuerst. Dann geht dein Blick weiter nach unten. Und landet schließlich hier.',
      subline: 'Und dann liest du diesen Satz hier. Er steht bewusst etwas kleiner. So entsteht eine klare Reihenfolge.',
      body: 'Danach liest du diesen Abschnitt.' },

    { role: 'context',
      kicker: 'Kurz vorweg',
      headline: 'Die Reihenfolge steuert das Auge.',
      subline: 'Größe schlägt Position.',
      body: 'Der größte Block wird zuerst gelesen — unabhängig davon, wo er steht.' },

    { role: 'item',
      kicker: '01',
      headline: 'Ein Gedanke pro Slide.',
      subline: 'Nicht zwei, nicht drei.',
      body: 'Wer alles sagt, sagt nichts. Eine Aussage, klar gesetzt.' },

    { role: 'item',
      kicker: '02',
      headline: 'Kontrast macht Text lesbar.',
      subline: 'Hell auf dunkel.',
      body: 'Der Verlauf trägt die Schrift — dazu die DNA als Struktur darüber.' },

    { role: 'cta',
      kicker: 'Dein Zug',
      headline: 'Jetzt bist du dran.',
      subline: 'Gradient und DNA pro Slide wählen.',
      body: 'Alles direkt auf der Slide.' },
  ],
};
