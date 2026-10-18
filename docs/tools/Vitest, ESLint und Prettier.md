---
titel: Vitest, ESLint und Prettier
status: aktiv
erstellt: 2026-10-18
tags: [tools, vitest, eslint, prettier, tests, qualität]
---

# Vitest, ESLint und Prettier

Teil der [[Tools Übersicht]]. Gegenstück zu [[ruff und pytest]] für TypeScript. Begründung: [[0001-stack|ADR 0001]].

## Was ist das?

- **Vitest** führt Tests aus, wie pytest. Ein Test ist eine Funktion mit `test("…", () => { … })`, die mit
  `expect(…)` prüft, ob etwas stimmt.
- **ESLint** sucht Fehler und schlechte Muster im Code, wie `ruff check`.
- **Prettier** formatiert den Code einheitlich (Einrückung, Anführungszeichen, Zeilenlänge), wie `ruff format`.
- **React Testing Library** rendert Komponenten im Test und findet Elemente so, wie ein Mensch sie sieht, z. B. „die
  Überschrift Musik-App“. **jsdom** spielt dafür im Test einen Browser nach.

## Wofür nutzen wir es?

Spiellogik testgetrieben bauen (ab Phase 1), Oberfläche prüfen, einheitlicher Stil. Alles zusammen läuft mit
`npm run check` vor jedem Commit und später in der CI.

## Wichtige Begriffe

| Begriff | Bedeutung |
|---|---|
| `vitest run` / `vitest` | einmal ausführen (für `npm test` und CI) / bei jeder Änderung neu (`npm run test:watch`) |
| Flat Config | neues Format der ESLint-Konfiguration: eine Liste in `eslint.config.mjs` |
| `eslint-config-prettier` | schaltet ESLint-Regeln ab, die Prettier widersprechen, muss als Letztes in der Liste stehen |
| `.prettierignore` | was Prettier nicht anfasst, bei uns Markdown und `package-lock.json` |

## Wie haben wir es eingerichtet?

1. **2026-10-18:** ESLint 9 kam mit `create-next-app` (`eslint-config-next`), siehe [[Next.js.md|Next.js]].
2. Vitest nach der Next.js-Doku (Guide „Vitest“): `npm install -D vitest @vitejs/plugin-react jsdom
   @testing-library/react @testing-library/dom vite-tsconfig-paths`, dazu `vitest.config.mts` mit
   `environment: "jsdom"`. Vitest 5.0.5.
3. Prettier nach seiner Doku: `npm install -D --save-exact prettier@3.9.10` (feste Version, weil sich die Formatierung
   sonst bei einem Update ändern kann), `.prettierrc` mit `{}`. Markdown in `.prettierignore`: Die Doku gehört
   Obsidian, Prettier würde sonst alle Tabellen neu ausrichten.
4. `npm install -D eslint-config-prettier` und in `eslint.config.mjs` als letzten Eintrag
   `import prettier from "eslint-config-prettier/flat"`.
5. Erster Test `__tests__/page.test.tsx`: Startseite zeigt die Überschrift „Musik-App“. Erst rot (Beispielseite von
   Next.js), dann grün mit der neuen Startseite.

## Typischer Ablauf

```bash
npm run test:watch   # beim Entwickeln: Tests laufen bei jeder Änderung neu
npm run format       # Code formatieren
npm run check        # vor jedem Commit
```

## Alle bisher benutzten Befehle

| Befehl | Bedeutung |
|---|---|
| `npm test` | Vitest einmal ausführen |
| `npm run test:watch` | Vitest im Beobachtungsmodus |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier formatieren / nur prüfen |
| `npm run check` | lint, format:check, typecheck, test nacheinander |

## Fehler, die uns passiert sind

- Konflikt bei der Installation von Vitest (`ERESOLVE`): siehe [[Next.js.md|Next.js]], Abschnitt „Fehler“.
