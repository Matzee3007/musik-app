---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-22
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-22. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 3 - Raum und Beitritt]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #34)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit Plan D (PR #32), mit echten Handys bis zum Bingo geprüft.
  **Phase 3 ist abgeschlossen.**

## Vor dem Start

1. Claude Code im Projektordner starten, damit Projekt-`CLAUDE.md`, Prettier-Hook und die Playwright-Agents geladen
   werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

   Beim ersten Start fragt Claude Code, ob es den MCP-Server `playwright-test` aus der `.mcp.json` nutzen darf. Mit
   Ja stehen die Agents `playwright-test-planner`, `-generator` und `-healer` bereit
   ([[projects/musik-app/docs/Agents|Agents]]).

2. Prüfen, dass `main` aktuell ist:

   ```bash
   git switch main
   git pull
   ```

   `git switch main` wechselt auf den Hauptzweig, `git pull` holt den Stand von GitHub.

## Womit es weitergeht

**Phase 4 – Eigene Ideen** (Roadmap in [[projects/musik-app/docs/Projektvision|Projektvision]]): Scoreboard über einen
Spieleabend, weitere Kategorien, Tisch ganz am Handy. Aus Phase 3 verschoben: Songs und Erscheinungsjahre in Supabase,
Stechen, Bingo-Erkennung abschaltbar, Kategorie und Lösung auch auf dem Handy, Playwright in der CI, Tisch macht nach
dem Neuladen im Spiel weiter.

1. **Zuerst fragt Claude, ob vorher etwas anderes ansteht** (neue Ideen, Skills, Tools, Restpunkte). Vorschläge:
   - **Playwright-Agents ausprobieren:** Planner auf die Startseite oder die Namensabfrage ansetzen (Seed
     `e2e/seed.spec.ts`), Healer nach der nächsten Änderung an der Oberfläche.
   - **Leere Startseite ohne Netz:** Kann das Spotify-Token offline nicht erneuert werden, bleibt die Startseite leer
     (Fund 7, PR #27). Lösung wäre ein `.catch` beim Laden des Tokens in `app/ui/start.tsx`.
   - **Funde aus dem Review von PR #24** (kollaborative Playlists, 401 bei „Nochmal versuchen“, leere Liste bei
     `GET /v1/me`): Details in [[2026-10-20-deployment|Plan A]], Aufgabe 4.
   - **Aufräumen:** Fehler in `lib/spotify/player.ts` in Meldungen übersetzen, Startzähler nur einmal führen (Funde
     #8, #9 aus PR #20).
   - **TypeScript-Option `noUncheckedIndexedAccess`:** eigener kleiner PR (Review PR #19).
   - **Test am Laptop mit echtem Player ohne WLAN:** Was tut das Web Playback SDK bei Pause und „Weiterhören“?
2. Danach `docs/Tools für später.md` prüfen: Für dieses Projekt ist dort nichts vorgemerkt. Die Einträge in den
   [[docs/Tools für später|Tools für später des Ecosystems]] für Phase 4 (Multica, OMC, Worktrees) gelten
   sport-fantasy.
3. Phase 4 mit `grill-with-docs` schärfen: Welche Ideen kommen zuerst, in welcher Reihenfolge? Die Ladezeit beim
   Vorbereiten (81 Songs gut anderthalb Minuten) löst „Jahre in Supabase“ mit.
4. Den ersten Plan mit `plan-schreiben` schreiben.

Offene Fragen aus Phase 3 stehen im [[Lernjournal Phase 3 - Raum und Beitritt|Journal]].

## Passende Skills

- `grill-with-docs`: Phase 4 in Fragerunden schärfen, bevor geplant wird
- `plan-schreiben`: aus der geklärten Idee den ersten Plan mit prüfbaren Aufgaben
- `tdd`: jede Aufgabe erst rot, dann grün, im Raum mit den Spieler-Bots aus `e2e/hilfen/raum.ts`
