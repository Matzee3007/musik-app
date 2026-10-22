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

- **Branch:** `main` (nach dem Merge von PR #31)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Branch ohne PR:** `fix/spielstand-broadcast` mit dem Regressionstest `e2e/zwei-runden.spec.ts`. Der ist
  **absichtlich rot**, bis Plan D umgesetzt ist.
- **Production:** `https://musik-bingo.vercel.app` hat Plan C (PR #30) und ist **ab Runde 2 nicht spielbar**: Der Tisch
  überschreitet das Presence-Limit von Supabase und fliegt aus dem Raum (Fehler im Journal, Plan D behebt ihn).

## Vor dem Start

1. Claude Code im Projektordner starten, damit Projekt-`CLAUDE.md` und Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. Auf den Fix-Branch wechseln und `main` hineinholen (dort liegen seit PR #31 Plan D und das Journal):

   ```bash
   git switch fix/spielstand-broadcast
   git pull
   git merge main
   ```

   `git switch` wechselt auf den Branch mit dem roten Test, `git pull` holt ihn von GitHub, `git merge main` bringt
   Plan D aus `main` auf den Branch.

## Womit es weitergeht

**Phase 3 – Mehrspieler, Plan D:** [[2026-10-22-spielstand-broadcast|Spielstand über Broadcast]], vom Entwickler mit
„ok“ bestätigt. Vier Aufgaben, jede mit grünem `npm run check`: Nachrichten im Kanal (ADR 0006 ersetzt
[[0005-spielstand-ueber-presence|ADR 0005]]), Handy über Nachrichten, Tisch über Nachrichten, dann
`e2e/zwei-runden.spec.ts` grün, Doku, PR, `/code-review`, `plan-pruefer`, Merge.

Danach **Spiel mit echten Handys** über mindestens 6 Runden bis zum Bingo (Plan D, Aufgabe 4, Schritt 3). Klappt es,
ist Phase 3 abgeschlossen: Plan C und D auf `status: abgeschlossen`, Roadmap abhaken, Journal und Übergabe.

**Nebenbei vorgemerkt, kein Muss:**

- **Leere Startseite ohne Netz:** Kann das Spotify-Token offline nicht erneuert werden, bleibt die Startseite leer
  (Fund 7, PR #27). Lösung wäre ein `.catch` beim Laden des Tokens in `app/ui/start.tsx`.
- **Funde aus dem Review von PR #24** (kollaborative Playlists, 401 bei „Nochmal versuchen“, leere Liste bei
  `GET /v1/me`): Details in [[2026-10-20-deployment|Plan A]], Aufgabe 4.
- **Ladezeit beim Vorbereiten** (81 Songs gut anderthalb Minuten): Jahre in Supabase (Phase 4) oder im Hintergrund.
- **Test am Laptop mit echtem Player ohne WLAN:** Was tut das Web Playback SDK bei Pause und „Weiterhören“?
- **Aufräumen:** Fehler in `lib/spotify/player.ts` in Meldungen übersetzen, Startzähler nur einmal führen (Funde #8,
  #9 aus PR #20).
- **TypeScript-Option `noUncheckedIndexedAccess`:** eigener kleiner PR (Review PR #19).
- Punkte fürs Ecosystem stehen in der [[docs/Nächste Session|Übergabe des Ecosystems]].

## Passende Skills

- `tdd`: jede Aufgabe von Plan D erst rot, dann grün
- `fertig-pruefen`: vor jedem Commit und vor dem Merge, danach der Agent `plan-pruefer`
- `fehler-diagnose`: falls der Test mit echten Handys wieder etwas zeigt
