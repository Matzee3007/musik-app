---
titel: Projektvision
status: aktiv
erstellt: 2026-10-18
tags: [projektvision, roadmap, musik-app]
---

# Projektvision: Musik-App

## Ziel

Das Kartenspiel [Hitster Bingo](https://hitstergame.com/de-de/pages/spielregeln-bingo) als Web-App nachbauen, damit
ich es mit meinen Freunden spielen kann, und eigene Ideen einbauen.

So läuft eine Runde (Vorbild: Seite B „Experten“ des Originals):

1. Ein Rad wählt zufällig eine Kategorie: **Titel**, **Interpret**, **Jahrzehnt**, **genaues Erscheinungsjahr**
   oder **Jahr ±3**. Jede Kategorie hat eine eigene Farbe.
2. Ein zufälliger Song aus einer Spotify-Playlist läuft, nur ein Ausschnitt (meist die ersten 15 Sekunden) oder
   ganz. Das lässt sich vor und während des Spiels einstellen.
3. Jeder schreibt seine Antwort auf.
4. Wer richtig liegt, hakt auf seiner Bingo-Karte (5×5, Kategorien zufällig verteilt) ein Feld in der Farbe der
   Kategorie ab.
5. Wer zuerst fünf in einer Reihe hat (waagerecht, senkrecht oder diagonal), hat Bingo und gewinnt.

**Hauptfall:** Der Laptop ist der „Tisch“: Er spielt die Musik und zeigt das Rad. Jeder Freund hat seine Karte und
seine Antworten auf dem eigenen Handy. Später soll der Tisch auch ganz auf einem Handy laufen können.

**Eigene Ideen:** Scoreboard, wer über mehrere Runden am meisten gewonnen hat. Weitere Kategorien.

**Was es nicht ist:** kein Streamingdienst. Die App greift nur auf Spotify und eigene Playlists zu, um Songs
abzuspielen. Kein öffentliches Produkt unter dem Namen oder Logo „Hitster“.

## Lernziel

- TypeScript als zweite Sprache nach Python
- Spotify einbinden: Anmeldung über OAuth, Web API, Web Playback SDK
- Aus einer Idee Schritt für Schritt eine funktionierende App entwickeln

Arbeitsweise (aus der globalen `CLAUDE.md`):
- Erst erklären lassen, dann ausführen. Bei jedem Befehl „Warum?“ fragen.
- Kleine Schritte, ein Pull Request pro Feature.
- Neue Aufgabe: `grill-with-docs` → `plan-schreiben` → `tdd` → `fertig-pruefen`.
- Am Ende jeder Session `journal` und `naechste-session`.

## Stack

Begründung und Alternativen: [[0001-stack|ADR 0001]].

| Aufgabe | Werkzeug |
|---|---|
| Sprache | TypeScript |
| Framework | Next.js (React) |
| Laufzeit und Pakete | Node.js 24 LTS, npm |
| Daten und Echtzeit | Supabase (Postgres, Realtime), ab Phase 3 |
| Hosting | Vercel, ab Phase 3 |
| Qualität | ESLint, Prettier, Vitest, später Playwright |
| Musik | Spotify Web API und Web Playback SDK |
| Erscheinungsjahr | MusicBrainz, Korrektur durch den DJ |

## Architekturentscheidungen

1. **Nur der DJ meldet sich bei Spotify an.** Mitspieler treten über einen Raum-Code bei und brauchen kein
   Spotify-Konto. Eine private Spotify-App erlaubt höchstens 5 freigeschaltete Konten.
2. **Spiellogik als reine Funktionen, testgetrieben:** Rad, Karte, Antwortprüfung und Bingo-Erkennung hängen
   weder an React noch an Spotify oder Supabase.
3. **Kategorien sind Daten, nicht Code.** Eine neue Kategorie braucht Name, Farbe und Prüfregel, keinen Umbau.
4. **Das Erscheinungsjahr kommt nicht nur von Spotify.** Es kommt aus MusicBrainz (über den ISRC des Songs, das
   früheste Datum ohne Live-Versionen und Remixe), der DJ kann es korrigieren. Es wird je Playlist einmal
   ermittelt und gespeichert.
5. **Antworten prüfen:** Jahr, Jahrzehnt und ±3 prüft die App selbst. Titel und Interpret mit Toleranz für
   Tippfehler, die Gruppe oder der DJ kann überstimmen.
6. **Kontext liegt in Dateien** (`CLAUDE.md`, `docs/`), nicht im Chatverlauf.

## Roadmap

Jede Phase endet mit etwas, das läuft und getestet ist. Eine fertige Phase wird in derselben Session
abgeschlossen (Regel „Phasenwechsel“ in der globalen `CLAUDE.md`).

- [ ] **Phase 0 – Fundament:** Repo und `CLAUDE.md` stehen, Node, TypeScript und Next.js eingerichtet, ESLint,
  Prettier und Vitest, erster Test grün, CI mit GitHub Actions, Projektvision mit `/grill-with-docs` geschärft,
  Phasen 1 bis 3 geplant
- [ ] **Phase 1 – Spiel auf einem Gerät:** Rad, Bingo-Karte 5×5 mit Farben je Kategorie, Antwortprüfung,
  Bingo-Erkennung, testgetrieben. Feste Songliste, noch ohne Spotify
- [ ] **Phase 2 – Spotify:** Anmeldung des DJs (OAuth), eigene Playlist laden, abspielen (Ausschnitt oder ganz),
  Original-Jahr über MusicBrainz, Korrektur durch den DJ
- [ ] **Phase 3 – Mehrspieler:** Raum mit Code, jeder spielt auf dem eigenen Handy, Live-Abgleich über Supabase
  Realtime, Deployment auf Vercel
- [ ] **Phase 4 – Eigene Ideen:** Scoreboard über mehrere Runden, weitere Kategorien, Tisch ganz am Handy

## Stolpersteine

- **Spotify Development Mode** (Stand Oktober 2026): höchstens 5 freigeschaltete Konten je App, der Besitzer
  braucht Premium, Extended Quota gibt es nur für Firmen. Deshalb meldet sich nur der DJ an.
- **Abspielen nur mit Premium** über das Web Playback SDK. `preview_url` (30-Sekunden-Vorschau) liefert die API
  nicht mehr zuverlässig, den Ausschnitt steuert die App selbst. Auf iOS startet die Wiedergabe nicht von allein,
  der Nutzer muss tippen.
- **Nur eigene oder kollaborative Playlists** sind auslesbar. Fremde Playlists (auch die offiziellen von Hitster)
  liefern keine Songs. Lösung: Songs in eine eigene Playlist kopieren.
- **Erscheinungsjahr:** Spotify liefert das Jahr des Albums, bei Remastern und Best-ofs falsch. MusicBrainz erlaubt
  1 Anfrage pro Sekunde, eine Suche nach Titel findet vor allem Live-Versionen (Test mit „Bohemian Rhapsody“ am
  2026-10-18: Original von 1975 nicht unter den ersten 10 Treffern).
- **Marke „Hitster“:** privat kein Problem, öffentlich nicht unter diesem Namen oder Logo.

## Offene Fragen

- Was zählt bei Titel und Interpret als „richtig“ (Tippfehler, „feat.“, Klammerzusätze wie „Remastered“)?
- Übernehmen wir die Bonusregel des Originals (genaues Jahr bei ±-Kategorie → Feld eines anderen abhaken) und den
  Timer von 25 Sekunden?
- Welche eigenen Kategorien kommen dazu (z. B. „Vor 2000?“, „Gruppe oder Solo“ von Seite A)?
