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

So läuft eine Runde (Vorbild: Seite B „Experten“ des Originals, Begriffe im [[projects/musik-app/docs/Glossar|Glossar]]):

1. Der DJ dreht am Tisch das Rad. Es wählt zufällig eine Kategorie: **Titel**, **Interpret**, **Jahrzehnt**,
   **genaues Erscheinungsjahr** oder **Jahr ±3**. Jede Kategorie hat eine eigene Farbe.
2. Ein zufälliger Song aus einer Spotify-Playlist läuft, nur ein Ausschnitt (Standard 30 Sekunden wie die Vorschau
   des Originals) oder ganz. Das lässt sich vor und während des Spiels einstellen. Der Tisch zeigt dazu eine
   animierte Musikspur, die nach dem Ausschnitt stehen bleibt.
3. Jeder schreibt seine Antwort in die Notizfläche auf dem Handy oder auf Papier, ohne Zeitlimit.
4. Der DJ drückt „Lösung anzeigen“: Das Bild dreht sich um und zeigt groß die Lösung der Kategorie, darunter Titel,
   Interpret, Jahr und Jahrzehnt (ab Phase 2 mit Cover).
5. Jeder prüft selbst ([[0002-spieler-pruefen-selbst|ADR 0002]]). Wer richtig liegt, hakt auf seiner Karte ein
   freies Feld in der Farbe der Kategorie nach eigener Wahl ab. Abhaken lässt sich nach einer Rückfrage jederzeit
   zurücknehmen, das Feld ist dann wieder frei.
6. Wer zuerst fünf in einer Reihe hat (waagerecht, senkrecht oder diagonal), hat Bingo und gewinnt.

**Spielregeln im Detail:**

- **Karte:** 5×5, jede der 5 Kategorien genau 5-mal zufällig verteilt, kein Freifeld, jede Karte anders.
- **Bingo:** erkennt die App automatisch. Abschaltbar, dann krönt der DJ am Tisch die Sieger von Hand (auch mehrere).
- **Gleichstand:** Haben mehrere in derselben Runde Bingo, gewinnen standardmäßig alle. Als Einstellung gibt es
  Stechen: Nur sie spielen weiter, bis einer als Einziger richtig liegt.
- **Songs:** jeder nur einmal pro Spiel. Ist die Playlist leer, wählt der DJ „von vorn“ (neu gemischt) oder eine
  andere Playlist, die Karten bleiben erhalten.
- **Keine Bonusregel:** Das Original hat sie nur auf Seite A.

**Hauptfall:** Der Laptop ist der Tisch: Er spielt die Musik, zeigt Rad und Auflösung und hat keine Karte. Nur der
DJ bedient ihn. Spieler treten mit Raum-Code und Namen bei, ohne Konto, und haben Karte und Notizfläche (abschaltbar)
auf dem eigenen Handy. Der DJ kann mit seinem Handy zusätzlich als Spieler mitmachen. Später soll der Tisch auch
ganz auf einem Handy laufen können.

**Eigene Ideen:** Scoreboard, wer an einem Spieleabend die meisten Spiele gewonnen hat. Weitere Kategorien (vorgemerkt:
Gruppe oder Solo, Vor 2000?, Jahr ±4 und ±2, Herkunftsland des Interpreten, Titel und Interpret, Mitsingen); der DJ
wählt dann je Spiel 5 Kategorien aus. Verworfen: Sprache (hört man), Genre und Album (Spotify-Daten unzuverlässig).

**Was es nicht ist:** kein Streamingdienst. Die App greift nur auf Spotify und eigene Playlists zu, um Songs
abzuspielen. Kein öffentliches Produkt unter dem Namen oder Logo „Hitster“.

Weitere Notizen: [[projects/musik-app/docs/Arbeitsumgebung|Arbeitsumgebung]] (was der Rechner braucht), [[projects/musik-app/docs/Nächste Session|Nächste Session]] (womit es weitergeht),
[[projects/musik-app/docs/Tools für später|Tools für später]] (vorgemerkte Werkzeuge).

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

Begründung und Alternativen: [[projects/musik-app/docs/adr/0001-stack|ADR 0001]].

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
2. **Spiellogik als reine Funktionen, testgetrieben:** Rad, Karte, Songauswahl und Bingo-Erkennung hängen
   weder an React noch an Spotify oder Supabase.
3. **Kategorien sind Daten, nicht Code.** Eine neue Kategorie braucht Name, Farbe und Lösung (welche Angabe zum Song sie zeigt), keinen Umbau.
4. **Das Erscheinungsjahr kommt nicht nur von Spotify.** Es kommt aus MusicBrainz (über den ISRC des Songs, das
   früheste Datum ohne Live-Versionen und Remixe), der DJ kann es korrigieren. Es wird je Playlist einmal
   ermittelt und gespeichert.
5. **Spieler prüfen selbst:** Die App prüft keine Antworten, sie zeigt nur die Lösung. Jeder vergleicht und hakt
   selbst ab, Grenzfälle entscheidet die Gruppe ([[0002-spieler-pruefen-selbst|ADR 0002]]).
6. **Kontext liegt in Dateien** (`CLAUDE.md`, `docs/`), nicht im Chatverlauf.

## Roadmap

Jede Phase endet mit etwas, das läuft und getestet ist. Eine fertige Phase wird in derselben Session
abgeschlossen (Regel „Phasenwechsel“ in der globalen `CLAUDE.md`).

- [x] **Phase 0 – Fundament:** Repo und `CLAUDE.md` stehen, Node, TypeScript und Next.js eingerichtet, ESLint,
  Prettier und Vitest, erster Test grün, CI mit GitHub Actions, Projektvision mit `/grill-with-docs` geschärft.
  Statt „Phasen 1 bis 3 geplant“: Jede Phase wird zu Beginn mit `plan-schreiben` geplant (abgeschlossen 2026-10-18)
- [x] **Phase 1 – Spiel auf einem Gerät:** Rad, Karte 5×5 mit Farben je Kategorie, Auflösung, Abhaken,
  Bingo-Erkennung, testgetrieben. Tisch und Karte nebeneinander am Laptop, feste Songliste, noch ohne Spotify.
  Dazu ein grafisches Rad (abgeschlossen 2026-10-19, PRs #10 und #11)
- [ ] **Phase 2 – Spotify:** Anmeldung des DJs (OAuth), eigene Playlist laden, abspielen (Ausschnitt oder ganz),
  Erscheinungsjahr über MusicBrainz, Korrektur durch den DJ, animierte Musikspur am Tisch
- [ ] **Phase 3 – Mehrspieler:** Raum mit Code, jeder spielt auf dem eigenen Handy, Live-Abgleich über Supabase
  Realtime, Deployment auf Vercel
- [ ] **Phase 4 – Eigene Ideen:** Scoreboard über einen Spieleabend, weitere Kategorien, Tisch ganz am Handy

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

## Geklärte Fragen

Mit `/grill-with-docs` am 2026-10-18 geklärt:

- **Was zählt bei Titel und Interpret als „richtig“?** Entfällt, die Spieler prüfen selbst
  ([[0002-spieler-pruefen-selbst|ADR 0002]]).
- **Bonusregel und Timer von 25 Sekunden?** Keine Bonusregel (gibt es im Original nur auf Seite A). Kein Timer fürs
  Aufschreiben, die 25 Sekunden des Originals sind kein Ausschnitt. Der Ausschnitt dauert standardmäßig 30 Sekunden.
- **Welche eigenen Kategorien?** Siehe „Eigene Ideen“, kommen in Phase 4.

Mit `/grill-with-docs` am 2026-10-19 für **Phase 2 – Spotify** geklärt:

Umsetzung in drei Plänen mit je einem PR: A [[2026-10-19-spotify-anmeldung|Anmeldung und Playlists]],
B [[2026-10-19-vorbereiten|Vorbereiten und Erscheinungsjahr]], C Abspielen.

- **Anmeldung:** OAuth mit PKCE nur im Browser, ohne Client-Secret ([[0003-spotify-anmeldung-nur-im-browser|ADR 0003]]).
  Der DJ bleibt angemeldet (Refresh-Token im Browser), ein Knopf „Abmelden“ löscht alles.
- **Ablauf am Tisch:** Startseite mit „Mit Spotify anmelden“ oder „Demo starten“ → Liste der eigenen und
  kollaborativen Playlists → Vorbereiten mit Fortschrittsbalken (entfällt, wenn schon vorbereitet) → Songliste prüfen
  → „Spiel starten“. Gespielt wird wie in Phase 1, Tisch und Karte nebeneinander am Laptop.
- **Speichern bis Phase 3:** im `localStorage` des Browsers, Schlüssel ist die Spotify-Track-ID. Ab Phase 3 Supabase.
- **Vorbereiten:** Songs über `/playlists/{id}/items` laden, Podcast-Folgen, lokale und nicht abspielbare Songs still
  überspringen und zählen („98 Songs bereit, 2 übersprungen“). Erscheinungsjahr über den ISRC aus MusicBrainz
  (1 Anfrage pro Sekunde, über den Next.js-Server). Kein Treffer: Spotify-Jahr, markiert als „unsicher“, keine Suche
  nach Titel.
- **Korrigieren:** in der Songliste vor dem Spiel und in der Auflösung („Jahr korrigieren“). Die Songliste zeigt
  Spotify- und MusicBrainz-Jahr nebeneinander und markiert „nicht gefunden“ sowie „MusicBrainz-Jahr später als
  Spotify-Jahr“.
- **Ausschnitt:** ab Songanfang, 15, 30 (Standard), 45 oder 60 Sekunden oder ganz, jederzeit einstellbar, gilt ab dem
  nächsten Song. Am Ende pausiert die Musik, Knöpfe „Nochmal“ und „Weiterhören“.
- **Musikspur:** animierte Equalizer-Balken in der Farbe der gedrehten Kategorie und ein Fortschrittsbalken. Keine
  echte Wellenform, die Audio-Analyse von Spotify gibt es für neue Apps nicht mehr. Das Cover erst in der Auflösung.
- **Demo:** Die feste Songliste aus Phase 1 bleibt als Spiel ohne Anmeldung und ohne Musik.
- **Fertig, wenn:** am Laptop ein komplettes Spiel mit eigener Playlist bis zum Bingo läuft, mit Musik, richtigen
  und einmal korrigierten Erscheinungsjahren, Musikspur und Cover. Die Auswahl des Erscheinungsjahrs ist eine reine
  Funktion (TDD), Spotify und MusicBrainz werden in Tests mit nachgebauten Antworten ersetzt.
- **Spotify-API, Stand Oktober 2026:** `external_ids` (ISRC) wurde im Februar 2026 für den Development Mode gestrichen,
  im März aber wieder eingeführt. Playlist-Songs kommen über `/items` statt `/tracks` und nur für eigene oder
  kollaborative Playlists, die Suche liefert höchstens 10 Treffer.
