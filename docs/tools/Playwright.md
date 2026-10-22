---
titel: Playwright
status: aktiv
erstellt: 2026-10-22
tags: [tools, playwright, e2e, tests]
---

# Playwright

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan: [[2026-10-21-raum-beitritt]],
Aufgabe 8.

## Was ist das?

Ein Werkzeug von Microsoft, das einen echten Browser fernsteuert: Seiten öffnen, klicken, tippen und prüfen, was zu
sehen ist. Solche Tests heißen **End-to-End-Tests** (e2e), weil sie die ganze App von der Oberfläche bis zu den
Diensten dahinter durchlaufen.

## Wofür nutzen wir es?

Für das, was Vitest mit Nachbauten nicht zeigen kann: ob Tisch und Handys über das **echte Supabase** zueinander
finden. Ein Test spielt Tisch und zwei Handys gleichzeitig.

## Wichtige Begriffe

- **Browser-Kontext:** ein eigenes Browserprofil mit eigenem Speicher, wie ein zweites Gerät. Jedes Handy im Test ist
  ein Kontext.
- **Locator:** beschreibt, wie ein Element gefunden wird, z. B. `getByRole("button", { name: "Beitreten" })`, gleiche
  Art wie bei der Testing Library in Vitest.
- **Auto-Waiting:** `expect(...).toBeVisible()` wartet bis zu 5 Sekunden, bis die Bedingung stimmt. Darum braucht es
  keine Pausen, auch wenn Supabase einen Moment braucht.
- **webServer:** Playwright startet die App selbst (`npm run dev`) oder nimmt die schon laufende
  (`reuseExistingServer`).

## Wie haben wir es eingerichtet?

- `playwright.config.ts`: Tests in `e2e/`, Adresse `http://127.0.0.1:3000`, nur Chromium.
- `e2e/raum.spec.ts`: Raum eröffnen, beitreten, „Name schon vergeben“, Neuladen, Raum schließen.
- `vitest.config.mts` schließt `e2e/` aus, sonst führte Vitest die `.spec.ts` selbst aus.
- `.gitignore`: `test-results/`, `playwright-report/`.
- **Nur lokal**, nicht in der CI: Der Test braucht das Supabase-Projekt aus `.env.local`
  ([[projects/musik-app/docs/tools/Supabase|Supabase]]).

## Typischer Ablauf

1. `.env.local` mit Supabase ist da, die App läuft oder Playwright startet sie.
2. `npm run e2e`, erwartet `1 passed`.
3. Scheitert ein Test: `npx playwright show-report` zeigt Schritt für Schritt, was der Browser sah.

## Alle bisher benutzten Befehle

```bash
npm install -D -E @playwright/test@1.63.0   # Testbibliothek, genaue Version
npx playwright install chromium             # eigener Chromium (~95 MB) in ~/Library/Caches/ms-playwright
npm run e2e                                  # alle Browser-Tests (playwright test)
npx playwright show-report                  # Bericht des letzten Laufs im Browser
```

## Fehler, die uns passiert sind

Noch keine.
