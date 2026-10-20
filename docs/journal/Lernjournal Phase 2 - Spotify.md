---
titel: Lernjournal Phase 2 - Spotify
status: abgeschlossen
phase: 2
erstellt: 2026-10-20
tags: [lernjournal, phase-2, spotify, oauth, pkce, musicbrainz, web-playback-sdk, nextjs, tdd, archify]
---

# Lernjournal Phase 2: Spotify

Fortsetzung von [[Lernjournal Phase 1 - Spiel auf einem Gerät]]. Gehört zu
[[projects/musik-app/docs/Projektvision|Projektvision]]. Die Session lief vom 2026-10-19 bis in den 2026-10-20.

## Erledigt

- [x] archify getestet (Sequenzdiagramm der Spotify-Anmeldung) und ins Ecosystem übernommen, nur von Hand aufrufbar
  mit `/archify` (Ecosystem PR #66, ADR 0011 dort)
- [x] Datenschutz-Hook für die nächste Ecosystem-Session vorgemerkt (Ecosystem PR #67), Anlass siehe „Fehler und
  Lösungen“
- [x] Phase 2 mit `/grill-with-docs` geklärt: 16 Entscheidungen in drei Runden, [[0003-spotify-anmeldung-nur-im-browser|ADR 0003]]
  (Anmeldung mit PKCE nur im Browser), Glossar: Vorbereiten, Demo, Erscheinungsjahr
- [x] Plan A [[2026-10-19-spotify-anmeldung|Anmeldung und Playlists]] (PR #13): PKCE, Token tauschen und erneuern,
  Sitzung im Browser, eigene Playlists, `/callback`, Startseite mit Demo; echte Anmeldung mit der Spotify-App getestet
- [x] Plan B [[2026-10-19-vorbereiten|Vorbereiten und Erscheinungsjahr]] (PR #14): Songs einer Playlist,
  Erscheinungsjahr über ISRC und MusicBrainz (Server-Route `/api/erscheinungsjahr`), Jahre im Browser gespeichert,
  Songliste mit Markierung und Korrektur, Spiel mit eigenen Songs
- [x] Plan C [[2026-10-19-abspielen|Abspielen]] (PR #15): Web Playback SDK, Ausschnitt mit „Nochmal“ und
  „Weiterhören“, Musikspur, Cover und „Jahr korrigieren“ in der Auflösung, „Zurück“ beendet das Vorbereiten
- [x] Zwei Wünsche nach dem echten Test: „Lösung anzeigen“ und „Nächste Runde“ halten die Musik an, „Weiterhören“ in
  der Auflösung
- [x] Fertig-Kriterium erfüllt: ein Spiel mit eigener Playlist und Musik bis Bingo; 141 Tests (vorher 40)
- [x] Tool-Notizen [[Spotify Web API]] (mit Web Playback SDK) und [[MusicBrainz]]
- [ ] Fehler bei Spotify-Aufrufen mitten im Spiel abfangen (siehe „Offene Fragen“)

## Befehle: Entwicklung mit Spotify

```bash
npm run dev                       # jetzt: next dev -H 127.0.0.1
cp .env.example .env.local        # Vorlage für die Client-ID
npm run build
gh pr checks 15 --watch --interval 10
```

- `next dev -H 127.0.0.1`: startet den Dev-Server auf `127.0.0.1`, weil Spotify `localhost` als Redirect-URI nicht
  erlaubt.
- `cp .env.example .env.local`: legt die lokale Datei für die Client-ID an. `.env.local` ist in der `.gitignore`,
  `.env.example` darf ins Repo.
- `npm run build`: zeigt je Route, ob sie statisch (○) oder bei jeder Anfrage (ƒ) läuft; `/api/erscheinungsjahr` ist ƒ.
- `gh pr checks <nr> --watch`: wartet, bis die CI eines PRs fertig ist. Direkt nach dem Öffnen meldet sie sich manchmal
  noch nicht („no checks reported“), dann kurz warten.

## Befehle: Messen und Nachstellen

```bash
/usr/bin/curl -A "musik-app/0.1 ( https://github.com/Matzee3007/musik-app )" "https://musicbrainz.org/ws/2/isrc/GBUM71029604?fmt=json"
/usr/bin/curl -s -o /dev/null -D - -A "…" "<url>" | grep -iE "ratelimit|retry-after"
npx vitest run __tests__/ui/spiel-musik.test.tsx -t "Bingo"
```

- `/usr/bin/curl`: das curl von macOS. Das curl aus Anaconda scheitert am Zertifikat (siehe Fehler).
- `-D -` mit `grep`: zeigt nur die Kopfzeilen einer Antwort, hier die Begrenzung von MusicBrainz.
- `vitest run <datei> -t "<name>"`: nur einen Test einer Datei, um einen roten Test schnell zu untersuchen.
- Ein kleines Node-Skript steuerte Chrome ohne Fenster über das DevTools-Protokoll (`--remote-debugging-port`,
  WebSocket) und klickte die Demo durch. Damit ließ sich ein Fehler zeigen, den jsdom nicht nachstellen kann.

## Neu gelernt

### OAuth mit PKCE

Die App erzeugt einen geheimen `code_verifier` und schickt Spotify zuerst nur dessen Fingerabdruck (`code_challenge`,
SHA-256). Beim Tausch des Codes gegen das Token schickt sie den Verifier selbst, Spotify vergleicht. So braucht es kein
Client-Secret. Der `state` ist ein Zufallswert, an dem die App erkennt, dass die Rückkehr zu ihrer Anmeldung gehört.

### StrictMode führt Effekte doppelt aus

Im Dev-Modus hängt React jede Komponente einmal ein, aus und wieder ein. Ein Effekt, der etwas nur einmal tun darf
(Code tauschen, Playlist vorbereiten), braucht einen Merker per `useRef`, der beide Durchläufe übersteht. Tests mit
`<StrictMode>` haben das jedes Mal aufgedeckt.

### Ein CSS-Übergang braucht einen alten Wert

Ein Element, das frisch mit seinem Endwert in die Seite kommt, hat keinen „Vorher“-Wert, der Browser spielt keinen
Übergang ab und meldet nie `transitionend`. Deshalb blieb das Spiel nach der ersten Auflösung stehen. Tests, die
`transitionEnd` von Hand auslösen, können das nicht finden.

### Der gemeinsame Topf von MusicBrainz

MusicBrainz begrenzt alle Nutzer gemeinsam (`x-ratelimit-limit: 1900`), der Topf füllt sich alle 2 Sekunden. Etwa jede
fünfte Anfrage bekommt 503. Eine Wartezeit von genau 2 Sekunden trifft immer wieder dieselbe leere Phase. Messen statt
raten hat das gezeigt.

### Spotify-API im Development Mode (Stand Oktober 2026)

Playlist-Songs über `/playlists/{id}/items` (Feld `item` statt `track`), nur für eigene oder kollaborative Playlists,
bei fremden fehlt `items` ganz. `external_ids` (ISRC) wurde im Februar gestrichen und im März wieder eingeführt.

### Nahtstellen für fremde Bibliotheken

Das Web Playback SDK steckt hinter einer kleinen Schnittstelle `Abspieler`. So ließ sich sogar das Verbinden mit
einem nachgebauten `window.Spotify.Player` testen, und Tisch und Spiel laufen im Test mit einem nachgebauten Abspieler.
Mit `vi.useFakeTimers()` vergehen 30 Sekunden Ausschnitt im Test sofort, `vi.resetModules()` lädt ein Modul je Test
frisch.

### Hook statt Agent für Schutzregeln

Eine Regel im Gedächtnis kann Claude übersehen. Ein `PreToolUse`-Hook prüft dagegen jeden Aufruf deterministisch.
Deshalb ist für den Datenschutz ein Hook vorgemerkt, kein Agent.

## Fehler und Lösungen

### Persönliche Daten im User-Agent

- **Wo:** erster Test einer MusicBrainz-Abfrage mit `curl`
- **Ursache:** Claude setzte ohne Rückfrage die E-Mail-Adresse des Entwicklers als Kontakt in den User-Agent.
- **Lösung:** Gesendet wurde sie nicht, weil curl schon am Zertifikat scheiterte. Seitdem steht nur die Repo-Adresse im
  User-Agent (vom Entwickler bestätigt), eine Regel im Gedächtnis, ein Datenschutz-Hook im Ecosystem vorgemerkt.
- **Prüfen:** `grep -rn "USER_AGENT" lib/musicbrainz.ts`

### `curl: (77) error adding trust anchors from file: /opt/anaconda3/ssl/cacert.pem`

- **Wo:** Abfrage an MusicBrainz aus der Shell
- **Ursache:** Die Shell nimmt das curl aus Anaconda mit einem Zertifikatspfad, den es nicht lesen kann.
- **Lösung:** `/usr/bin/curl` von macOS
- **Prüfen:** `/usr/bin/curl -s -o /dev/null -w "%{http_code}" https://musicbrainz.org` gibt einen HTTP-Status aus.

### `MusicBrainz ist gerade überlastet.` bei jeder Playlist

- **Wo:** erster echter Test von Plan B
- **Ursache:** Nach einem 503 wartete die App genau 2 Sekunden, also genau einen Takt des gemeinsamen Topfs, und traf
  wieder die leere Phase. Gemessen: neuer Versuch nach 2 s 3 von 5, nach 1 s 5 von 5 erfolgreich.
- **Lösung:** 1 Sekunde Pause, bis zu 5 Versuche (`lib/vorbereiten.ts`)
- **Prüfen:** Messskript mit 60 echten Abfragen ohne Abbruch, Test „fünf Versuche mit 1 s Pause“

### Nach der ersten Auflösung lässt sich das Rad nicht mehr drehen

- **Wo:** echter Test von Plan C, schon seit Phase 1 im Code
- **Ursache:** Die Auflösung hängte das Rad aus, „Nächste Runde“ hängte ein neues direkt mit dem Endwinkel ein, kein
  Übergang, kein `transitionend`, die App wartete ewig.
- **Lösung:** Das Rad bleibt eingehängt und wird in der Auflösung nur versteckt.
- **Prüfen:** Test „das Rad bleibt über die Auflösung hinweg dasselbe Element“, Chrome-Skript: Demo-Runden 2 und 3 zeigen
  „Lösung anzeigen“.

### `Do not use an <a> element to navigate to /. Use <Link /> from next/link instead.`

- **Wo:** Rückruf-Seite, gemeldet vom Prettier-Hook (er lässt auch ESLint laufen)
- **Ursache:** Next.js verlangt für interne Links `<Link>`.
- **Lösung:** `import Link from "next/link"`
- **Prüfen:** `npx eslint app/ui/rueckruf.tsx`

### `TypeError: Cannot read properties of undefined (reading 'abgehakt')`

- **Wo:** Test „Bingo hält die Musik an“
- **Ursache:** `hatBingo(neu)` statt `hatBingo(neu.karte)`; Vitest prüft keine Typen.
- **Lösung:** die Karte übergeben; `npm run check` hätte es über TypeScript vor dem Commit gemeldet.
- **Prüfen:** `npx vitest run __tests__/ui/spiel-musik.test.tsx`

### Annahme „localhost antwortet nicht mehr“ war falsch

- **Wo:** Einrichtung in Plan A
- **Ursache:** macOS löst `localhost` auch zu `127.0.0.1` auf, `-H 127.0.0.1` sperrt `localhost` nicht aus.
- **Lösung:** Doku korrigiert. Unter `localhost` scheitert die Anmeldung laut an der Redirect-URI.
- **Prüfen:** `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000` gibt 200.

### `[browser] ⨯ unhandledRejection: TypeError: Failed to fetch` (offen)

- **Wo:** Dev-Log am 2026-10-20, aus `getOAuthToken` → `gueltigesToken` → `tokenErneuern`
- **Ursache:** Das SDK wollte ein frisches Token, das Erneuern scheiterte ohne Netz (vermutlich nach dem Ruhezustand),
  niemand fängt den Fehler ab.
- **Lösung:** noch keine, vorgemerkt für die nächste Session
- **Prüfen:** -

## Aus dem Chat

-

## Offene Fragen

- Was soll die App zeigen, wenn Spotify mitten im Spiel nicht erreichbar ist (Token erneuern, Abspielen, Pausieren)?
  Bisher landen solche Fehler ungefangen in der Konsole.

## Nächste Schritte

1. Fehlerbehandlung für Spotify-Aufrufe mitten im Spiel klären und umsetzen (Restpunkt aus Phase 2).
2. Phase 3 – Mehrspieler: Raum mit Code, Handys der Spieler, Supabase Realtime, Deployment auf Vercel.
3. Im Ecosystem: Datenschutz-Hook bauen.
