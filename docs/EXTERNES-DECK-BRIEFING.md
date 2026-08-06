# Briefing: Deck für den Editor erzeugen (ohne API-Key)

Dieses Dokument gibst du einer **beliebigen KI** (Claude-Projekt, ChatGPT, o. Ä.).
Die KI liefert ein **deck.json**, das du im Editor über **Deck ▾ → „Deck einfügen (Text)"**
einfügst (oder als Datei über „Deck importieren"). Kein API-Key nötig – die App rendert
Marke, Layout, Hintergrund und Animation automatisch aus den Texten.

Kopiere alles **unterhalb der Linie** in die andere KI (plus dein Thema/Quelltext).

---

## Deine Aufgabe
Du erzeugst die **Texte** für markenkonforme Social-Media-Slides. Deine Ausgabe ist
ausschließlich ein **JSON-Objekt** (deck.json).

## Ausgabe-Format – WICHTIG
- Gib **NUR das JSON-Objekt** aus. Kein Fließtext, keine Erklärung, **keine Code-Fences** (kein ```), kein Markdown.
- Das JSON muss gültig sein (doppelte Anführungszeichen, keine Kommentare, kein Komma nach dem letzten Element).

## Struktur
```
{
  "meta": { "title": "<kurzer Deck-Titel>" },
  "slides": [
    { "role": "hook", "kicker": "<Dachzeile>", "headline": "<Kernaussage>", "subline": "<optional, darf leer sein>", "body": "<1–2 Sätze>" }
  ]
}
```

## Felder pro Slide
- **role**: grobe Rolle der Folie – `hook` (Einstieg), `context` (Einordnung), `item` (Punkt), `cta` (Handlungsaufruf).
- **kicker**: kurze Dachzeile / Kategorie, eine Zeile.
- **headline**: die zentrale Aussage der Folie.
- **subline**: optionale Zwischenzeile (darf `""` sein).
- **body**: ein bis zwei konkrete Sätze.
- **Sonst nichts setzen** – keine Hintergründe, Farben, Formate, Assets. Das ergänzt der Editor automatisch.

## Umfang & Länge
- **3–6 Folien**, ein Gedanke pro Folie. Erste Folie = Einstieg (`hook`), letzte darf `cta` sein.
- Richtwerte (das Layout fittet automatisch, aber halte dich grob daran):
  kicker kurz (bis ~48 Zeichen), headline stark und knapp, subline bis ~60 Zeichen, body ~40–200 Zeichen.
- Wenn ich einen langen Text liefere (z. B. eine Pressemitteilung): die **Kernaussagen herausziehen** und verdichten, nicht 1:1 übernehmen.

## Sprache & Ton
- Deutsch, außer ich verlange etwas anderes.
- Klar, konkret, nahbar. Wenn nichts anderes vorgegeben ist: natürliche, gesprochene Sprache (kurze Sätze, direkte Ansprache).

## So NICHT texten (verbindliche Negativ-Vorgaben)
- Keine Vergleichs-/Kontrastfloskeln: „nicht nur … sondern auch …", „es geht nicht um X, sondern um Y", „das ist nicht einfach …, sondern …".
- Keine künstlich-inklusiven Aufzählungen: „egal ob Anfänger:in oder Profi", „ganz gleich, ob …", „für Jung und Alt".
- Keine übertriebenen Verstärker: „absolut", „definitiv", „zweifellos", „essentiell", „äußerst".
- Keine pauschalen Überleitungen: „zusammenfassend lässt sich sagen", „am Ende des Tages", „letztendlich bedeutet das".
- Keine generischen Versprechen: „macht dein Leben einfacher", „ein Must-have für alle", „genau das brauchst du".
- Keine überkorrekten Floskeln: „in der heutigen Zeit", „es ist wichtig zu betonen, dass", „man könnte argumentieren, dass".
- Keine Emojis (auch nicht als Aufzählungszeichen oder Betonung), keine Hashtags.
- Keine Gedankenstriche als Effekt für Pointen (z. B. „… – und genau das ist der Punkt"). Stattdessen kurze, direkte Sätze.

## Beispiel einer gültigen Ausgabe
```
{
  "meta": { "title": "Zyklus verstehen" },
  "slides": [
    { "role": "hook", "kicker": "Kurz erklärt", "headline": "Was sich im Zyklus verändert", "subline": "Ein ruhiger Blick auf vier Wochen", "body": "Hormone bewegen sich in einem Rhythmus. Wer ihn kennt, ordnet vieles im Alltag leichter ein." },
    { "role": "item", "kicker": "Woche 1", "headline": "Der Start", "subline": "", "body": "Der Körper beginnt neu. Energie kommt langsam zurück." },
    { "role": "cta", "kicker": "Dein Zug", "headline": "Hör auf deinen Rhythmus", "subline": "", "body": "Schon kleine Anpassungen im Alltag helfen spürbar." }
  ]
}
```

Gib jetzt nur das JSON aus. Mein Thema / Quelltext:
[HIER dein Thema oder deinen Text einfügen]
