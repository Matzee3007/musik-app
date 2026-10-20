# REVIEW.md – Musik-App

Was beim Review eines PRs in diesem Repo zusätzlich zur `CLAUDE.md` zählt. Jeden Verstoß als Fund melden,
mit der Regel aus dieser Datei als Begründung.

## Spotify

- **Anmeldung nur im Browser** (`docs/adr/0003-spotify-anmeldung-nur-im-browser.md`): Es gibt kein Client-Secret,
  `.env.local` enthält nur die öffentliche Client-ID. Access- und Refresh-Token bleiben im Browser und tauchen weder
  in Server-Code (`app/api/`), Logs, Fehlermeldungen noch in Tests mit echten Werten auf.
- Redirect-URIs und lokale Adressen mit `127.0.0.1`, nicht `localhost` (Spotify verlangt das).

## MusicBrainz

- Der `User-Agent` nennt App und Repo-Adresse, keine persönlichen Daten (E-Mail, Name).
- API-Routen in `app/api/` prüfen jede Eingabe streng (wie das ISRC-Muster in `app/api/erscheinungsjahr/`), damit
  niemand über die App beliebige Anfragen an fremde Dienste weiterleitet.
- Das Erscheinungsjahr wird je Playlist einmal ermittelt und gespeichert, nicht während des Spiels
  (Architekturprinzip 4). Ein Aufruf von `lib/musicbrainz.ts` aus dem Spielablauf ist ein Fund.

## Spiellogik

- Die Spiellogik in `lib/` (Rad, Karte, Bingo, Songliste, Spielzüge) bleibt aus reinen Funktionen: Sie importiert weder
  React noch `lib/spotify/`, MusicBrainz oder Supabase. Zufall kommt als Parameter vom Typ `Zufall`
  (`lib/zufall.ts`, Standard `Math.random`) herein, damit Tests ihn festlegen können.
- Neue oder geänderte Logik in `lib/` hat einen Vitest-Test in `__tests__/lib/`.
- Eine neue Kategorie ist ein Eintrag in `lib/kategorien.ts` (Name, Farbe, Lösung), kein Sonderfall im Code
  (Architekturprinzip 3).

## Next.js

- Code folgt der Doku der installierten Version in `node_modules/next/dist/docs/` (siehe `AGENTS.md`), nicht dem
  Wissen über ältere Versionen.
