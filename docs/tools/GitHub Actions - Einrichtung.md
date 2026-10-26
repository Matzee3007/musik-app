---
titel: GitHub Actions - Einrichtung
status: aktiv
erstellt: 2026-10-18
tags: [tools, github, ci, einrichtung]
---

# GitHub Actions: Einrichtung in musik-app

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. GitHub Actions sind automatische Abläufe auf GitHub, beschrieben in YAML-Dateien unter
`.github/workflows/`. Sie laufen auf frischen Linux-Rechnern von GitHub (Runner). Prüft so ein Ablauf jeden Push,
nennt man das **CI** (Continuous Integration). Begriffe, Befehle und Fehler stehen in der Werkzeug-Notiz des
Ecosystems: [[GitHub Actions]]. Hier steht nur, wie es in diesem Projekt eingerichtet ist.

## Was prüft die CI?

Workflow `.github/workflows/ci.yml`, Job `check`, bei jedem Pull Request und jedem Push auf `main`:

1. `actions/checkout@v7` holt das Repo, `actions/setup-node@v7` installiert Node 24 (wie lokal) mit npm-Cache.
2. `npm ci`: Abhängigkeiten genau nach `package-lock.json`.
3. `npm run check`: lint, format:check, typecheck, test.
4. `npm run build`: Produktionsfassung bauen.

Die CI benutzt nur die npm-Skripte aus `package.json`. So prüfen lokal und CI dasselbe. Ein Lauf dauert etwa
1,5 bis 2 Minuten (Stand 2026-10-26).

Drei Einstellungen sichern den Workflow ab:

- `concurrency` mit `cancel-in-progress`: Ein neuer Push in einen PR bricht dessen noch laufenden Lauf ab, das
  spart Freiminuten. Bei einem PR ist die Gruppe seine Nummer, also eine je PR. Auf `main` hat jeder Commit seine
  eigene Gruppe (`github.sha`), und `cancel-in-progress` gilt nur bei `pull_request`: Dort bricht nichts ab. Grund: In
  einer Gruppe läuft höchstens ein Lauf und einer wartet. Ein neuer wartender Lauf verdrängt den alten, auch ohne
  `cancel-in-progress`.
- `permissions: contents: read`: Das Token der CI (`GITHUB_TOKEN`) darf das Repo nur lesen. Ein manipuliertes
  npm-Paket, das während `npm ci` läuft, kann damit nichts ins Repo schreiben. Code ausführen und Daten nach außen
  schicken kann es trotzdem, deshalb später keine Geheimnisse (Secrets) in die CI, ohne das neu zu bedenken.
- `timeout-minutes: 10`: Ein hängender Lauf bricht nach 10 Minuten ab, nicht erst nach der Grenze von GitHub
  (6 Stunden).

## Wie haben wir es eingerichtet?

1. **2026-10-18, Phase 0:** `ci.yml` mit PR #4, nach dem Plan
   [[2026-10-18-ci-und-prettier-hook|Plan: CI und Prettier-Hook]]. Zuerst mit einer absichtlich falsch formatierten
   Probedatei: Die CI wurde rot. Nach dem Löschen der Datei wurde sie grün. So ist belegt, dass sie Fehler findet.
2. **2026-10-26, Phase 4:** `concurrency`, `permissions` und `timeout-minutes` ergänzt, wie in tages-dashboard
   (Fund aus dessen `/code-review` von PR #4).

## Regeln

- **Vor jedem Merge `gh pr checks <nr>`: Die CI muss grün sein.** Das Repo ist privat und läuft mit GitHub Free.
  Dort gibt es keinen Branch-Schutz, GitHub verbietet einen Merge bei roter CI also nicht von selbst.
- Private Repos haben bei GitHub Free ein Kontingent an Freiminuten pro Monat (Stand: 2000 Minuten). Verbrauch unter
  GitHub → Settings → Billing. Bei rund 2 Minuten pro Lauf reicht das weit.

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

**Lauf auf `main` „cancelled“ nach wenigen Sekunden** (2026-10-26, Merge von PR #53):
- Ursache: PR #52, #53 und #55 wurden kurz nacheinander gemergt, alle Läufe hatten dieselbe `concurrency`-Gruppe
  `ci-refs/heads/main`. Der Lauf zu #53 wartete hinter dem zu #52, der zu #55 verdrängte ihn. Das passiert auch mit
  `cancel-in-progress: false`: Eine Gruppe hat höchstens einen laufenden und einen wartenden Lauf.
- Lösung: Auf `main` eine Gruppe je Commit (`github.sha`), PR #61. Der Inhalt von #53 war mit dem grünen Lauf zu
  #55 trotzdem geprüft.
