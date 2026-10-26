---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-26
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-26. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 4 - Restpunkte und Dependabot]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #63)
- **Offene PRs:** zwei von Dependabot, bewusst vertagt: #59 TypeScript 5.9 → 7.0 (CI rot), #60 ESLint 9 → 10
  (CI grün). Keine offenen PRs aus der Session.
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit allen Restpunkten vom 2026-10-26 (PR #52 bis #62): CI
  abgesichert, Dependabot an (auch Sicherheits-Updates), Startseite mit Hinweis ohne Netz, Next 16.4.3, React 19.3.1.

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

   `git switch main` wechselt auf den Hauptzweig, `git pull` holt den Stand von GitHub (auch gemergte
   Dependabot-PRs).

3. Neue PRs von Dependabot ansehen. Er öffnet jede Woche welche:

   ```bash
   gh pr list --author 'app/dependabot'
   ```

   Ablauf vor dem Merge (lokal `npm run e2e`, Port 3000 vorher frei):
   [[projects/musik-app/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 4 – Eigene Ideen** läuft weiter. Für den nächsten Schritt gibt es noch keinen Plan. Claude fragt deshalb
zuerst, was als Nächstes ansteht. Vorschläge:

1. **Prüfung an echten Geräten** (am besten an einem Spieleabend):
   - **Vorher Supabase prüfen:** Kostenlose Projekte pausieren nach 7 Tagen ohne Datenbank-Aktivität. Befehl und
     „Resume project“: [[projects/musik-app/docs/tools/Supabase|Supabase]], Abschnitt „Pausiert das kostenlose
     Projekt?“. Dabei notieren, ob es pausiert war: So klärt sich, ob Realtime als Aktivität zählt.
   - Handy: Kreuz und hochkantige Felder auf iOS und Android, auch mit eingeblendeter Adressleiste. Passt die Karte
     mit Notizen und „Bingo!“ ohne Scrollen?
   - Laptop: Wellenlinie mit echter Musik (Tempo, Unruhe), Schublade über dem Rad auf einem 13-Zoll-Laptop.
   - Mit einer echten Playlist: „<n> Songs mit unsicherem Jahr“ vor dem Spiel und „Jahr unsicher“ in der Auflösung.
   - Startseite ohne Netz: WLAN aus, Seite neu laden, erscheint der Hinweis „Spotify ist gerade nicht erreichbar“?
2. **Nächstes Stück Phase 4 mit `grill-with-docs` schärfen**, dann `plan-schreiben`. Offen laut Roadmap: Scoreboard
   über einen Spieleabend, weitere Kategorien, Tisch ganz am Handy, aus Phase 3 verschoben: Songs und
   Erscheinungsjahre in Supabase, Stechen, Bingo-Erkennung abschaltbar, Kategorie und Lösung auch auf dem Handy,
   Playwright in der CI, Tisch macht nach dem Neuladen im Spiel weiter.
3. **Große Updates von Dependabot**, je eine eigene kleine Aufgabe:
   - #59 TypeScript 7.0: CI rot, mit `fehler-diagnose` eingrenzen (`gh run view <id> --log-failed`).
   - #60 ESLint 10: CI grün, trotzdem lesen, was sich geändert hat (Regeln, `eslint-config-next`), und `npm run e2e`.
4. **Restpunkte**, wenn Zeit ist:
   - Aus dem Review von PR #55: `app/ui/vorbereiten-ansicht.tsx` (`tokenHolen`) hat dieselbe Lücke ohne Netz wie
     vorher die Startseite, der Spieler bekommt dann ein rohes „Failed to fetch“.
   - Beobachten: In #62 kamen `react` und `react-dom` in die Gruppe `npm-klein` statt in `react`. Beim nächsten
     großen React-Update prüfen, ob die Gruppe greift, sonst `.github/dependabot.yml` anpassen.
   - Aus dem Review von PR #45: Karte im Querformat oder auf dem Tablet mit „Notizen aus“ höher als der Bildschirm;
     Idee, die Kartengröße aus der Bildschirmhöhe zu berechnen statt aus festen Grenzen (800 px, `py-4`).
   - `e2e/raum.spec.ts` beobachten: fiel einmal bei vollem `npm run e2e` aus, am 2026-10-26 fünfmal grün (alle Läufe mit 13 von 13). Beim nächsten
     Ausfall sofort `test-results/` lesen.
   - Aus älteren Übergaben: Funde aus PR #24 und PR #20, `noUncheckedIndexedAccess`.

Punkte fürs Ecosystem und für tages-dashboard aus dieser Session stehen in deren Übergaben.

Vor dem Start eines neuen Plans `docs/Tools für später.md` auf vorgemerkte Werkzeuge für Phase 4 prüfen.

## Passende Skills

- `grill-with-docs`: das nächste Stück Phase 4 in Fragerunden klären
- `plan-schreiben`: daraus einen Plan in prüfbaren Aufgaben machen
- `fehler-diagnose`: für die rote CI von #59 (TypeScript 7) oder wenn an echten Geräten etwas nicht passt
