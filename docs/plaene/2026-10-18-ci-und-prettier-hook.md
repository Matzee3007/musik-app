---
titel: "Plan: CI und Prettier-Hook"
status: abgeschlossen
erstellt: 2026-10-18
tags: [plan, ci, github-actions, hooks, phase-0]
---

# Plan: CI und Prettier-Hook

**Ziel:** GitHub prüft jeden Pull Request und jeden Push auf `main` automatisch, und Claude Code formatiert und
prüft jede Datei, die Claude ändert, sofort selbst.

**Vorgehen:** Ein Workflow für GitHub Actions führt dieselben Befehle aus wie lokal (`npm ci`, `npm run check`,
`npm run build`). Dass er Fehler wirklich findet, zeigt zuerst eine absichtlich falsch formatierte Probedatei, die
die CI rot macht. Der Hook übernimmt das Muster des ruff-Hooks aus sport-fantasy, mit Prettier und ESLint.

**Technik:** GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v7`), Hooks von Claude Code
(`PostToolUse`), `jq`, Prettier 3.9, ESLint 9.

**Anforderung:** [[Projektvision]] Roadmap Phase 0 („CI mit GitHub Actions“), [[Nächste Session]] Punkt 2.

## Feste Vorgaben

- Node.js 24 in der CI, genau wie lokal (`node --version`: v24.22.0).
- In der CI nur die npm-Skripte aus `package.json`, keine eigenen Befehle. So prüfen lokal und CI dasselbe.
- Kommentare in Workflow und Hook auf Deutsch, im Stil von `sport-fantasy/.github/workflows/ci.yml`.
- Markdown formatiert niemand automatisch (steht in `.prettierignore`), Doku gehört Obsidian.
- Das Repo ist privat und läuft mit GitHub Free. Branch-Schutz (Merge nur bei grüner CI) gibt es dort nicht.
  Deshalb gilt die Regel: vor jedem Merge muss `gh pr checks <nr>` grün sein.
- Vor jedem Commit: `npm run check` mit Exit-Code 0.

## Prüf-Schwerpunkte

1. Claude ändert eine Datei mit Leerzeichen im Pfad (z. B. `app/probe datei.ts`): Der Hook formatiert sie trotzdem.
   → Aufgabe 2, Schritt 1
2. Claude schreibt eine `.ts`-Datei mit Syntaxfehler: Prettier scheitert, und Claude bekommt die Meldung
   (Exit-Code 2), statt dass der Fehler still verschwindet. → Aufgabe 2, Schritt 1
3. Claude ändert eine Markdown-Datei in `docs/`: Der Hook lässt sie unverändert. → Aufgabe 2, Schritt 1
4. Claude ändert eine Datei außerhalb des Projekts (z. B. im Ecosystem): Der Hook tut nichts. → Aufgabe 2, Schritt 1
5. Die CI ist grün, obwohl ein Fehler drin ist, weil ein Schritt gar nicht läuft: Die Probedatei muss die CI rot
   machen. → Aufgabe 1, Schritt 2

## Dateien

| Datei | Neu/Ändern | Zuständig für |
|---|---|---|
| `.github/workflows/ci.yml` | neu | Workflow: Prüfungen bei PR und Push auf `main` |
| `.claude/hooks/prettier-nach-aenderung.sh` | neu | Hook: eine geänderte Datei formatieren und prüfen |
| `.claude/settings.json` | ändern | Hook bei Claude Code anmelden |
| `docs/tools/GitHub Actions - Einrichtung.md` | neu | Wie die CI hier eingerichtet ist, Befehle, Fehler |
| `docs/tools/Claude Code - Einrichtung.md` | neu | Hook und Schutz von `.env` in diesem Projekt |
| `docs/tools/Tools Übersicht.md` | ändern | zwei neue Zeilen unter „Im Einsatz“ |
| `CLAUDE.md` | ändern | Abschnitt „Befehle“: Regel mit `gh pr checks` vor dem Merge |

## Aufgaben

### Aufgabe 1: CI mit GitHub Actions

**Dateien:**
- Neu: `.github/workflows/ci.yml`, `docs/tools/GitHub Actions - Einrichtung.md`
- Ändern: `docs/tools/Tools Übersicht.md`, `CLAUDE.md` (Abschnitt „Befehle“)
- Test: Probedatei `app/ci-probe.ts`, nur vorübergehend

**Schnittstellen:**
- Nutzt: die npm-Skripte `check` und `build` aus `package.json`
- Liefert: einen Check mit dem Namen `CI / check` an jedem PR. `gh pr checks <nr>` zeigt ihn an.

- [x] **Schritt 1: Workflow und falsch formatierte Probedatei schreiben**

`.github/workflows/ci.yml`:
- `name: CI`
- `on:` `pull_request` sowie `push` auf `branches: [main]`
- ein Job `check` auf `ubuntu-latest` mit diesen Schritten: `actions/checkout@v7`, `actions/setup-node@v7` mit
  `node-version: 24` und `cache: npm`, dann `npm ci`, `npm run check` und `npm run build`, jeweils mit einem
  deutschen `name:`

`app/ci-probe.ts` enthält genau eine Zeile: `export const probe   =   1` (falsch formatiert).

- [x] **Schritt 2: Pushen und PR öffnen, die CI muss rot sein**

```bash
git add .github/workflows/ci.yml app/ci-probe.ts
git commit -m "Add CI workflow with failing probe"
git push -u origin feature/ci
gh pr create --draft --title "Add CI with GitHub Actions" --body "…"
gh pr checks --watch
```

Erwartet: `check` mit Status **fail**. In `gh run view --log-failed` meldet `npm run format:check` die Datei
`app/ci-probe.ts`.

- [x] **Schritt 3: Probedatei löschen, die CI muss grün sein**

```bash
git rm app/ci-probe.ts
git commit -m "Remove CI probe"
git push
gh pr checks --watch
```

Erwartet: `check` mit Status **pass**.

- [x] **Schritt 4: Doku**

- `docs/tools/GitHub Actions - Einrichtung.md` (Frontmatter wie alle Notizen) beschreibt:
  - was der Workflow prüft und wann er läuft
  - die Befehle `gh pr checks --watch`, `gh run view --log-failed` und `gh run list`
  - die Freiminuten für private Repos und den fehlenden Branch-Schutz bei GitHub Free
  - den Fehler aus Schritt 2 als Beispiel, mit Ursache und Lösung
  - einen Verweis auf [[GitHub Actions]]. Die allgemeine Notiz liegt bisher nur in sport-fantasy. Das in der
    Übergabe als Restpunkt fürs Ecosystem vermerken.
- `Tools Übersicht.md`: neue Zeile „GitHub Actions | 2026-10-18 | prüft jeden PR automatisch“.
- `CLAUDE.md`, Abschnitt „Befehle“: neue Zeile `gh pr checks <nr>   # vor jedem Merge: CI muss grün sein`.

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add "docs/tools/GitHub Actions - Einrichtung.md" "docs/tools/Tools Übersicht.md" CLAUDE.md
git commit -m "Document CI setup"
git push
gh pr checks --watch
gh pr ready
```

Erwartet: `npm run check` mit Exit-Code 0 und `check` mit Status **pass**. `gh pr ready` nimmt den Entwurfsstatus weg.

### Aufgabe 2: Prettier-Hook nach jeder Änderung

**Dateien:**
- Neu: `.claude/hooks/prettier-nach-aenderung.sh`, `docs/tools/Claude Code - Einrichtung.md`
- Ändern: `.claude/settings.json`, `docs/tools/Tools Übersicht.md`
- Test: Aufrufe von Hand mit JSON auf stdin (Schritt 1), Probedateien in `app/`, die wieder gelöscht werden

**Schnittstellen:**
- Nutzt: nichts aus Aufgabe 1. Beide Aufgaben lassen sich einzeln annehmen oder ablehnen.
- Liefert: Hook-Skript. Eingabe ist JSON auf stdin mit `.tool_input.file_path`. Exit-Code 0 bedeutet „fertig
  oder nicht zuständig“, Exit-Code 2 bedeutet „Meldung auf stderr geht an Claude“.

- [x] **Schritt 1: Prüfaufrufe festlegen, sie müssen fehlschlagen (das Skript gibt es noch nicht)**

Mit `export CLAUDE_PROJECT_DIR="$PWD"` und `h=.claude/hooks/prettier-nach-aenderung.sh`:

| Fall | Vorbereitung | Aufruf | Erwartet |
|---|---|---|---|
| a) formatieren, Pfad mit Leerzeichen | `printf 'export const a   =  1\n' > "app/probe datei.ts"` | `echo "{\"tool_input\":{\"file_path\":\"$PWD/app/probe datei.ts\"}}" \| $h` | Exit 0, Datei enthält danach `export const a = 1;` |
| b) Syntaxfehler | `printf 'export const =\n' > app/probe-kaputt.ts` | wie a), mit `app/probe-kaputt.ts` | Exit 2, Meldung von Prettier auf stderr |
| c) ESLint-Fehler | `app/probe-lint.tsx` mit `import { useState } from "react";` und `export function Probe({ on }: { on: boolean }) { if (on) { useState(0); } return null; }` | wie a), mit `app/probe-lint.tsx` | Exit 2, Meldung von ESLint (`react-hooks/rules-of-hooks`) auf stderr. Unbenutzte Variablen sind nur eine Warnung (Exit 0), deshalb dieser Fall |
| d) Markdown | – | wie a), mit `$PWD/docs/Glossar.md` | Exit 0, `git diff docs/Glossar.md` ist leer |
| e) außerhalb des Projekts | – | wie a), mit `$HOME/claude-ecosystem/README.md` | Exit 0, nichts geändert |

Jetzt `bash -c "…Aufruf a)…"`: Erwartet ist der Fehler „No such file or directory“.

- [x] **Schritt 2: `.claude/hooks/prettier-nach-aenderung.sh` schreiben**

Aufbau wie `sport-fantasy/.claude/hooks/ruff-nach-aenderung.sh`:
- Pfad mit `jq` lesen.
- Nur Dateien unter `$CLAUDE_PROJECT_DIR` mit den Endungen `ts`, `tsx`, `js`, `mjs`, `json`, `css`, `yml`, `yaml`
  bearbeiten, alles andere mit Exit 0 verlassen.
- `npx --no-install prettier --write --log-level warn "$f"` aufrufen. Schlägt das fehl: `exit 2`.
- Bei `ts`, `tsx`, `js` und `mjs` zusätzlich `npx --no-install eslint "$f" >&2 || exit 2`, ohne `--fix` (gleicher
  Grund wie beim ruff-Hook).
- Danach `chmod +x`.

- [x] **Schritt 3: Prüfaufrufe a) bis e) wiederholen, alle müssen das Erwartete liefern, dann Probedateien löschen**

`rm "app/probe datei.ts" app/probe-kaputt.ts app/probe-lint.tsx`

- [x] **Schritt 4: Hook anmelden und im echten Betrieb prüfen**

In `.claude/settings.json` unter `hooks.PostToolUse` einen Eintrag mit `matcher: "Write|Edit"`, Befehl
`"$CLAUDE_PROJECT_DIR"/.claude/hooks/prettier-nach-aenderung.sh`, `timeout: 30` und
`statusMessage: "Prettier prüft die Datei …"`. `permissions.deny` bleibt unverändert.

Prüfen: Claude Code liest die Hooks beim Start ein. Deshalb nach einem Neustart von Claude (oder nach dem Laden mit
`/hooks`) mit Write `app/probe.ts` mit dem Inhalt `export const b   =  2` anlegen. Erwartet: Die Datei enthält
danach `export const b = 2;`. Dann die Datei löschen. Geht das in der Session nicht mehr, kommt der Test als
Restpunkt in die Übergabe.

- [x] **Schritt 5: Doku, prüfen und committen**

- `docs/tools/Claude Code - Einrichtung.md`: welche Hooks und Sperren das Projekt hat, die Prüfaufrufe aus Schritt 1
  als Anleitung zum Testen, Verweis auf [[Claude Code]].
- `Tools Übersicht.md`: [[Claude Code]] bekommt einen Verweis auf die Einrichtungsnotiz.

```bash
npm run check
git add .claude/hooks/prettier-nach-aenderung.sh .claude/settings.json "docs/tools/Claude Code - Einrichtung.md" "docs/tools/Tools Übersicht.md"
git commit -m "Add Prettier and ESLint hook after edits"
git push
gh pr checks --watch
```

Erwartet: `npm run check` mit Exit-Code 0 und `check` mit Status **pass**.

## Nicht in diesem Plan

- **Phasen 1 bis 3 planen** (letzter Punkt von Phase 0): ein eigener Schritt nach diesem Plan, siehe Übergabe.
- **Branch-Schutz:** Den gibt es bei GitHub Free für private Repos nicht. Er ginge erst, wenn das Repo öffentlich
  wird oder ein bezahlter Plan dazukommt.
