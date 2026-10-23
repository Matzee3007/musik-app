---
titel: "ADR 0007: Keine Songliste vor dem Spiel"
status: akzeptiert
erstellt: 2026-10-23
tags: [adr, architektur, erscheinungsjahr, vorbereiten]
---

# ADR (Architecture Decision Record) 0007: Keine Songliste vor dem Spiel

## Kontext

Nach dem Vorbereiten zeigte der Tisch bisher die ganze Playlist als Tabelle: Titel, Interpret, Spotify- und
MusicBrainz-Jahr, ein Feld zum Korrigieren und den Hinweis „nicht gefunden“ oder „später als Spotify“. So konnte der DJ
fragliche Jahre vor dem Spiel prüfen.

Der DJ spielt aber selbst mit. Wer die Liste ansieht, kennt danach Titel und Jahre und damit die Lösungen. Am Laptop,
der als Tisch für alle sichtbar steht, sehen die Mitspieler die Liste ebenfalls. Korrigieren lässt sich das Jahr
außerdem schon in der Auflösung jeder Runde („Jahr korrigieren“), die Korrektur gilt ab dann für die Playlist.

## Entscheidung

- Nach dem Vorbereiten zeigt der Tisch keine Songs mehr, nur „<n> Songs bereit, <m> übersprungen“, „Spiel starten“
  und, falls es welche gibt, „<n> Songs mit unsicherem Jahr. Prüfe es bei der Auflösung.“
- Unsicher ist ein Jahr, das `markierung` aus `lib/erscheinungsjahr.ts` kennzeichnet (nicht gefunden oder später als
  Spotify) und das der DJ noch nicht korrigiert hat. Gezählt wird mit `unsichereJahre` aus `lib/vorbereiten.ts`.
- Korrigiert wird nur noch in der Auflösung.

## Alternativen

- **Liste wie bisher:** verrät dem DJ und allen am Tisch die Lösungen. Verworfen.
- **Liste nur der fraglichen Songs:** verrät weniger, aber genau die Songs, über die man in der Runde nachdenkt.
  Verworfen.
- **Liste hinter einem Knopf „Zeigen“:** Der DJ müsste sich bewusst nicht spoilern, am Tisch sieht trotzdem jeder mit.
  Mehr Oberfläche für wenig Nutzen. Verworfen.

## Konsequenzen

- Ein falsches Jahr fällt erst in der Runde auf, in der der Song läuft. Der DJ korrigiert es dann in der Auflösung,
  die Spieler prüfen wie immer selbst ([[0002-spieler-pruefen-selbst|ADR 0002]]).
- Eine Korrektur in der Auflösung gilt ab dann für die Playlist, beim nächsten Spiel ist das Jahr sicher.
- `app/ui/songliste.tsx` und ihr Test entfallen. Prinzip 4 der `CLAUDE.md` nennt die Korrektur in der Auflösung.
