---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-18
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-18. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal: [[Lernjournal Phase 0 - Projektstart]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #5)
- **Offene PRs:** keine
- **Nicht committet:** nichts

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` und der Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

## Womit es weitergeht

**Phase 0 – Fundament ist abgeschlossen** (PRs #3, #4, #5). Die nächste Session beginnt mit **Phase 1 – Spiel auf
einem Gerät**.

1. **Claude fragt zuerst, ob etwas anderes ansteht.** Punkte fürs Ecosystem (Agents nach dem SDLC-Artikel,
   Abkürzungen, Obsidian) stehen in der [[docs/Nächste Session|Übergabe des Ecosystems]].
2. Danach [[projects/musik-app/docs/Tools für später|Tools für später]] auf Werkzeuge für Phase 1 prüfen.
3. Den Plan für Phase 1 mit `plan-schreiben` schreiben. Grundlage: „Spielregeln im Detail“ und Roadmap in der
   [[projects/musik-app/docs/Projektvision|Projektvision]], Begriffe im [[projects/musik-app/docs/Glossar|Glossar]]. Spiellogik (Rad, Karte, Songauswahl, Bingo-Erkennung) als reine
   Funktionen in `lib/`, Tisch und Karte nebeneinander am Laptop, feste Songliste.

## Passende Skills

- `plan-schreiben`: Plan für Phase 1
- `tdd`: Spiellogik testgetrieben bauen