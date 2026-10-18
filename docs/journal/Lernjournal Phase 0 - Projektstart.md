---
titel: Lernjournal Phase 0 - Projektstart
status: aktiv
phase: 0
erstellt: 2026-10-18
tags: [lernjournal, phase-0, projekt-starten, spotify, musicbrainz, nextjs, typescript, node, vitest]
---

# Lernjournal Phase 0: Projektstart

Erstes Journal der Musik-App. Gehört zu [[Projektvision]]. Angelegt in einer Session im Ecosystem mit
`/projekt-starten Musik-App`, dort im Journal [[Lernjournal 2026-10-18 - Ecosystem aufbauen]].

## Erledigt

- [x] Projekt geklärt (Skill `projekt-starten`, Fragerunden): Name `musik-app`, Ziel Hitster Bingo als Web-App für
  Spieleabende mit Freunden, Lernziel TypeScript und Spotify, Laptop als „Tisch“, Handys für Karte und Antworten
- [x] Spielregeln des Originals und die aktuelle Spotify-Doku gelesen, MusicBrainz mit einer echten Abfrage getestet
- [x] Gerüst aus der Vorlage des Ecosystems ausgefüllt: [[Projektvision]], `CLAUDE.md`, [[0001-stack|ADR 0001]],
  [[Arbeitsumgebung]]
- [x] Node 24.22 über Homebrew, Next.js 16.4.2 mit React 19.3, TypeScript 5.9, Tailwind CSS 4, ESLint 9, Prettier 3.9,
  Vitest 5, siehe [[Next.js.md|Next.js]] und [[Vitest, ESLint und Prettier]]
- [x] Erster Test (Startseite zeigt „Musik-App“) erst rot, dann grün, `npm run check` Exit 0, `npm run build` läuft
- [x] Privates Repo `Matzee3007/musik-app`, erster Commit direkt auf `main`
- [x] Links im Vault repariert und `node_modules/` von der Vault-Prüfung ausgeschlossen (PR #1)
- [ ] Projektvision mit `/grill-with-docs` schärfen
- [ ] CI mit GitHub Actions, evtl. Prettier-Hook

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

## Aus dem Chat

-

## Offene Fragen

- Was zählt bei Titel und Interpret als „richtig“ (Tippfehler, „feat.“, Zusätze wie „Remastered“)?
- Übernehmen wir Bonusregel und Timer von 25 Sekunden?
- Welche eigenen Kategorien kommen dazu?
- `[[Projektvision]]` löst in diesem Projekt auf die Vorlage im Ecosystem auf statt auf die eigene Notiz. Wird in der
  nächsten Ecosystem-Session untersucht.

## Nächste Schritte

1. `/grill-with-docs Projektvision schärfen`, dabei die offenen Fragen klären und `docs/Glossar.md` anlegen.
2. `plan-schreiben` für den Rest von Phase 0: CI mit GitHub Actions (`npm ci`, `npm run check`, `npm run build`),
   evtl. Prettier-Hook.
3. In Obsidian `node_modules` ausblenden (Einstellungen → Dateien und Links → Ausgeschlossene Dateien, `/node_modules/`).
