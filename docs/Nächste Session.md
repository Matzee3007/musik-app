---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-19
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-19. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal: [[Lernjournal Phase 1 - Spiel auf einem Gerät]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #12)
- **Offene PRs:** keine
- **Nicht committet:** nichts

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` und der Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

## Womit es weitergeht

**Phase 1 – Spiel auf einem Gerät ist abgeschlossen** (PRs #10, #11, #12). Die nächste Session beginnt mit
**Phase 2 – Spotify**: Anmeldung des DJs (OAuth), eigene Playlist laden, abspielen (Ausschnitt oder ganz),
Original-Jahr über MusicBrainz, Korrektur durch den DJ, animierte Musikspur am Tisch.

1. **Claude fragt zuerst, ob etwas anderes ansteht.** Vorschläge aus Phase 1 (offene Fragen im
   [[Lernjournal Phase 1 - Spiel auf einem Gerät|Journal]]):
   - Ein Klick auf ein Feld, das man gerade nicht abhaken darf, tut nichts. Braucht es einen Hinweis?
   - Drehzeit des Rads (heute 4 Sekunden) anpassen?

   Punkte fürs Ecosystem stehen in der [[docs/Nächste Session|Übergabe des Ecosystems]].
2. [[projects/musik-app/docs/Tools für später|Tools für später]] und die
   [[docs/Tools für später|Tools für später des Ecosystems]] auf Werkzeuge für Phase 2 prüfen.
3. Phase 2 mit `/grill-with-docs` schärfen, bevor geplant wird. Offen ist z. B.: Wie wählt der DJ die Playlist, wo
   werden Songs und korrigierte Jahre gespeichert (Supabase kommt laut Roadmap erst in Phase 3), wie lang ist der
   Ausschnitt einstellbar. Stolpersteine zu Spotify und MusicBrainz stehen in der
   [[projects/musik-app/docs/Projektvision|Projektvision]].
4. **Vorbereitung, die nur du machen kannst:** eine App im Spotify Developer Dashboard anlegen (Client-ID, Redirect-URI
   für `http://127.0.0.1:3000`). Claude erklärt die Schritte, wenn es so weit ist. Schlüssel kommen später in
   `.env.local`, nie ins Repo.
5. Danach den Plan für Phase 2 mit `plan-schreiben`.

## Passende Skills

- `grill-with-docs`: offene Fragen zu Phase 2 klären, bevor geplant wird
- `plan-schreiben`: Plan für Phase 2
- `tdd`: z. B. Auswahl des Original-Jahres aus den MusicBrainz-Daten als reine Funktion
