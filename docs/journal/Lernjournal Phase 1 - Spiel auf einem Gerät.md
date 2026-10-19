---
titel: Lernjournal Phase 1 - Spiel auf einem Gerät
status: abgeschlossen
phase: 1
erstellt: 2026-10-19
tags: [lernjournal, phase-1, typescript, tdd, vitest, testing-library, react, nextjs, svg]
---

# Lernjournal Phase 1: Spiel auf einem Gerät

Fortsetzung von [[Lernjournal Phase 0 - Projektstart]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].

## Erledigt

- [x] Skill `naechste-session` ergänzt (Ecosystem PR #64): Jeder Punkt der Übergabe kommt in die Übergabe des Ortes,
  an dem er erledigt wird. Ecosystem-Punkte aus dieser Übergabe umgezogen (PR #9), Punkte von sport-fantasy aus der
  Ecosystem-Übergabe dorthin (Ecosystem PR #65, sport-fantasy PR #60)
- [x] Tools für später geprüft: Orca (Design-Modus) und archify passen noch nicht, beide bewusst verschoben
- [x] Phase 1 in zwei Pläne geteilt, Entscheidungen: keine Musik, eine Karte, Songliste schlägt Claude vor
- [x] Plan [[2026-10-19-spiellogik|Plan: Spiellogik]] umgesetzt (PR #10): `lib/` mit Mischen, Kategorien als Daten,
  Rad, Karte, Bingo-Erkennung, Songliste mit 25 Songs (1957 bis 2019), Spielstand und Spielzüge; 29 Tests
- [x] Plan [[2026-10-19-oberflaeche|Plan: Oberfläche Phase 1]] umgesetzt (PR #11): Tisch und Karte nebeneinander,
  Auflösung, Abhaken mit Rückfrage beim Zurücknehmen, Stapel leer → „Von vorn“, Bingo → „Neues Spiel“
- [x] Nach dem ersten Spiel im Browser das grafische Rad nachgerüstet (Wunsch, Vorbild spinthewheel.io): SVG-Scheibe,
  dreht 4 Sekunden und bleibt auf der gewählten Kategorie stehen; zusammen 40 Tests, `npm run build` ohne Fehler
- [x] Glossar: Begriff „Stapel“; `CLAUDE.md`: Repo-Struktur mit `lib/`; Roadmap Phase 1 abgehakt

## Befehle: Testen

```bash
npx vitest run __tests__/lib/zufall.test.ts
npx prettier --write __tests__/ui/spiel-ansicht.test.tsx
npm run check
```

- `npx vitest run <datei>`: nur die Tests einer Datei einmal ausführen. In der Rot-Grün-Schleife schneller als alle
  Tests, und man sieht genau, warum der neue Test rot ist.
- `npx prettier --write <datei>`: eine Datei formatieren. Nötig für Dateien, die per Shell (`cat <<EOF`) entstanden
  sind, weil der Prettier-Hook nur bei den Werkzeugen Write und Edit von Claude greift.
- `npm run check`: vor jedem Commit, fand die unformatierte Testdatei.

## Befehle: App ausprobieren

```bash
npm run build
npm run dev
curl -s localhost:3000 | grep "Spiel starten"
```

- `npm run build`: Produktionsfassung bauen. Findet Fehler, die Tests nicht sehen, z. B. eine falsche Grenze zwischen
  Server und Client. Zeigte `○ /` (statisch vorgerendert), weil die Startseite keinen Zufall enthält.
- `npm run dev`: Entwicklungsserver auf http://localhost:3000, lief im Hintergrund, während ich gespielt habe.
- `curl … | grep`: prüft ohne Browser, ob die Seite antwortet und den Knopf enthält.

## Befehle: Git und GitHub

```bash
gh pr checks 11 -R Matzee3007/musik-app --watch
gh pr view 11 -R Matzee3007/musik-app --json mergeable --jq .mergeable
gh pr merge 11 --merge --delete-branch
```

- `gh pr checks … --watch`: wartet, bis die CI des PRs fertig ist. `-R` wählt das Repo, so geht es auch aus einem
  anderen Ordner (heute für drei Repos: musik-app, claude-ecosystem, sport-fantasy).
- `gh pr view … --jq .mergeable`: erst bei `MERGEABLE` mergen.

## Neu gelernt

### Zufall als Parameter

Funktionen wie `mischen` oder `radDrehen` bekommen den Zufall als Funktion übergeben (`zufall: Zufall = Math.random`).
Im Spiel ist es echter Zufall, im Test ein fester Wert wie `() => 0`. So werden zufällige Abläufe testbar. Mit
`() => 0.999` tauscht das Mischen (Fisher-Yates) gar nichts, damit ließ sich im Test gezielt eine Bingo-Reihe bauen.

### Spielzüge geben unveränderte Objekte zurück

Jeder Spielzug in `lib/spiel.ts` gibt ein neues `Spiel` zurück und ändert das alte nicht. Ist ein Zug nicht erlaubt
(falsche Kategorie, zweites Abhaken, vor der Auflösung), kommt dasselbe Objekt zurück. Der Test prüft das mit
`toBe` (dasselbe Objekt) statt `toEqual` (gleicher Inhalt). React kann damit direkt `setSpiel(zug(spiel))` aufrufen.

### Server- und Client-Komponenten, Hydration

In Next.js sind Seiten zuerst Server-Komponenten. Zustand (`useState`) und Klicks brauchen eine Client-Komponente:
`"use client"` oben in der Datei, alles, was sie importiert, gehört dann auch zum Client. Next.js rendert auch
Client-Komponenten auf dem Server vor; beim Laden im Browser hängt React die Klicks an dieses HTML
(*Hydration*). Würde die Karte schon beim ersten Rendern zufällig ausgeteilt, passten Server-HTML und Browser nicht
zusammen. Deshalb startet das Spiel erst mit dem Klick auf „Spiel starten“.

### Testen wie ein Spieler (Testing Library)

Die Oberflächen-Tests klicken Knöpfe über ihre Rolle und ihren Namen (`getByRole("button", { name: "Rad drehen" })`)
und prüfen sichtbaren Text, nicht den inneren Aufbau. `within(...)` sucht nur in einem Bereich, z. B. im Tisch.
`aria-pressed` macht abgehakte Felder für Tests und Screenreader erkennbar, `role="status"` lässt einen Screenreader
die gezogene Kategorie vorlesen. `vi.spyOn(window, "confirm")` ersetzt den Browser-Dialog im Test.

### Rad mit SVG und CSS-Übergang

Das Rad ist eine SVG-Grafik mit fünf Segmenten zu 72 Grad. Damit Segment `i` oben unter dem Zeiger landet, dreht es
sich um `nummer × 1800 − (i × 72 + 36)` Grad: fünf volle Umdrehungen je Runde, minus die Mitte des Segments. Ein
CSS-Übergang (`transition`) dreht es sichtbar, das Ereignis `transitionend` meldet den Stillstand. jsdom (der
Browser-Ersatz in Tests) spielt keine Übergänge ab, deshalb löst der Test `transitionEnd` selbst aus.

### Planen in zwei Schritten

Plan B (Oberfläche) entstand erst, als Plan A (Logik) gemergt war, weil er auf dessen Schnittstellen aufbaut. Das
grafische Rad kam erst nach dem Spielen im Browser als Aufgabe 7 dazu: Ausprobieren findet, was auf dem Papier fehlt.

## Fehler und Lösungen

### `argument required when using the --repo flag`

- **Wo:** Warteschleife für zwei PRs: `for r in "musik-app 9" …; do set -- $r; gh pr view $2 -R …`
- **Ursache:** zsh teilt `$r` anders als bash nicht an Leerzeichen auf, `$2` war leer. Die Schleife wartete endlos.
- **Lösung:** Paare als `repo:nr` schreiben und mit `${pr%%:*}` und `${pr##*:}` zerlegen.
- **Prüfen:** Die Schleife meldet `musik-app #9: MERGEABLE` und `claude-ecosystem #64: MERGEABLE`.

### `[warn] Code style issues found in the above file. Run Prettier with --write to fix.`

- **Wo:** `npm run check` nach Aufgabe 7 der Spiellogik, Datei `__tests__/lib/spiel.test.ts`
- **Ursache:** Die Testdatei entstand per Shell, dort greift der Prettier-Hook nicht.
- **Lösung:** `npx prettier --write <datei>`, ab dann nach jedem Anhängen per Shell gleich mitlaufen lassen.
- **Prüfen:** `npm run check` mit Exit-Code 0.

### `TestingLibraryElementError: Found multiple elements with the text: Titel`

- **Wo:** Test „Rad drehen zeigt Runde und Kategorie“ nach dem Einbau des Rads
- **Ursache:** „Titel“ stand jetzt zweimal im Tisch, auf dem Rad und im Kategorie-Kasten.
- **Lösung:** Kategorie-Kasten mit `role="status"`, Test fragt `tisch().getByRole("status")` ab.
- **Prüfen:** `npm run check`: 40 Tests bestanden.

### `'RadAnsicht' is not defined  react/jsx-no-undef`

- **Wo:** Prettier/ESLint-Hook beim Umbau von `app/ui/tisch.tsx`
- **Ursache:** Der Hook prüft nach jeder einzelnen Änderung. Der Import kam erst mit der letzten Änderung dazu, die
  Zwischenstände davor waren unvollständig.
- **Lösung:** nichts nötig, im Endstand war der Import da. Besser: den Import zuerst einfügen.
- **Prüfen:** `npm run check` ohne ESLint-Funde.

## Aus dem Chat

-

## Offene Fragen

- Stört es beim echten Spiel, dass ein Klick auf ein nicht erlaubtes Feld einfach nichts tut?
- Soll das Rad bei Bedarf schneller sein (heute 4 Sekunden)?

## Nächste Schritte

1. Phase 2 – Spotify: Anmeldung des DJs (OAuth), Playlist laden, abspielen, Original-Jahr über MusicBrainz.
2. Dazu die animierte Musikspur, die nach dem Ausschnitt stehen bleibt (hängt am echten Abspielen).
