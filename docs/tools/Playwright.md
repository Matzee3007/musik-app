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
- **Projekt:** eine Kombination aus Browser und Gerät, unter der Tests laufen. Wir haben `chromium` (Desktop) und
  `iphone` (WebKit, die Engine von Safari, in iPhone-Größe).
- **Bots:** Hilfsklassen `Tisch` und `Spieler` in `e2e/hilfen/raum.ts`, die wie Menschen spielen. Jeder Spieler
  hakt das freie Feld ab, das ihn seinem Bingo am nächsten bringt.
- **Test-Agents:** Planner (erkundet die App, schreibt einen Testplan nach `specs/`), Generator (macht daraus Tests)
  und Healer (repariert scheiternde Tests). Seit Playwright 1.56, in `.claude/agents/playwright-test-*.md`. Sie
  steuern den Browser über einen MCP-Server (`.mcp.json`) und können nur **eine** Seite bedienen, also keine Tests mit
  Tisch und Handys gleichzeitig schreiben ([Doku](https://playwright.dev/docs/test-agents)).
- **webServer:** Playwright startet die App selbst (`npm run dev`) oder nimmt die schon laufende
  (`reuseExistingServer`).

## Wie haben wir es eingerichtet?

- `playwright.config.ts`: Tests in `e2e/`, Adresse `http://127.0.0.1:3000`, alle unter Chromium, der Spieleabend
  zusätzlich im Projekt `iphone` (WebKit).
- `e2e/spieleabend.spec.ts`: Tisch und drei Spieler-Bots spielen bis zum Bingo (meist 8 bis 15 Runden): Notizen,
  Zurücknehmen, Neuladen, Beitritt mitten im Spiel, Verbindungsabbruch, Bingo auf allen Geräten, neues Spiel, Raum
  schließen, keine Fehler im Browser. Knapp eine Minute je Projekt.
- **Verbindungsabbruch:** `Spieler.trennen()` fängt die WebSocket-Verbindung zu Supabase mit `page.routeWebSocket`
  ab, schließt sie und lässt keinen Neuversuch durch, bis `verbinden()` kommt. Das klappt unter Chromium und WebKit.
- `alleSchliessen()` in `test.afterEach` schließt alle Browser-Kontexte der Bots, auch nach einem Fehler.
- `e2e/zwei-runden.spec.ts`: Regressionstest für das Presence-Limit von Supabase.
- `e2e/seed.spec.ts`: Ausgangspunkt der Test-Agents (frische Startseite), testet selbst nichts.
- `e2e/raum.spec.ts`: Raum eröffnen, beitreten, „Name schon vergeben“, Neuladen, Raum schließen.
- `e2e/wiederkommen.spec.ts`: Handy geht offline (`context.setOffline(true)`, wie gesperrter Bildschirm) und kommt
  zurück, der Name am Tisch wird grau und wieder normal. Dauert gut eine Minute, so lange braucht Supabase, bis es
  das Handy als weg erkennt.
- `vitest.config.mts` schließt `e2e/` aus, sonst führte Vitest die `.spec.ts` selbst aus.
- `.gitignore`: `test-results/`, `playwright-report/`.
- **Nur lokal**, nicht in der CI: Der Test braucht das Supabase-Projekt aus `.env.local`
  ([[projects/musik-app/docs/tools/Supabase|Supabase]]).

## Typischer Ablauf

1. `.env.local` mit Supabase ist da, die App läuft oder Playwright startet sie.
2. `npm run e2e`, erwartet `7 passed`. Nach Änderungen am Raum besser `npx playwright test --repeat-each=3`.
3. Scheitert ein Test: `npx playwright show-report` zeigt Schritt für Schritt, was der Browser sah.

## Alle bisher benutzten Befehle

```bash
npm install -D -E @playwright/test@1.63.0   # Testbibliothek, genaue Version
npx playwright install chromium             # eigener Chromium (~95 MB) in ~/Library/Caches/ms-playwright
npx playwright install webkit               # WebKit (~80 MB) für das Projekt iphone
npx playwright init-agents --loop=claude    # Test-Agents und .mcp.json anlegen (nach Updates neu ausführen)
npx playwright test --repeat-each=3         # jeden Test dreimal, deckt wackelige Tests auf
npx playwright test --project=iphone        # nur ein Projekt
npm run e2e                                  # alle Browser-Tests (playwright test)
npx playwright show-report                  # Bericht des letzten Laufs im Browser
```

## Fehler, die uns passiert sind

- **`npm run e2e` mal grün, mal rot** (2026-10-22): `getByLabel("Dein Name")` lief in den Timeout. Ursache: Das Handy
  öffnete den Raum, bevor sich der Tisch per Presence angemeldet hatte, und blieb bei „Kein Tisch“. Lösung in der App:
  Das Handy geht weiter, sobald der Tisch auftaucht. Lehre: e2e-Tests mehrmals hintereinander laufen lassen.
- **Runde 4 im Spieleabend unter WebKit rot** (2026-10-22): Nach 90 Sekunden offline zeigte der Tisch noch „Ben 3“.
  Ursache: `context.setOffline(true)` trennt unter WebKit bestehende WebSockets nicht, unter Chromium hält es sie
  nur an. Eine kurze Unterbrechung prüft deshalb nichts: Chromium liefert die Nachrichten danach verspätet aus.
  Lösung: die Verbindung zu Supabase mit `page.routeWebSocket` abfangen und gezielt schließen (`Spieler.trennen()`),
  in beiden Engines gleich und ohne 90 Sekunden Warten.
