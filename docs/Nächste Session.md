---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-23
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-23. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 4 - Prototypen Tisch und Handy]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #44)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit Teil 1 des Plans (PR #43): fester Abschnitt zur Runde,
  Wellenlinie, Raum als Schublade, kräftige Kategoriefarben

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

**Phase 4 – Eigene Ideen**, weiter mit dem [[2026-10-23-tisch-und-handy-nach-prototyp|Plan Tisch und Handy nach
den Prototypen]] (Teil 1 fertig, Prototyp-Links im Plan):

1. **Teil 2, Aufgabe 6:** Handy-Karte mit Feldern im Hochformat (3 : 4, ohne Notizen 2 : 3) und Kreuz statt Kreis,
   Branch `feat/handy-karte-hoch`.
2. **Teil 3, Aufgabe 7:** Songliste vor dem Spiel entfernen, nur noch „<n> Songs mit unsicherem Jahr“, ADR 0007,
   Prinzip 4 in der `CLAUDE.md` anpassen, Branch `feat/ohne-songliste`.
3. Danach `plan-pruefer` gegen den Plan und den Plan auf `status: abgeschlossen`.

Nebenbei, wenn Zeit ist:

- **Wellenlinie mit echter Musik ansehen** (`npm run dev`, Playlist wählen): Tempo und Unruhe passen? Die Demo zeigt
  sie nicht.
- **`e2e/raum.spec.ts` beobachten:** fiel einmal bei vollem `npm run e2e` aus, danach grün (Journal, „Fehler und
  Lösungen“). Beim nächsten Ausfall sofort `test-results/` lesen.
- Restpunkte aus der vorigen Übergabe bleiben offen: Prüfung an echten Geräten, leere Startseite ohne Netz (`.catch`
  in `app/ui/start.tsx`), Funde aus PR #24 und PR #20, `noUncheckedIndexedAccess`, Phase 4 mit `grill-with-docs`
  schärfen.

## Passende Skills

- `tdd`: Aufgaben 6 und 7 mit Test zuerst
- `fertig-pruefen`: vor jedem „fertig“ und jedem PR
- `fehler-diagnose`: falls `e2e/raum.spec.ts` wieder ausfällt
