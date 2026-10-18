---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-18
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-18. Gehört zu [[Projektvision]], letztes Journal: [[Lernjournal Phase 0 - Projektstart]].

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

1. **Claude fragt zuerst, ob etwas anderes ansteht.** Vorschläge:
   - **Agents nach dem SDLC-Artikel (Ecosystem):** einen Code-Reviewer (vorher testen, ob das eingebaute
     `/code-review` reicht) und einen Verifier als nur lesende Agents in `agents/qualitaets-agents/`, dazu eine
     `REVIEW.md` je Projekt. Bewertung im [[Lernjournal Phase 0 - Projektstart|Journal]] unter „AI-native SDLC
     Playbook“.
   - **Ecosystem-Restpunkte:** Abkürzungen `SDLC` (Software Development Lifecycle) und `YAGNI` (You Aren't Gonna
     Need It) in `~/claude-ecosystem/docs/Abkürzungen.md` eintragen. Die allgemeine Notiz „GitHub Actions“ liegt nur
     in sport-fantasy und soll nach `docs/werkzeuge/` umziehen. Regel „zweimal derselbe Fehler, dann in die
     `CLAUDE.md`“ für die globale `CLAUDE.md` prüfen.
   - **Obsidian:** `node_modules` ausblenden (Einstellungen → Dateien und Links → Ausgeschlossene Dateien), falls
     noch nicht geschehen.
2. Danach [[Tools für später]] auf Werkzeuge für Phase 1 prüfen.
3. Den Plan für Phase 1 mit `plan-schreiben` schreiben. Grundlage: „Spielregeln im Detail“ und Roadmap in der
   [[Projektvision]], Begriffe im [[Glossar]]. Spiellogik (Rad, Karte, Songauswahl, Bingo-Erkennung) als reine
   Funktionen in `lib/`, Tisch und Karte nebeneinander am Laptop, feste Songliste.

## Passende Skills

- `plan-schreiben`: Plan für Phase 1
- `tdd`: Spiellogik testgetrieben bauen
- `agent-texte-schreiben`: falls zuerst die Agents fürs Ecosystem entstehen
