---
titel: Dependabot - Einrichtung
status: aktiv
erstellt: 2026-10-26
tags: [tools, github, dependabot, einrichtung]
---

# Dependabot: Einrichtung in musik-app

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Dependabot ist ein Dienst von GitHub, der
von selbst PRs öffnet, wenn ein Paket eine neue Version hat (**Versions-Updates**) oder eine bekannte Sicherheitslücke
(**Sicherheits-Updates**). Jeder dieser PRs läuft durch die CI
([[projects/musik-app/docs/tools/GitHub Actions - Einrichtung|GitHub Actions]]).

## Wie haben wir es eingerichtet?

1. **2026-10-26, Phase 4:** `.github/dependabot.yml`, Restpunkt aus der Werkzeug-Inventur im Ecosystem:
   - `npm`: einmal pro Woche. Kleine Updates (minor, patch) kommen gesammelt in einem PR (Gruppe `npm-klein`), große
     (major) einzeln, weil sie oft Umbauten brauchen.
   - `github-actions`: einmal pro Woche, z. B. `actions/checkout@v7` → `@v8`.

Die Versions-Updates regelt die Datei. Die Warnungen und Sicherheits-Updates sind eine Einstellung des Repos
(GitHub → Settings → Code security), sie waren am 2026-10-26 aus.

## Typischer Ablauf

1. Dependabot öffnet einen PR, z. B. „Bump the npm-klein group with 4 updates“.
2. Die CI prüft ihn. Vercel baut eine Vorschau.
3. Grün: mergen. Rot: das Paket hat etwas geändert, mit `fehler-diagnose` eingrenzen oder den PR schließen.

## Befehle

```bash
gh pr list --author 'app/dependabot'   # offene PRs von Dependabot
gh pr checks <nr>                      # CI-Ergebnis vor dem Merge
gh api repos/Matzee3007/musik-app/automated-security-fixes   # sind Sicherheits-Updates an?
```
