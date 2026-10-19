---
titel: GitHub Actions - Einrichtung
status: aktiv
erstellt: 2026-10-18
tags: [tools, github, ci, einrichtung]
---

# GitHub Actions: Einrichtung in musik-app

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. GitHub Actions sind automatische Abläufe auf GitHub, beschrieben in YAML-Dateien unter
`.github/workflows/`. Sie laufen auf frischen Linux-Rechnern von GitHub (Runner). Prüft so ein Ablauf jeden Push,
nennt man das **CI** (Continuous Integration). Die ausführliche Notiz mit allen Begriffen liegt bisher nur in
sport-fantasy (`projects/sport-fantasy/docs/tools/GitHub Actions.md`) und soll ins Ecosystem umziehen.

## Was prüft die CI?

Workflow `.github/workflows/ci.yml`, Job `check`, bei jedem Pull Request und jedem Push auf `main`:

1. `actions/checkout@v7` holt das Repo, `actions/setup-node@v7` installiert Node 24 (wie lokal) mit npm-Cache.
2. `npm ci`: Abhängigkeiten genau nach `package-lock.json`.
3. `npm run check`: lint, format:check, typecheck, test.
4. `npm run build`: Produktionsfassung bauen.

Die CI benutzt nur die npm-Skripte aus `package.json`. So prüfen lokal und CI dasselbe. Ein Lauf dauert etwa
40 Sekunden.

## Wie haben wir es eingerichtet?

1. **2026-10-18, Phase 0:** `ci.yml` mit PR #4, nach dem Plan
   [[2026-10-18-ci-und-prettier-hook|Plan: CI und Prettier-Hook]]. Zuerst mit einer absichtlich falsch formatierten
   Probedatei: Die CI wurde rot. Nach dem Löschen der Datei wurde sie grün. So ist belegt, dass sie Fehler findet.

## Regeln

- **Vor jedem Merge `gh pr checks <nr>`: Die CI muss grün sein.** Das Repo ist privat und läuft mit GitHub Free.
  Dort gibt es keinen Branch-Schutz, GitHub verbietet einen Merge bei roter CI also nicht von selbst.
- Private Repos haben bei GitHub Free ein Kontingent an Freiminuten pro Monat (Stand: 2000 Minuten). Verbrauch unter
  GitHub → Settings → Billing. Bei rund 40 Sekunden pro Lauf reicht das weit.

## Befehle

```bash
gh pr checks --watch           # Checks des PRs zum aktuellen Branch anzeigen und warten, bis sie fertig sind
gh pr checks <nr>              # Checks eines bestimmten PRs, vor jedem Merge
gh run list                    # letzte Läufe aller Workflows
gh run view <id> --log-failed  # nur die Log-Zeilen der fehlgeschlagenen Schritte
```

## Fehler

**`[warn] app/ci-probe.ts` / `Code style issues found in the above file`, Exit-Code 1 im Schritt „Prüfungen“**
(2026-10-18, absichtlich):
- Ursache: Die Datei war nicht nach Prettier formatiert, `prettier . --check` in `npm run format:check` schlägt fehl.
- Lösung: lokal `npm run format`, dann committen. Bei Dateien, die Claude ändert, erledigt das künftig der
  Prettier-Hook ([[projects/musik-app/docs/tools/Claude Code - Einrichtung|Claude Code - Einrichtung]]).
