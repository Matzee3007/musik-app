---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-18
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-18. Gehört zu [[Projektvision]]. Angelegt von `/projekt-starten`, ab dem ersten
Session-Ende schreibt der Skill `naechste-session` diese Datei.

## Stand bei Sessionende

- **Branch:** `main` (Initial-Commit)
- **Offene PRs:** keine
- **Nicht committet:** nichts

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

## Womit es weitergeht

**Phase 0 – Fundament** läuft. Schon erledigt bei `/projekt-starten` (2026-10-18): Repo, `CLAUDE.md`,
[[0001-stack|ADR 0001]], Node 24, Next.js 16, ESLint, Prettier, Vitest, erster Test grün, `npm run check` mit
Exit-Code 0, `npm run build` läuft.

Die nächsten Aufgaben:

1. `/grill-with-docs Projektvision schärfen`: Ziel, Abgrenzung und Phasen in Fragerunden klären, dazu die
   offenen Fragen der [[Projektvision]] (was zählt bei Titel und Interpret als richtig, Bonusregel, Timer, eigene
   Kategorien). Fachbegriffe wie Tisch, DJ, Runde, Kategorie landen in `docs/Glossar.md`, Entscheidungen als ADR.
2. Danach mit `plan-schreiben` den Plan für den Rest von Phase 0: CI mit GitHub Actions (`npm ci`,
   `npm run check`, `npm run build`), evtl. Hook mit Prettier nach jeder Änderung (wie der ruff-Hook in sport-fantasy).

## Passende Skills

- `grill-with-docs`: Projektvision und Phasen schärfen
- `plan-schreiben`: Plan für Phase 0
- `tdd`: der erste Test
