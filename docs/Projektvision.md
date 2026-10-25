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
- **Bingo:** erkennt die App automatisch. Abschaltbar (ab Phase 4), dann krönt der DJ am Tisch die Sieger von Hand (auch mehrere).
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
| Daten und Echtzeit | Supabase (Realtime, noch ohne Tabellen; Postgres für Songs und Jahre in Phase 4) |
| Hosting | Vercel |
| Qualität | ESLint, Prettier, Vitest, Playwright (nur lokal, CI in Phase 4) |
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
- [x] **Phase 2 – Spotify:** Anmeldung des DJs (OAuth), eigene Playlist laden, abspielen (Ausschnitt oder ganz),
  Erscheinungsjahr über MusicBrainz, Korrektur durch den DJ, animierte Musikspur am Tisch (abgeschlossen 2026-10-20, PRs #13 bis #15)
- [x] **Phase 3 – Mehrspieler:** Raum mit Code, jeder spielt auf dem eigenen Handy, Live-Abgleich über Supabase
  Realtime, Deployment auf Vercel. Dazu Spieler-Bots für Browser-Tests (abgeschlossen 2026-10-22, PRs #21 bis #33)
- [ ] **Phase 4 – Eigene Ideen:** Scoreboard über einen Spieleabend, weitere Kategorien, Tisch ganz am Handy.
  Aus Phase 3 verschoben: Songs und Erscheinungsjahre in Supabase, Stechen, Bingo-Erkennung abschaltbar,
  Kategorie und Lösung auch auf dem Handy, Playwright in der CI, Tisch macht nach dem Neuladen im Spiel weiter

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
B [[2026-10-19-vorbereiten|Vorbereiten und Erscheinungsjahr]], C [[2026-10-19-abspielen|Abspielen]].

- **Anmeldung:** OAuth mit PKCE nur im Browser, ohne Client-Secret ([[0003-spotify-anmeldung-nur-im-browser|ADR 0003]]).
  Der DJ bleibt angemeldet (Refresh-Token im Browser), ein Knopf „Abmelden“ löscht alles.
- **Ablauf am Tisch:** Startseite mit „Mit Spotify anmelden“ oder „Demo starten“ → Liste der eigenen und
  kollaborativen Playlists → Vorbereiten mit Fortschrittsbalken (entfällt, wenn schon vorbereitet) → Zahl der Songs
  und der unsicheren Jahre → „Spiel starten“. Gespielt wird wie in Phase 1, Tisch und Karte nebeneinander am Laptop.
- **Speichern bis Phase 3:** im `localStorage` des Browsers, Schlüssel ist die Spotify-Track-ID. Ab Phase 3 Supabase.
- **Vorbereiten:** Songs über `/playlists/{id}/items` laden, Podcast-Folgen, lokale und nicht abspielbare Songs still
  überspringen und zählen („98 Songs bereit, 2 übersprungen“). Erscheinungsjahr über den ISRC aus MusicBrainz
  (1 Anfrage pro Sekunde, über den Next.js-Server). Kein Treffer: Spotify-Jahr, markiert als „unsicher“, keine Suche
  nach Titel.
- **Korrigieren:** in der Auflösung („Jahr korrigieren“). Vor dem Spiel steht nur, wie viele Songs ein unsicheres
  Jahr haben („nicht gefunden“ oder „MusicBrainz-Jahr später als Spotify-Jahr“). Die Songliste vor dem Spiel ist
  entfallen, weil sie dem mitspielenden DJ die Lösungen verrät ([[0007-keine-songliste-vor-dem-spiel|ADR 0007]]).
- **Ausschnitt:** ab Songanfang, 15, 30 (Standard), 45 oder 60 Sekunden oder ganz, jederzeit einstellbar, gilt ab dem
  nächsten Song. Am Ende pausiert die Musik, Knöpfe „Nochmal“ und „Weiterhören“.
- **Musikspur:** animierte Wellenlinie in der Farbe der gedrehten Kategorie und ein Fortschrittsbalken (Phase 4,
  vorher Equalizer-Balken). Keine echte Wellenform, die Audio-Analyse von Spotify gibt es für neue Apps nicht mehr. Das Cover erst in der Auflösung.
- **Demo:** Die feste Songliste aus Phase 1 bleibt als Spiel ohne Anmeldung und ohne Musik.
- **Fertig, wenn:** am Laptop ein komplettes Spiel mit eigener Playlist bis zum Bingo läuft, mit Musik, richtigen
  und einmal korrigierten Erscheinungsjahren, Musikspur und Cover. Die Auswahl des Erscheinungsjahrs ist eine reine
  Funktion (TDD), Spotify und MusicBrainz werden in Tests mit nachgebauten Antworten ersetzt.
- **Spotify-API, Stand Oktober 2026:** `external_ids` (ISRC) wurde im Februar 2026 für den Development Mode gestrichen,
  im März aber wieder eingeführt. Playlist-Songs kommen über `/items` statt `/tracks` und nur für eigene oder
  kollaborative Playlists, die Suche liefert höchstens 10 Treffer.

Mit `/grill-with-docs` am 2026-10-20 für **Phase 3 – Mehrspieler** geklärt:

Umsetzung in drei Plänen mit je einem PR: A Deployment auf Vercel, B Raum und Beitritt, C Live-Spiel. A zuerst, weil
Handys `127.0.0.1` nicht erreichen und Spotify außerhalb davon HTTPS verlangt.

- **Spielstand:** Supabase Realtime mit Broadcast und Presence, ohne Tabellen
  ([[0004-mehrspieler-ohne-tabellen|ADR 0004]]). Der Tisch gibt den Takt vor (neue Runde, Auflösung), jedes Handy hält
  seine Karte selbst. Songs und Erscheinungsjahre bleiben im `localStorage` des Tisches, der Umzug nach Supabase kommt
  mit Phase 4.
- **Raum:** gilt für den ganzen Spieleabend, mehrere Spiele mit demselben Code. „Neues Spiel“ gibt allen neue Karten.
  Endet mit „Raum schließen“ am Tisch, die Handys zeigen dann „Raum geschlossen“. Auch die Demo eröffnet einen Raum.
- **Beitritt:** Der Tisch zeigt einen Raum-Code aus 4 Buchstaben (ohne verwechselbare Zeichen) und einen QR-Code mit
  dem Link `/raum/<Code>`. Handy scannen oder Code auf der Startseite eintippen, Namen eingeben. Ein Name, der im Raum
  schon verbunden ist, wird abgelehnt („Name schon vergeben“). Wer mitten im Spiel beitritt, bekommt sofort eine Karte.
- **Neuladen:** Handy (Raum-Code, Name, Karte) und Tisch (Raum-Code, Spielstand) merken sich alles im eigenen
  `localStorage` und machen nach dem Neuladen weiter.
- **Handy:** zeigt nur Karte und Notizfläche. Die Notizfläche lässt sich ausschalten (die Karte wird dann größer),
  das Handy merkt sich die Wahl, und sie leert sich bei jeder neuen Runde. Felder, die gerade nicht abgehakt werden
  dürfen, sind ausgegraut: Vor der Auflösung ist alles grau, danach leuchten nur die freien Felder der gedrehten
  Kategorie. Sind alle fünf schon abgehakt, bleibt alles grau. Abhaken wie in Phase 1. Bei Bingo zeigt das eigene
  Handy „Bingo!“ und hebt die Reihe hervor, bei allen anderen ist die Karte bis zum neuen Spiel gesperrt.
- **Tisch:** statt der Karte eine Leiste mit den Spielern und ihrer Zahl abgehakter Felder („Anna 7 · Ben 5“),
  nicht verbundene ausgegraut. Bei Bingo „Bingo! Anna“ (bei mehreren alle Namen), die Musik hört auf. Haben mehrere
  in derselben Runde Bingo, gewinnen alle (Stechen kommt in Phase 4).
- **Deployment:** `https://musik-bingo.vercel.app` (ohne „hitster“), als zweite Redirect-URI bei Spotify eingetragen.
  Vorschau-Deployments der PRs laufen nur mit der Demo, weil Spotify nur genau eingetragene Adressen erlaubt.
- **Tests:** Playwright ab Plan B, vorerst nur lokal (`npm run e2e`) gegen das Supabase-Projekt, mit zwei Browsern
  (Tisch und Handy) im Demo-Raum. In die CI kommt er mit einem GitHub-Secret in Phase 4.
- **Live-Spiel (2026-10-22, Plan C und D):** Der Spielstand läuft über Broadcast mit Nachfragen, Presence zeigt nur,
  wer da ist ([[0006-spielstand-ueber-broadcast|ADR 0006]], ersetzt
  [[0005-spielstand-ueber-presence|ADR 0005]] wegen des Presence-Limits von Supabase). Nach einem Bingo darf in derselben Runde noch abhaken, wer in ihr
  noch nicht abgehakt hat, danach ist kein Zurücknehmen mehr möglich. Lädt der Tisch neu, ist das Spiel weg, der Raum
  bleibt (Weitermachen in Phase 4). Ohne Supabase bleibt das Spiel auf einem Gerät mit Karte am Tisch.
- **Fertig, wenn:** Der Laptop öffnet die Vercel-Adresse als Tisch mit Spotify, zwei echte Handys treten per QR-Code
  bei, ein komplettes Spiel läuft bis zum Bingo, und der Tisch zeigt den Namen. Unterwegs lädt ein Handy neu und
  behält seine Karte, ein drittes tritt mitten im Spiel bei. Playwright-Test für den Demo-Raum und `npm run check`
  grün.
