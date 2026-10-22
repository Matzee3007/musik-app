---
titel: Lernjournal Phase 3 - Raum und Beitritt
status: aktiv
phase: 3
erstellt: 2026-10-22
tags: [lernjournal, phase-3, supabase, realtime, presence, playwright, tdd, code-review, fehler-diagnose]
---

# Lernjournal Phase 3: Raum und Beitritt

Fortsetzung von [[Lernjournal Phase 3 - Mehrspieler]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Plan B ([[2026-10-21-raum-beitritt|Raum und Beitritt]]) von der Freigabe bis zum Test mit echten Handys.

## Erledigt

- [x] Plan B freigegeben (Startseite, Raum-Code, Name, Neuladen, Bildschirmsperre, öffentliche Kanäle)
- [x] Aufgabe 1: Supabase-Projekt `musik-bingo` mit dem Assistenten `scripts/supabase-einrichten.sh` eingerichtet
  (Projekt, URL und publishable key in `.env.local`, „Allow public access“, Variablen bei Vercel für Production und
  Preview), `lib/supabase.ts`, Tool-Notiz [[projects/musik-app/docs/tools/Supabase|Supabase]]
- [x] Aufgaben 2 bis 4: reine Funktionen in `lib/raum/` für Raum-Code, Spielerregeln und Speicher, je erst rot, dann
  grün
- [x] Aufgabe 5: Raum-Kanal über Presence und Broadcast, **auf Wunsch mit Unit-Test** gegen einen nachgebauten
  Supabase-Client (im Plan nur Playwright vorgesehen), in 6 Scheiben testgetrieben
- [x] Aufgabe 6: Tisch eröffnet und schließt den Raum (Code, QR-Code, Spielerleiste), lokal im Browser geprüft
- [x] Aufgabe 7: Handy tritt über `/raum/<Code>` bei
- [x] Aufgabe 8: Playwright eingerichtet, `e2e/raum.spec.ts` spielt Tisch und zwei Handys über das echte Supabase,
  Tool-Notiz [[Playwright]]
- [x] `/code-review` zu PR #27: 10 Funde, 6 behoben (1+10, 3, 4+5, 8), 4 bewusst gelassen; `plan-pruefer`: Plan im
  Code erfüllt, aber e2e unzuverlässig (behoben mit 4+5, danach 5 von 5 grün). PR #27 gemergt
- [x] Test mit zwei echten Handys unter Production: alles klappt, nur der Name blieb nach der Bildschirmsperre grau.
  Mit `fehler-diagnose` eingegrenzt und behoben, `/code-review` zu PR #28 (9 Funde, 2 behoben). PR #28 gemergt, am
  Handy erneut geprüft
- [x] Plan A und Plan B auf `status: abgeschlossen`

## Befehle: Supabase und Pakete

```bash
npm install -E @supabase/supabase-js@2.117.2
bash scripts/supabase-einrichten.sh
npm install -E qrcode.react@4.2.0
git check-ignore -v .env.local
```

- `npm install -E <paket>@<version>`: installiert genau diese Version, ohne `^` in `package.json`.
- `bash scripts/supabase-einrichten.sh`: Assistent für die Einrichtung, in einem eigenen Terminal-Fenster, weil er
  auf Eingaben wartet.
- `git check-ignore -v .env.local`: zeigt, welche Zeile der `.gitignore` die Datei ausschließt (hier `.env.*`),
  bevor Geheimnisse hineinkommen.

## Befehle: Playwright

```bash
npm install -D -E @playwright/test@1.63.0
npx playwright install chromium
npm run e2e
npx playwright test e2e/wiederkommen.spec.ts
for i in 1 2 3 4 5; do npm run e2e 2>&1 | grep -E "passed|failed"; done
```

- `npx playwright install chromium`: lädt einen eigenen Browser (~95 MB), den Playwright fernsteuert.
- `npm run e2e`: alle Browser-Tests, nur lokal, weil sie Supabase aus `.env.local` brauchen.
- `npx playwright test <datei>`: nur ein Test, schneller beim Eingrenzen.
- Die Schleife lässt den Test fünfmal laufen: Ein einzelnes Grün beweist bei Tests mit Netz wenig.

## Befehle: Prüfen und Ausliefern

```bash
npm run check >/dev/null 2>&1; echo "check Exit-Code: $?"
npm run build
gh pr checks 27 --watch
gh pr view 27 --json mergeable -q .mergeable
gh api repos/Matzee3007/musik-app/commits/<sha>/statuses -q '.[0].description'
```

- `echo "... $?"`: zeigt den Exit-Code, den `| tail` sonst verdeckt.
- `npm run build`: rendert die Seiten auch auf dem Server vor, fängt Fehler, die jsdom nicht zeigt.
- `gh pr checks --watch`: wartet, bis die CI fertig ist. Direkt nach einem Push zeigt es manchmal noch den alten Lauf,
  dann an der Run-Nummer erkennen und erneut abfragen.
- `gh api .../commits/<sha>/statuses`: zeigt, ob Vercel den Stand ausgeliefert hat („Deployment has completed“).

## Neu gelernt

### Dependency Injection als Nahtstelle für fremde Dienste

`raumKanalUeber(client)` bekommt den Supabase-Client übergeben, `supabaseRaumKanal` setzt den echten ein. So prüft
ein Unit-Test unsere Übersetzung (Kanalname, Presence-Schlüssel, Fehler), nicht Supabase selbst. Der Nachbau muss
sich dabei wie das Original verhalten, auch in seinen Regeln: Er wirft bei `on()` nach `subscribe()` und bei einem
zweiten `subscribe()`. Ob Supabase wirklich so arbeitet, zeigt nur der Test gegen das echte Projekt.

### realtime-js: ein Kanal je Thema, ein `subscribe()` je Kanal

`client.channel("raum:ABCD")` gibt einen schon vorhandenen Kanal mit demselben Namen zurück. Ist er schon abonniert,
wirft ein neues `.on("presence")` den Fehler „cannot add `presence` callbacks … after `subscribe()`“. Deshalb merkt
sich `kanal.ts` je Raum seinen `RaumKanal` und gibt ihn beim zweiten Öffnen wieder heraus, bis er getrennt wird.

### React Strict Mode ruft Effekte doppelt auf

In der Entwicklung führt React jeden Effekt zweimal aus, um fehlendes Aufräumen sichtbar zu machen. Für Dienste, die
nur einen Aufruf erlauben (`subscribe()`), muss der Code das vertragen: `verbinden()` abonniert nur beim ersten Mal.

### Presence überlebt keinen Verbindungsabbruch

Reißt die Verbindung ab, vergisst Supabase die Presence des Geräts. realtime-js verbindet sich beim Zurückkommen
selbst neu und tritt dem Kanal wieder bei, schickt `track()` aber nicht noch einmal. Muster aus den Supabase-Beispielen:
bei jedem `SUBSCRIBED` erneut `track()`. `track()` und `send()` werfen übrigens nicht, sie liefern `"ok"`,
`"timed out"` oder `"error"`.

### Cache Components: Parameter einer Route hinter Suspense

Mit `cacheComponents: true` ist `params` einer dynamischen Route Laufzeitdaten. Der Zugriff muss in `<Suspense>`
stehen: `params.then(({ code }) => <HandyRaum code={code} />)`. Der Build zeigt solche Seiten mit ◐ (teilweise
vorgerendert).

### Wettlauf zwischen zwei Geräten

Ein Zustand, der nur beim ersten Abgleich entschieden wird („Kein Tisch“), bleibt falsch, wenn der andere Teilnehmer
eine Sekunde später kommt. Besser: auf jede Änderung reagieren. Gefunden hat das der `plan-pruefer`, weil er den
e2e-Test mehrmals laufen ließ.

### Ein Test kann aus dem falschen Grund grün sein

„Raum schließen ohne Verbindung“ war sofort grün, weil die Störung schon vor dem Rendern gesetzt war und die
Anmeldung des Tischs die Fehlermeldung zeigte, nicht das Schließen. Erst mit der Störung nach dem Rendern war der
Test aus dem richtigen Grund rot.

### Playwright: Netzverlust nachstellen

`context.setOffline(true)` nimmt einem Browser-Kontext das Netz, wie ein gesperrter Handy-Bildschirm. Supabase
erkennt das nach gut einer Minute, deshalb braucht `e2e/wiederkommen.spec.ts` lange Zeitgrenzen.

## Fehler und Lösungen

### Name am Tisch bleibt nach der Bildschirmsperre grau

- **Wo:** Test mit echten Handys unter Production, Plan B Aufgabe 8 Schritt 5
- **Ursache:** Presence geht beim Verbindungsabbruch verloren, realtime-js meldet sie beim Wiederbeitritt nicht neu an.
- **Lösung:** `lib/raum/kanal.ts` merkt sich den Eintrag nach erfolgreichem `track()` und ruft es bei jedem
  `SUBSCRIBED` erneut auf (PR #28).
- **Prüfen:** `npx playwright test e2e/wiederkommen.spec.ts` ist grün (vor dem Fix rot), am Handy erneut geprüft.

### `getByLabel("Dein Name")` läuft in den Timeout (e2e mal grün, mal rot)

- **Wo:** `npm run e2e` beim `plan-pruefer`, 3 von 3 Läufen rot
- **Ursache:** Das Handy öffnete den Raum, bevor sich der Tisch angemeldet hatte, und blieb bei „Kein Tisch“.
- **Lösung:** Das Handy geht weiter, sobald der Tisch auftaucht (Fund 4+5 aus dem Review).
- **Prüfen:** `npm run e2e` fünfmal hintereinander grün.

### `Avoid calling setState() directly within an effect` (`react-hooks/set-state-in-effect`)

- **Wo:** `app/ui/start.tsx`, Raum aus dem Speicher lesen
- **Ursache:** Ein `setState` direkt im Effekt löst ein zweites Rendern aus, die Regel verbietet es.
- **Lösung:** Den Raum im selben Rückruf wie das Spotify-Token lesen (`.then((t) => { setToken(t); setTischRaum(...) })`).
- **Prüfen:** `npx eslint app/ui/start.tsx` meldet nichts.

### `invariant expected app router to be mounted`

- **Wo:** `__tests__/page.test.tsx`, nachdem `Start` `useRouter` nutzt
- **Ursache:** Im Test gibt es keinen Next.js-Router.
- **Lösung:** `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))`
- **Prüfen:** `npm test` grün.

### `Do not use an <a> element to navigate to /` (`@next/next/no-html-link-for-pages`)

- **Wo:** Link „Zur Startseite“ in `app/ui/handy-raum.tsx`
- **Ursache:** Next.js will für Links innerhalb der App `<Link>`.
- **Lösung:** `import Link from "next/link"`
- **Prüfen:** `npm run lint` grün.

### `[warn] Code style issues found` (zum zweiten Mal)

- **Wo:** `npm run check` nach Änderungen per Python-Skript bzw. Heredoc
- **Ursache:** Der Prettier-Hook läuft nur nach Edit und Write, nicht nach Shell-Befehlen.
- **Lösung:** `npx prettier --write <datei>` nach jeder Änderung per Shell.
- **Prüfen:** `npm run check >/dev/null 2>&1; echo $?` gibt `0` aus.

### `gh: Not Found (HTTP 404)` beim Warten auf Vercel

- **Wo:** Warten auf die Production nach dem Merge von PR #28
- **Ursache:** Vercel legt bei GitHub keine Deployments an, sondern meldet sich als Commit-Status.
- **Lösung:** `gh api repos/Matzee3007/musik-app/commits/<sha>/statuses` abfragen (in
  [[projects/musik-app/docs/tools/Vercel|Vercel]] notiert).
- **Prüfen:** Ausgabe „Deployment has completed“.

### `FileNotFoundError: [Errno 2] No such file or directory: '__tests__/lib/raum/kanal.test.ts'`

- **Wo:** Python-Skript zum Ändern eines Tests
- **Ursache:** Ein `cd` in `node_modules/@supabase/realtime-js/...` zum Nachlesen blieb für die nächsten Befehle
  bestehen.
- **Lösung:** zurück mit `cd /Users/matthias/claude-ecosystem/projects/musik-app`, beim Nachlesen absolute Pfade
  nehmen statt `cd`.
- **Prüfen:** `pwd` zeigt den Projektordner.

## Aus dem Chat

-

## Offene Fragen

- Bewusst gelassene Review-Funde, die in Plan C wichtig werden könnten: Ein Handy, das „Raum geschlossen“ verpasst,
  bleibt im Zustand „drin“ (Fund 5 aus PR #28); ein Name wird frei, solange sein Spieler nicht verbunden ist (Fund 6
  aus PR #27).
- Leere Startseite, wenn das Spotify-Token offline nicht erneuert werden kann (Fund 7 aus PR #27, schon vor Plan B so).
- Aus dem letzten Journal weiter offen: Web Playback SDK ohne Netz, kollaborative Playlists, Ladezeit beim Vorbereiten.

## Nächste Schritte

1. Plan C (Live-Spiel: Karte, Runden und Bingo am Handy) mit `plan-schreiben` schreiben und freigeben.
2. Plan C umsetzen, am Ende ein Spiel mit echten Handys.
