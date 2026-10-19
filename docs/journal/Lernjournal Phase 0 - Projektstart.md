---
titel: Lernjournal Phase 0 - Projektstart
status: abgeschlossen
phase: 0
erstellt: 2026-10-18
tags: [lernjournal, phase-0, projekt-starten, spotify, musicbrainz, nextjs, typescript, node, vitest, grill-with-docs, github-actions, hooks]
---

# Lernjournal Phase 0: Projektstart

Erstes Journal der Musik-App. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]]. Angelegt in einer Session im Ecosystem mit
`/projekt-starten Musik-App`, dort im Journal [[Lernjournal 2026-10-18 - Ecosystem aufbauen]].

## Erledigt

- [x] Projekt geklärt (Skill `projekt-starten`, Fragerunden): Name `musik-app`, Ziel Hitster Bingo als Web-App für
  Spieleabende mit Freunden, Lernziel TypeScript und Spotify, Laptop als „Tisch“, Handys für Karte und Antworten
- [x] Spielregeln des Originals und die aktuelle Spotify-Doku gelesen, MusicBrainz mit einer echten Abfrage getestet
- [x] Gerüst aus der Vorlage des Ecosystems ausgefüllt: [[projects/musik-app/docs/Projektvision|Projektvision]], `CLAUDE.md`, [[projects/musik-app/docs/adr/0001-stack|ADR 0001]],
  [[projects/musik-app/docs/Arbeitsumgebung|Arbeitsumgebung]]
- [x] Node 24.22 über Homebrew, Next.js 16.4.2 mit React 19.3, TypeScript 5.9, Tailwind CSS 4, ESLint 9, Prettier 3.9,
  Vitest 5, siehe [[Next.js.md|Next.js]] und [[Vitest, ESLint und Prettier]]
- [x] Erster Test (Startseite zeigt „Musik-App“) erst rot, dann grün, `npm run check` Exit 0, `npm run build` läuft
- [x] Privates Repo `Matzee3007/musik-app`, erster Commit direkt auf `main`
- [x] Links im Vault repariert und `node_modules/` von der Vault-Prüfung ausgeschlossen (PR #1)
- [x] Projektvision mit `/grill-with-docs` geschärft (zweite Session am 2026-10-18, PR #3): [[projects/musik-app/docs/Glossar|Glossar]] mit
  15 Begriffen, [[0002-spieler-pruefen-selbst|ADR 0002]] (die App prüft keine Antworten), Spielregeln im Detail in der
  [[projects/musik-app/docs/Projektvision|Projektvision]], Prinzipien 2, 3 und 5 in Vision und `CLAUDE.md` angepasst
- [x] Plan [[2026-10-18-ci-und-prettier-hook|Plan: CI und Prettier-Hook]] mit `plan-schreiben` geschrieben und
  umgesetzt (PR #4)
- [x] CI mit GitHub Actions: `.github/workflows/ci.yml` erst rot mit Probedatei, dann grün, Doku in
  [[projects/musik-app/docs/tools/GitHub Actions - Einrichtung|GitHub Actions - Einrichtung]]
- [x] Prettier- und ESLint-Hook nach jeder Änderung durch Claude, fünf Prüfaufrufe bestanden, Doku in
  [[projects/musik-app/docs/tools/Claude Code - Einrichtung|Claude Code - Einrichtung]]
- [x] Roadmap-Punkt „Phasen 1 bis 3 geplant“ ersetzt: Jede Phase wird zu Beginn mit `plan-schreiben` geplant, für
  Phase 2 und 3 wäre ein Plan heute Raten
- [x] Artikel „AI-native SDLC Playbook“ gegen das Ecosystem bewertet, Ergebnis unter „Neu gelernt“
- [x] Phase 0 abgeschlossen, PRs #3 und #4 gemergt

## Befehle: Stack einrichten

```bash
brew install node@24 && brew link --force node@24
npx create-next-app@latest musik-app --yes --use-npm --disable-git
npm ci
npm install -D @types/node@^24
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
npm install -D --save-exact prettier@3.9.10
npm install -D eslint-config-prettier
npm install-scripts deny unrs-resolver
npm run check
npm run build
```

- `brew link --force node@24`: `node@24` ist keg-only, also nicht im PATH. `--force` legt es trotzdem hinein.
- `create-next-app … --yes`: Gerüst mit den empfohlenen Einstellungen. Im Scratchpad erzeugt, weil der Projektordner
  schon `CLAUDE.md`, `README.md` und `docs/` hatte, danach nur die nötigen Dateien kopiert.
- `npm ci`: installiert genau die Versionen aus `package-lock.json`.
- `--save-exact`: Prettier in fester Version, sonst ändert ein Update die Formatierung.
- `npm install-scripts deny unrs-resolver`: npm 11 führt Installationsskripte nur nach Freigabe aus. Das Skript
  lädt nur eine Ersatzdatei, ESLint läuft ohne.
- `npm run check`: lint, format:check, typecheck, test. Prüfbefehl vor jedem Commit.
- `npm run build`: Produktionsfassung, so wie später auf Vercel.

## Befehle: Repo und Vault

```bash
git init -b main
gh repo create musik-app --private --source=. --push
obsidian links path="projects/musik-app/docs/tools/Tools Übersicht.md"
obsidian backlinks path="projects/musik-app/docs/tools/Next.js.md"
```

- `git init -b main`: macht den Ordner zum eigenen Repo. Vorher meldete `git status` das Ecosystem-Repo darüber.
- `gh repo create … --private --source=. --push`: Repo auf GitHub anlegen und den ersten Commit hochladen.
- `obsidian links` / `backlinks`: wohin eine Notiz verlinkt bzw. wer auf sie verlinkt, so wie Obsidian auflöst.

## Neu gelernt

### Spotify im Development Mode

Eine App von Privatleuten bleibt im Development Mode: höchstens 5 freigeschaltete Konten, der Besitzer braucht Premium,
Extended Quota gibt es seit Mai 2025 nur für Firmen mit 250.000 Nutzern im Monat. Deshalb meldet sich nur der DJ an,
die Mitspieler treten über einen Raum-Code bei. Quellen: Quota Modes und Migration Guide auf developer.spotify.com.

### Abspielen ja, Playlist lesen nur bei eigenen

Jeder Song lässt sich über seine Spotify-Kennung abspielen. Seit Februar 2026 liefert die API aber nur bei eigenen oder
kollaborativen Playlists die Songliste. Fremde Playlists (auch die offiziellen von Hitster) zeigen nur ihre
Beschreibung. Abhilfe: Songs in der Spotify-App in eine eigene Playlist kopieren. Spotify nennt als Grund KI und
Automatisierung und den Schutz der Künstler.

### Web Playback SDK

Die Bibliothek von Spotify, die im Browser abspielt. Braucht Premium beim angemeldeten Konto. Auf iOS startet die
Wiedergabe nicht von allein, der Nutzer muss tippen. `preview_url` (30 Sekunden) liefert die API nicht mehr
zuverlässig, den 15-Sekunden-Ausschnitt steuert die App selbst.

### Das richtige Erscheinungsjahr

Spotify liefert das Jahr des Albums, bei Remastern und Best-ofs falsch. MusicBrainz ist eine freie Musikdatenbank ohne
Schlüssel, mit Feld `first-release-date`, höchstens 1 Anfrage pro Sekunde und Pflicht zum User-Agent. Eine Suche nach
„Bohemian Rhapsody“ von Queen fand vor allem Live-Versionen und Remixe (1992, 2002, 2017 …), das Original von 1975 war
nicht unter den ersten 10. Plan für Phase 2: über den ISRC (weltweite Kennnummer einer Aufnahme) suchen, frühestes
Datum ohne Live-Versionen, einmal je Playlist speichern, der DJ kann korrigieren.

### Hitster Bingo im Original

Unsere Kategorien sind Seite B („Experten“): Titel, Interpret, Jahrzehnt, genaues Jahr, ±3 Jahre. Seite A hat andere
(„Vor 2000?“, „Gruppe oder Solo“, ±2, ±4). Dazu ein Timer von 25 Sekunden und eine Bonusregel: genaues Jahr bei einer
±-Kategorie erlaubt, ein Feld eines anderen abzuhaken. Gewonnen hat, wer zuerst eine Reihe hat.

### `AGENTS.md` von Next.js

Next.js legt eine Anleitung für KI-Agenten an: Vor dem Schreiben von Code die Doku der installierten Version in
`node_modules/next/dist/docs/` lesen. Claude Code liest `AGENTS.md` nicht von selbst, deshalb steht `@AGENTS.md` in
der `CLAUDE.md`.

### npm hält Installationsskripte zurück

npm 11 führt Skripte, die beim Installieren laufen würden, erst nach Freigabe aus. Das schützt vor Schadcode in
Paketen. Mit `npm install-scripts ls` sieht man, was wartet, `approve` oder `deny` hält die Entscheidung in
`package.json` fest.

## Fehler und Lösungen

### `npm error ERESOLVE … peerOptional @types/node@"^22.0.0 || >=24.0.0" from vitest@5.0.5`

- **Wo:** `npm install -D vitest …`
- **Ursache:** `create-next-app` trägt `@types/node@^20` ein, Vitest 5 verlangt mindestens 22.
- **Lösung:** `npm install -D @types/node@^24` passend zu Node 24, nicht mit `--force` übergehen.
- **Prüfen:** `npm ls --depth=0` zeigt `vitest@5.0.5` und `@types/node@24.19.2`.

### `error TS2304: Cannot find name 'LayoutProps'`

- **Wo:** `npx tsc --noEmit`
- **Ursache:** Next.js erzeugt den Typ in `.next/types/`, der Ordner fehlte nach dem Kopieren.
- **Lösung:** `"typecheck": "next typegen && tsc --noEmit"`.
- **Prüfen:** `npm run check` → Exit 0.

### `curl: (77) error adding trust anchors from file: /opt/anaconda3/ssl/cacert.pem`

- **Wo:** erste Abfrage von MusicBrainz
- **Ursache:** Das `curl` von Anaconda findet seine Zertifikate nicht.
- **Lösung:** `/usr/bin/curl` von macOS.
- **Prüfen:** Die Antwort enthält `recordings`.

### `{"error": "The MusicBrainz web server is currently busy. Please try again later."}`

- **Wo:** mehrere Abfragen kurz hintereinander
- **Ursache:** Limit von 1 Anfrage pro Sekunde.
- **Lösung:** Antwort erst auf `error` prüfen, nach Pause erneut. In der App: Jahre nicht während des Spiels holen.
- **Prüfen:** Die Abfrage liefert zehn Aufnahmen mit `first-release-date`.

### Notiz „Next.js“ verwaist, obwohl verlinkt

- **Wo:** `pruefen.py --wurzel projects/musik-app` (Vault-Prüfung)
- **Ursache:** Obsidian liest `[[Next.js]]` als Datei mit Endung `.js` und löst auf
  `node_modules/next/dist/server/next.js` auf. Dazu las das Skript rund 1.200 README-Dateien aus `node_modules/`.
- **Lösung:** `[[Next.js.md|Next.js]]`, in Tabellen mit `\|`. `node_modules/` in `.vault-pruefung.json` ausgeschlossen.
- **Prüfen:** `obsidian backlinks path=…/Next.js.md` zeigt 3 Notizen, `pruefen.py` → SAUBER.

## Befehle: Fragerunde und Plan

```bash
git checkout -b docs/projektvision-schaerfen
git switch -c feature/ci
gh api repos/actions/setup-node/releases/latest -q '.tag_name'
gh repo view --json visibility -q .visibility
```

- `git checkout -b` / `git switch -c`: neuen Branch anlegen und hineinwechseln, ein Branch pro Feature.
- `gh api repos/<owner>/<repo>/releases/latest`: neueste Version einer GitHub Action nachsehen, statt eine alte
  aus dem Gedächtnis zu nehmen (heute `checkout@v7`, `setup-node@v7`).
- `gh repo view --json visibility`: zeigt, ob das Repo privat ist. Wichtig für Branch-Schutz (siehe unten).

## Befehle: CI und PRs

```bash
gh pr create --draft --title "…" --body "…"
gh pr checks --watch
gh run view <id> --log-failed
gh pr ready 4
gh pr update-branch 3
gh pr merge 4 --merge --delete-branch
```

- `gh pr create --draft`: PR als Entwurf öffnen, solange er noch nicht zum Mergen gedacht ist.
- `gh pr checks --watch`: wartet, bis die CI des PRs fertig ist, und zeigt `pass` oder `fail`.
- `gh run view <id> --log-failed`: nur die Log-Zeilen des fehlgeschlagenen Schritts, z. B. welche Datei Prettier
  bemängelt.
- `gh pr ready`: Entwurfsstatus wegnehmen.
- `gh pr update-branch`: holt den neuen Stand von `main` in den Branch eines PRs. PR #3 war älter als die CI und
  bekam so erst seinen ersten Check.
- `gh pr merge --merge --delete-branch`: PR mit Merge-Commit übernehmen und den Branch löschen.

## Befehle: Hook testen

```bash
chmod +x .claude/hooks/prettier-nach-aenderung.sh
echo "{\"tool_input\":{\"file_path\":\"$PWD/app/probe datei.ts\"}}" | .claude/hooks/prettier-nach-aenderung.sh
```

- `chmod +x`: macht das Skript ausführbar, sonst kann Claude Code es nicht starten.
- `echo '{…}' | <hook>`: spielt Claude Code nach. Der Hook liest das JSON von stdin, so lässt er sich ohne Claude
  prüfen.

## Neu gelernt (zweite Session)

### Skills, die nur der Entwickler starten kann

`disable-model-invocation: true` im Frontmatter einer `SKILL.md` versteckt den Skill vor Claude. Er läuft nur, wenn
der Entwickler `/grill-with-docs` tippt. So startet eine lange Fragerunde nicht ungefragt.

### Fragerunden als Entscheidungsbaum

`/grill-with-docs` stellt in jeder Runde alle Fragen, deren Voraussetzungen schon geklärt sind (die „Front“), jede mit
Empfehlung. Fakten sucht Claude selbst (heute die Originalregeln), Entscheidungen trifft der Entwickler. Begriffe
kommen sofort ins Glossar, ein ADR nur, wenn eine Entscheidung schwer umkehrbar, überraschend und echt abgewogen ist.

### Hitster im Original genauer

Die 25 Sekunden sind der Timer fürs Aufschreiben, nicht die Länge der Musik. Die Musik läuft bei Spotify Free etwa 20
Sekunden, bei Premium 30 Sekunden oder ganz. Die Bonusregel gibt es nur auf Seite A. Als Erscheinungsjahr zählt die
erste Veröffentlichung oder Aufführung durch den Original-Interpreten.

### CI: erst rot, dann grün

Eine CI, die immer grün ist, beweist nichts. Deshalb zuerst eine absichtlich falsch formatierte Datei: Die CI wurde
rot, nach dem Löschen grün. Das ist TDD für Konfiguration.

### Kein Branch-Schutz bei privaten Repos mit GitHub Free

GitHub verbietet einen Merge bei roter CI nur mit Branch-Schutz, und den gibt es bei GitHub Free nur für öffentliche
Repos. Deshalb steht in der `CLAUDE.md` die Regel: vor jedem Merge `gh pr checks <nr>` grün.

### ESLint-Warnungen enden mit Exit-Code 0

Eine unbenutzte Variable ist in der Next.js-Einstellung nur eine Warnung. Der Hook meldet deshalb nur echte Fehler,
z. B. `react-hooks/rules-of-hooks`. Fast wäre ein Testfall im Plan gelandet, der nie rot geworden wäre. Vorher
ausprobieren hat das gezeigt.

### Hooks wirken sofort

Die Änderung an `.claude/settings.json` griff ohne Neustart von Claude Code: Die nächste Write-Probe wurde schon
formatiert. Anders als bei geänderten Agent-Dateien (siehe Agents-Katalog im Ecosystem).

### AI-native SDLC Playbook (Anthropic)

Der Artikel (claude.com/de/resources/articles/the-ai-native-sdlc-playbook) beschreibt sechs Phasen, jede endet mit
einer Datei, die die nächste auslöst: Plan, Design, Build, Test, Deploy, Maintain. Plan bis Test haben wir schon
(Vision, `/grill-with-docs`, `plan-schreiben`, `tdd`, CI). Die Lücke ist Deploy: ein unabhängiges Review jedes PRs.
Wert von Subagents ist vor allem der frische Kontext, z. B. ein Verifier, der nicht von den Annahmen des Codes
beeinflusst ist. Parallele Agents, die Code schreiben, lohnen erst bei vielen unabhängigen Aufgaben und kosten
Lernzeit. Faustregel aus dem Artikel: zweimal derselbe Fehler, dann in die `CLAUDE.md`.

## Fehler und Lösungen (zweite Session)

### `(eval):1: ===== not found`

- **Wo:** Trenner `echo ======` zwischen zwei Befehlen in zsh, zweimal
- **Ursache:** zsh liest ein Wort, das mit `=` beginnt, als „Pfad zum Befehl“ (`=ls` → `/bin/ls`) und sucht einen
  Befehl namens `====`.
- **Lösung:** Trenner in Anführungszeichen, z. B. `echo '---ENDE---'`.
- **Prüfen:** Der Befehl läuft durch und zeigt den Trenner.

### `fatal: ambiguous argument 'docs/Glossar.md': unknown revision or path not in the working tree.`

- **Wo:** Prüfaufruf d) des Hooks auf dem Branch `feature/ci`
- **Ursache:** `docs/Glossar.md` lag erst im Branch von PR #3, auf `feature/ci` gab es sie nicht. Ohne `--` hält
  `git diff` einen unbekannten Pfad für eine Version.
- **Lösung:** Test mit einer vorhandenen Datei (`docs/Projektvision.md`) und `git diff -- <pfad>`.
- **Prüfen:** Exit 0 und leeres `git diff -- docs/Projektvision.md`.

### `[warn] app/ci-probe.ts` / `Code style issues found in the above file` (absichtlich)

- **Wo:** erster Lauf der CI auf PR #4
- **Ursache:** absichtlich falsch formatierte Probedatei
- **Lösung:** Datei gelöscht, die CI wurde grün.
- **Prüfen:** `gh pr checks 4` → `pass`

## Aus dem Chat

-

## Offene Fragen

- Was zählt bei Titel und Interpret als „richtig“ (Tippfehler, „feat.“, Zusätze wie „Remastered“)? → geklärt:
  entfällt, die Spieler prüfen selbst ([[0002-spieler-pruefen-selbst|ADR 0002]])
- Übernehmen wir Bonusregel und Timer von 25 Sekunden? → geklärt: keine Bonusregel, kein Timer fürs Aufschreiben,
  Ausschnitt standardmäßig 30 Sekunden
- Welche eigenen Kategorien kommen dazu? → geklärt: Liste für Phase 4 in der [[projects/musik-app/docs/Projektvision|Projektvision]]
- `[[Projektvision]]` löst in diesem Projekt auf die Vorlage im Ecosystem auf statt auf die eigene Notiz. Wird in der
  nächsten Ecosystem-Session untersucht.

## Nächste Schritte

1. `/grill-with-docs Projektvision schärfen`, dabei die offenen Fragen klären und `docs/Glossar.md` anlegen.
2. `plan-schreiben` für den Rest von Phase 0: CI mit GitHub Actions (`npm ci`, `npm run check`, `npm run build`),
   evtl. Prettier-Hook.
3. In Obsidian `node_modules` ausblenden (Einstellungen → Dateien und Links → Ausgeschlossene Dateien, `/node_modules/`).
4. (zweite Session) Im Ecosystem nach dem SDLC-Artikel einen Code-Reviewer (vorher `/code-review` testen) und einen
   Verifier als nur lesende Agents in `qualitaets-agents` anlegen, dazu `REVIEW.md` je Projekt.
5. (zweite Session) Phase 1 starten: vorher fragen, ob etwas anderes ansteht, dann `docs/Tools für später.md`
   prüfen und den Plan für Phase 1 mit `plan-schreiben` schreiben.
