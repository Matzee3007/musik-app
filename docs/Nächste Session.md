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

- **Branch:** `main` (nach dem Merge von PR #47)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit dem ganzen
  [[2026-10-23-tisch-und-handy-nach-prototyp|Plan Tisch und Handy nach den Prototypen]] (PR #43, #45, #46, Plan
  abgeschlossen): hochkantige Felder mit Kreuz am Handy, keine Songliste vor dem Spiel, „Jahr unsicher“ in der
  Auflösung ([[0007-keine-songliste-vor-dem-spiel|ADR 0007]])

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

**Phase 4 – Eigene Ideen** läuft weiter, der Plan zu Tisch und Handy ist fertig. Für den nächsten Schritt gibt es
noch keinen Plan. Claude fragt deshalb zuerst, was als Nächstes ansteht. Vorschläge:

1. **Prüfung an echten Geräten** (am besten an einem Spieleabend):
   - Handy: Kreuz und hochkantige Felder auf iOS und Android, auch mit eingeblendeter Adressleiste. Passt die Karte
     mit Notizen und „Bingo!“ ohne Scrollen?
   - Laptop: Wellenlinie mit echter Musik (Tempo, Unruhe), Schublade über dem Rad auf einem 13-Zoll-Laptop.
   - Mit einer echten Playlist: „<n> Songs mit unsicherem Jahr“ vor dem Spiel und „Jahr unsicher“ in der Auflösung.
2. **Nächstes Stück Phase 4 mit `grill-with-docs` schärfen**, dann `plan-schreiben`. Offen laut Roadmap: Scoreboard
   über einen Spieleabend, weitere Kategorien, Tisch ganz am Handy, aus Phase 3 verschoben: Songs und
   Erscheinungsjahre in Supabase, Stechen, Bingo-Erkennung abschaltbar, Kategorie und Lösung auch auf dem Handy,
   Playwright in der CI, Tisch macht nach dem Neuladen im Spiel weiter.
3. **Restpunkte**, wenn Zeit ist:
   - Aus dem Review von PR #45: Karte im Querformat oder auf dem Tablet mit „Notizen aus“ höher als der Bildschirm;
     Idee, die Kartengröße aus der Bildschirmhöhe zu berechnen statt aus festen Grenzen (800 px, `py-4`).
   - `e2e/raum.spec.ts` beobachten: fiel einmal bei vollem `npm run e2e` aus, heute viermal grün. Beim nächsten
     Ausfall sofort `test-results/` lesen.
   - CI absichern wie in tages-dashboard (dort Fund aus dem `/code-review` von PR #4, 2026-10-25):
     `.github/workflows/ci.yml` ohne `timeout-minutes`, ohne `concurrency` und ohne `permissions: contents: read`.
   - Aus der Werkzeug-Inventur im Ecosystem (2026-10-25): Dependabot einrichten (`.github/dependabot.yml`, PRs bei
     neuen Paketversionen und Sicherheitslücken). Prüfen, ob das kostenlose Supabase-Projekt `musik-bingo` zwischen
     Spieleabenden pausiert. Falls ja: vor dem Abend wecken oder für Realtime PartyKit vergleichen.
   - Aus älteren Übergaben: leere Startseite ohne Netz (`.catch` in `app/ui/start.tsx`), Funde aus PR #24 und PR #20,
     `noUncheckedIndexedAccess`.

Vor dem Start eines neuen Plans `docs/Tools für später.md` auf vorgemerkte Werkzeuge für Phase 4 prüfen.

## Passende Skills

- `grill-with-docs`: das nächste Stück Phase 4 in Fragerunden klären
- `plan-schreiben`: daraus einen Plan in prüfbaren Aufgaben machen
- `fehler-diagnose`: falls `e2e/raum.spec.ts` wieder ausfällt oder an echten Geräten etwas nicht passt
