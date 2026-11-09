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
   - `npm`: einmal pro Woche. Pakete, die nur zusammen gehen, kommen immer in einem PR, auch bei großen Updates:
     Gruppe `next` (`next`, `eslint-config-next`) und Gruppe `react` (`react`, `react-dom` und ihre Typen). Sonst
     kommen kleine Updates (minor, patch) gesammelt (Gruppe `npm-klein`), große (major) einzeln, weil sie oft Umbauten
     brauchen. Ein Paket landet in der ersten Gruppe, die passt.
   - Große Updates von `@types/node` ignoriert Dependabot: Die Typen sollen zu Node 24 passen, auf dem die App läuft.
   - **2026-11-08:** TypeScript ab 7 ignoriert Dependabot (`versions: [">=7.0.0"]`, TypeScript 6 bleibt erlaubt).
     PR #59 (TypeScript 5.9 → 7.0) brach `npm run lint` mit `typescript-eslint does not support TS 7.0.`. Ursache:
     `typescript-eslint` aus `eslint-config-next` unterstützt höchstens TypeScript 6.0. Lösung: Eintrag in `ignore`,
     #59 mit `gh pr close 59` geschlossen (ein neuer `ignore`-Eintrag schließt offene PRs nicht sicher von selbst).
     Wieder entfernen, sobald `npm view @typescript-eslint/parser peerDependencies` TypeScript 7 einschließt
     (2026-11-08: `>=4.8.4 <6.1.0`).
   - `github-actions`: einmal pro Woche, alle Actions in einem PR (Gruppe `actions`), z. B. `actions/checkout@v7` →
     `@v8`.

Die Versions-Updates regelt die Datei. Die Warnungen und Sicherheits-Updates sind eine Einstellung des Repos
(GitHub → Settings → Code security), eingeschaltet am 2026-10-26 nach dem Merge der Datei.

## Typischer Ablauf

1. Dependabot öffnet einen PR, z. B. „Bump the npm-klein group with 4 updates“.
2. Die CI prüft ihn. Vercel baut eine Vorschau.
3. Die CI prüft kein Playwright. Deshalb vor dem Merge den Branch lokal holen und `npm run e2e` laufen lassen.
   Ist `@playwright/test` dabei, vorher `npx playwright install` (neue Browser), danach die Playwright-Agents neu
   erzeugen (siehe [[Playwright]]).
4. Grün: mergen. Rot: das Paket hat etwas geändert, mit `fehler-diagnose` eingrenzen.
   - Rot nur bei `format:check` nach einem Prettier-Update: Prettier formatiert jetzt anders. Im Branch
     `npm run format` ausführen, committen, pushen. Nicht den ganzen PR schließen, sonst gehen die anderen Updates
     der Gruppe mit verloren.
5. Mehrere PRs auf einmal: einen nach dem anderen mergen. Jeder Merge ändert `package-lock.json`, die übrigen PRs stehen
   danach oft auf `CONFLICTING`. Dann mit `gh pr comment <nr> --body "@dependabot rebase"` neu aufbauen lassen und die
   CI abwarten. Bei einem Sammel-PR kann Dependabot dabei den alten PR schließen („no longer needed“) und einen neuen
   mit weiteren Updates öffnen (2026-11-09: #77 → #83, jetzt mit Playwright). Den neuen PR wie einen frischen prüfen.

## Fehler und Meldungen

- **`npm audit` meldet 10 moderate Lücken** (2026-11-09): Alle kommen aus `minimatch` 7–11 (GHSA-g3hv-75wg-m249,
  Denial of Service über Glob-Muster) über `@typescript-eslint`. Das ist ein Entwicklungswerkzeug, kein Code, der in
  der App läuft. `npm audit fix --force` würde große Versionssprünge erzwingen, deshalb bleibt es liegen, bis
  `typescript-eslint` eine neue Version mitbringt.
- **`.mcp.json` nach `npx playwright init-agents` geändert** (2026-11-09): Der Generator schreibt das Array mehrzeilig
  und ohne Zeilenumbruch am Ende, Prettier hatte die Datei glattgezogen. Am Inhalt ändert sich nichts:
  `git restore .mcp.json`.

## Befehle

```bash
gh pr list --author 'app/dependabot'   # offene PRs von Dependabot
gh pr checkout <nr>                    # Branch eines PRs lokal holen, z. B. für npm run e2e
gh pr checks <nr>                      # CI-Ergebnis vor dem Merge
gh api repos/Matzee3007/musik-app/automated-security-fixes   # sind Sicherheits-Updates an?
```
