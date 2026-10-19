---
titel: Next.js
status: aktiv
erstellt: 2026-10-18
tags: [tools, nextjs, react, typescript, node, npm]
---

# Next.js (mit Node.js, npm und TypeScript)

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Begründung: [[projects/musik-app/docs/adr/0001-stack|ADR 0001]].

## Was ist das?

- **Node.js** führt JavaScript außerhalb des Browsers aus, z. B. den Entwicklungsserver und die Tests.
- **npm** (Node Package Manager) kommt mit Node mit und installiert Pakete aus dem npm-Verzeichnis nach
  `node_modules/`. Welche Pakete das Projekt braucht, steht in `package.json`, die genauen Versionen in
  `package-lock.json`.
- **TypeScript** ist JavaScript mit Typen. `tsc` prüft vor dem Ausführen, ob z. B. eine Funktion eine Zahl bekommt,
  wo sie eine Zahl erwartet.
- **React** baut Oberflächen aus Komponenten: Funktionen, die HTML-artiges JSX zurückgeben (`.tsx`-Dateien).
- **Next.js** ist ein Framework um React: Es macht aus Dateien in `app/` Seiten (`app/page.tsx` ist `/`) und hat
  einen Server-Teil für Dinge, die nicht im Browser laufen dürfen (z. B. der OAuth-Rückruf von Spotify).

## Wofür nutzen wir es?

Die ganze App: Tisch-Ansicht am Laptop, Bingo-Karte am Handy, später Spotify-Anmeldung und MusicBrainz-Abfragen im
Server-Teil.

## Wichtige Begriffe

| Begriff | Bedeutung |
|---|---|
| App Router | Ordner `app/`: jeder Unterordner mit `page.tsx` ist eine Seite, `layout.tsx` umschließt sie |
| Komponente | Funktion, die Oberfläche zurückgibt, z. B. `Home()` in `app/page.tsx` |
| Turbopack | Bündler von Next.js: setzt beim Entwickeln und Bauen die Dateien zusammen |
| Tailwind CSS | Gestalten über kurze Klassen direkt im JSX, z. B. `text-4xl font-semibold` |
| `devDependencies` | Pakete nur fürs Entwickeln (ESLint, Vitest), kommen nicht in die fertige App |
| Peer Dependency | Ein Paket verlangt, dass ein anderes in passender Version schon da ist |
| `AGENTS.md` | Anleitung von Next.js für KI-Agenten, in `CLAUDE.md` mit `@AGENTS.md` eingebunden |
| Server-Komponente | Standard für Seiten: läuft auf dem Server, ohne Zustand und Klicks, z. B. `app/page.tsx` |
| Client-Komponente | `"use client"` oben in der Datei: Zustand (`useState`) und Klicks; was sie importiert, gehört auch zum Client (bei uns `app/ui/spiel-ansicht.tsx`) |
| Hydration | React hängt im Browser die Klicks an das vorgerenderte HTML; Zufall beim ersten Rendern macht Server und Browser ungleich |

## Wie haben wir es eingerichtet?

1. **2026-10-18:** `brew install node@24` (24.22.0, npm 11.19.1). `node@24` ist bei Homebrew „keg-only“: installiert,
   aber nicht im PATH, damit sich mehrere Node-Versionen nicht stören. `brew link --force node@24` legt es trotzdem
   nach `/opt/homebrew/bin`, weil wir nur diese eine Version haben.
2. `npx create-next-app@latest musik-app --yes --use-npm --disable-git` in einem leeren Ordner im Scratchpad, weil der
   Projektordner schon `CLAUDE.md`, `README.md` und `docs/` hatte. Danach `app/`, `package.json`,
   `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` und `AGENTS.md` ins Projekt kopiert.
   Ergebnis: Next.js 16.4.2, React 19.3.0, TypeScript 5.9, Tailwind CSS 4, ESLint 9.
3. `.gitignore` von Next.js nicht übernommen, nur die Einträge unter `# Stack` angehängt. Seine Zeile `.env*` hätte
   auch `.env.example` ausgeschlossen.
4. Beispielseite durch eine schlichte Startseite ersetzt, Beispielbilder in `public/` gelöscht, Titel und
   `lang="de"` in `app/layout.tsx`.
5. `@types/node` von `^20` auf `^24` angehoben, passend zu Node 24 (siehe Fehler).
6. Installationsskript von `unrs-resolver` abgelehnt: `npm install-scripts deny unrs-resolver` (steht als
   `allowScripts` in `package.json`). Es lädt nur eine Ersatzdatei, wenn die Programmdatei für den Mac fehlt.
   ESLint läuft ohne.

## Typischer Ablauf

```bash
npm run dev     # Entwicklungsserver, http://localhost:3000, Änderungen erscheinen sofort
npm run check   # vor jedem Commit: lint, format:check, typecheck, test
```

## Alle bisher benutzten Befehle

| Befehl | Bedeutung |
|---|---|
| `brew install node@24` | Node 24 LTS mit npm installieren |
| `brew link --force node@24` | eine keg-only Version trotzdem in den PATH legen |
| `npx create-next-app@latest <name> --yes` | neues Next.js-Projekt mit den empfohlenen Einstellungen |
| `npm ci` | genau die Versionen aus `package-lock.json` installieren, löscht vorher `node_modules/` |
| `npm install -D <paket>` | Entwicklungs-Abhängigkeit hinzufügen, ohne `-D` für die Laufzeit |
| `npm ls --depth=0` | direkt installierte Pakete mit Version |
| `npm audit` / `npm audit --omit=dev` | bekannte Sicherheitslücken, mit `--omit=dev` nur in dem, was ausgeliefert wird |
| `npm install-scripts ls` / `deny <paket>` | Installationsskripte anzeigen bzw. ablehnen (npm 11) |
| `npx next typegen` | Typen von Next.js erzeugen (z. B. `LayoutProps`), steckt in `npm run typecheck` |
| `npx tsc --noEmit` | TypeScript prüfen, ohne Dateien zu erzeugen |
| `npm run build` | Produktionsfassung bauen, so wie später auf Vercel; `○` heißt statisch vorgerendert |
| `npm run dev` | Entwicklungsserver auf http://localhost:3000 |

## Fehler, die uns passiert sind

- `npm error ERESOLVE … peerOptional @types/node@"^22.0.0 || >=24.0.0" from vitest@5.0.5` bei
  `npm install -D vitest …`. **Ursache:** `create-next-app` trägt `@types/node@^20` ein, Vitest 5 verlangt mindestens
  22. **Lösung:** `npm install -D @types/node@^24` (passend zu Node 24), dann Vitest installieren. Nicht mit `--force`
  oder `--legacy-peer-deps` übergehen.
- `error TS2304: Cannot find name 'LayoutProps'` bei `npx tsc --noEmit`. **Ursache:** Next.js erzeugt diesen Typ in
  `.next/types/`, der Ordner ist in `.gitignore` und fehlt nach dem Kopieren. **Lösung:** `npx next typegen` vor `tsc`,
  deshalb `"typecheck": "next typegen && tsc --noEmit"`.
- `npm audit`: 5 Lücken „high“ (2026-10-18), alle in Entwicklungswerkzeugen: `eslint-config-next` → `fast-glob` →
  `micromatch` → `braces` (Absturz durch tief verschachtelte Suchmuster). `npm audit --omit=dev`: 0 Lücken.
  **Entscheidung:** so lassen, die Suchmuster schreiben wir selbst. `npm audit fix --force` würde Pakete
  zurückstufen, die nicht zu Next.js 16 passen. Bei jedem Update von Next.js erneut prüfen.
- Notiz „Next.js“ in Obsidian verwaist, obwohl `[[Next.js]]` dreimal verlinkt war. **Ursache:** Obsidian liest
  `.js` als Dateiendung und löst den Link auf `node_modules/next/dist/server/next.js` auf (geprüft mit
  `obsidian links path=…`). **Lösung:** `[[Next.js.md|Next.js]]`, in Tabellen `[[Next.js.md\|Next.js]]`.
  Dazu `node_modules/` in `.vault-pruefung.json` ausgeschlossen, das Prüfskript las sonst rund 1.200 README-Dateien
  der Pakete.
