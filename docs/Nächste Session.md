---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-22
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-22. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 4 - Design Spielshow]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #39)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit dem neuen Design (PRs #35–#38), am Abend überarbeitet:
  Anthrazit und Messing, großes Rad, „Anhalten“, Rückfrage beim Schließen, einklappbarer QR-Code (PRs #40–#42). Von
  Claude aus nicht prüfbar (kein Netz in der Sandbox), an echten Geräten noch nicht getestet.

## Vor dem Start

1. Claude Code im Projektordner starten, damit Projekt-`CLAUDE.md`, Prettier-Hook und Playwright-Agents geladen
   werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. Prüfen, dass `main` aktuell ist:

   ```bash
   git switch main
   git pull
   ```

   `git switch main` wechselt auf den Hauptzweig, `git pull` holt den Stand von GitHub.

## Womit es weitergeht

**Phase 4 – Eigene Ideen** (Roadmap in [[projects/musik-app/docs/Projektvision|Projektvision]]). Vor dem eigentlichen
Start kam das Design dazwischen ([[2026-10-22-design-spielshow|Plan Design Spielshow]] und
[[2026-10-22-design-ueberarbeitung|Plan Design überarbeiten]], beide fertig bis auf die Prüfung an echten Geräten).
Phase 4 selbst ist noch nicht geschärft.

1. **Zuerst fragt Claude, ob vorher etwas anderes ansteht** (neue Ideen, Skills, Tools, Restpunkte). Vorschläge:
   - **Design an echten Geräten prüfen** (Abschluss beider Design-Pläne): ein Spieleabend zur Probe auf Production
     mit Laptop und Handys. Besonders: „Anhalten“ mit echter Musik, Höhe der Auflösung mit Cover (nur simuliert),
     Silbentrennung „Jahr-zehnt“ auf iOS und Android, Playlist-Liste nach der Spotify-Anmeldung. Danach beide Pläne
     auf `status: abgeschlossen`.
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
2. Danach `docs/Tools für später.md` prüfen: Für dieses Projekt ist dort nichts vorgemerkt.
3. Phase 4 mit `grill-with-docs` schärfen: Welche Ideen zuerst? Kandidaten: Scoreboard über einen Spieleabend, Songs
   und Jahre in Supabase (löst auch die Ladezeit beim Vorbereiten), Kategorie und Lösung auf dem Handy, Tisch ganz am
   Handy, Stechen, Bingo-Erkennung abschaltbar, Playwright in der CI, Tisch macht nach dem Neuladen weiter.
4. Den ersten Plan mit `plan-schreiben` schreiben.

Offene Fragen aus dieser Session stehen im [[Lernjournal Phase 4 - Design Spielshow|Journal]]. Punkte fürs Ecosystem:
siehe dessen Übergabe.

## Passende Skills

- `grill-with-docs`: Phase 4 in Fragerunden schärfen, bevor geplant wird
- `frontend-design`: neue Oberflächen in Phase 4 im Stil der Spielshow (Tokens in `app/globals.css`)
- `plan-schreiben`: aus der geklärten Idee den ersten Plan mit prüfbaren Aufgaben
