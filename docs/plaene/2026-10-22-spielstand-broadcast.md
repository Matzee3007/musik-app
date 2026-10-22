---
titel: "Plan: Spielstand über Broadcast"
status: aktiv
erstellt: 2026-10-22
tags: [plan, phase-3, supabase, realtime, fehler]
---

# Plan: Spielstand über Broadcast

**Ziel:** Das Live-Spiel läuft über beliebig viele Runden: Tisch und Handys tauschen den Spielstand per Broadcast aus,
Presence zeigt nur noch, wer da ist.

**Vorgehen:** Plan C trug den Spielstand im Presence-Eintrag ([[0005-spielstand-ueber-presence|ADR 0005]]). Supabase
erlaubt je Gerät aber nur 5 Presence-Änderungen in 30 Sekunden und schließt beim sechsten den Kanal
(`Client presence rate limit exceeded`). Der Tisch fliegt so spätestens in Runde 2 aus dem Raum, die Handys sehen keinen
Tisch und keine freien Felder mehr. Neu (ADR 0006 ersetzt 0005): Jede Änderung geht als Broadcast-Nachricht an alle.
Wer beitritt, neu lädt oder nach einer Unterbrechung wieder verbunden ist, schickt „anfrage“, und jedes Gerät antwortet
mit seinem Stand. Presence meldet jedes Gerät nur einmal an (und nach einem Wiederbeitritt neu), wie in Plan B.

**Technik:** `@supabase/supabase-js` 2.117.2 (Broadcast ohne `self`: Der Absender bekommt seine Nachricht nicht
zurück), Vitest, Playwright 1.63.0 (nur lokal).

**Anforderung:** Fehler aus dem Test mit echten Handys am 2026-10-22: „Nach dem Abhaken in Runde 1 lässt sich in der
nächsten Runde kein Feld abhaken.“ Diagnose mit `fehler-diagnose` (WebSocket-Mitschnitt, Quelle:
[Supabase: ClientPresenceRateLimitReached](https://supabase.com/docs/guides/troubleshooting/realtime-client-presence-rate-limit-reached)).
Entscheidung des Entwicklers am 2026-10-22: Broadcast mit Nachfragen, eigener Plan.

## Feste Vorgaben

- Presence: höchstens ein `track()` je Gerät beim Beitritt, dazu einer je Wiederbeitritt. Kein Stand im Eintrag.
- Nachrichten (alle über das Broadcast-Ereignis `nachricht`):
  - `{ art: "geschlossen" }`: Tisch → alle (wie bisher)
  - `{ art: "anfrage" }`: ein Gerät → alle; der Tisch antwortet mit `tisch`, jedes Handy mit `spieler`
  - `{ art: "tisch"; stand: TischStand | null }`: Tisch → alle, bei jeder Änderung und als Antwort
  - `{ art: "spieler"; name: string; stand: SpielerStand }`: Handy → alle, bei jeder Änderung und als Antwort
- Nachrichten in falscher Form werden verworfen (`istTischStand`, `istSpielerStand` aus Plan C weiter nutzen).
- Ein Gerät fragt nach: beim Erscheinen der Spielansicht (Handy: `HandySpiel`, Tisch: `RaumKopf`) und bei jedem
  `SUBSCRIBED` danach (Wiederbeitritt).
- Was Plan C sonst festlegt (Regeln der Karte, ein Feld pro Runde, Bingo-Regel, Speicher), bleibt.
- Keine neuen Pakete.

## Prüf-Schwerpunkte

1. **Viele Runden schnell hintereinander:** Der Tisch bleibt im Raum, in jeder Runde ist nach der Auflösung ein Feld
   frei. Test: Playwright „nach dem Abhaken in Runde 1 ist in Runde 2 wieder ein Feld frei“ (Aufgabe 4), dazu „der
   Tisch meldet sich nur einmal per Presence an“ (Aufgabe 3).
2. **Handy lädt neu oder kommt vom Sperrbildschirm zurück:** Es fragt nach und sieht die laufende Runde. Test:
   „fragt beim Erscheinen und nach dem Wiederbeitritt nach“ (Aufgabe 2).
3. **Tisch lädt neu:** Er fragt nach, die Handys antworten, die Leiste zeigt wieder ihre Zahlen. Test: „Raum-Kopf fragt
   nach und zeigt die Antworten in der Leiste“ (Aufgabe 3).
4. **Nachricht in falscher Form** (ältere App-Fassung): wird verworfen, nichts stürzt ab. Test: `raumNachrichtLesen`
   (Aufgabe 1).
5. **Handy hakt schnell ab und nimmt zurück:** Kein Presence-Aufruf dabei, also kein Limit. Test: „abhaken schickt
   den Stand per Broadcast, nicht per Presence“ (Aufgabe 2).

### Aufgabe 1: Nachrichten im Kanal

Kommt neben den bisherigen Weg, damit `npm run check` nach jeder Aufgabe grün bleibt. Der Stand in Presence fällt erst
in Aufgabe 3 weg.

**Dateien:**
- Ändern: `lib/raum/kanal.ts`, `__tests__/hilfen/raum-kanal.ts` (Nachbau: `beiVerbunden`, `verbundenMelden()`)
- Test: `__tests__/lib/raum/kanal.test.ts`
- Neu: `docs/adr/0006-spielstand-ueber-broadcast.md`, Ändern: `docs/adr/0005-spielstand-ueber-presence.md`
  (`status: ersetzt`, Hinweis auf 0006 mit dem gemessenen Limit)

**Schnittstellen:**
- Nutzt: `istTischStand`, `istSpielerStand`, `TischStand`, `SpielerStand` aus `lib/raum/stand.ts`
- Liefert:
  - `RaumNachricht` mit den vier Arten aus den festen Vorgaben
  - `raumNachrichtLesen(wert: unknown): RaumNachricht | null`; `beiNachricht` ruft Rückrufe nur mit gültigen
    Nachrichten
  - `RaumKanal.beiVerbunden(rueckruf: () => void): () => void`: bei jedem `SUBSCRIBED` (auch nach Wiederbeitritt)

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

„raumNachrichtLesen nimmt gültige Nachrichten und verwirft andere“ (`{ art: "tisch", stand: { spiel: "x" } }` → `null`,
`{ art: "spieler", name: 3, … }` → `null`, `{ art: "anfrage" }` → gleich, `{ art: "tisch", stand: null }` → gleich),
„beiNachricht übergeht Nachrichten in falscher Form“, „beiVerbunden meldet jedes SUBSCRIBED, bis abgemeldet“.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/kanal.test.ts`

- [x] **Schritt 3: `lib/raum/kanal.ts` und den Nachbau umsetzen**

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [x] **Schritt 5: ADR 0006 schreiben, ADR 0005 als ersetzt markieren, prüfen, committen**

ADR 0006: Kontext (Limit 5 Presence-Änderungen je Gerät in 30 s, gemessen per WebSocket-Mitschnitt, Quelle),
Entscheidung (Broadcast mit Nachfragen, Presence nur für Anwesenheit), Alternativen (Presence gedrosselt: bis 6 s
Verzögerung, Handys mit Abhaken und Zurücknehmen selbst am Limit; Broadcast plus gedrosselte Presence: zwei Wege für
einen Stand), Konsequenzen (verpasste Nachrichten holt die Anfrage nach; Broadcast-Limit des Projekts 100
Nachrichten/s, ein Spieleabend braucht wenige; Tests mit dem Nachbau kennen kein Limit, deshalb der Playwright-Test
über mehrere Runden).

```bash
npm run check
git add lib/raum/kanal.ts __tests__/ docs/adr/
git commit -m "Add game state messages to the room channel"
```

### Aufgabe 2: Handy über Nachrichten

**Dateien:**
- Ändern: `app/ui/handy-spiel.tsx`
- Test: `__tests__/ui/handy-spiel.test.tsx`

**Schnittstellen:**
- Nutzt: Aufgabe 1
- Liefert: `HandySpiel` mit denselben Props wie in Plan C. Den `TischStand` hält es als State aus `tisch`-Nachrichten,
  `tischDa(anwesende)` entscheidet weiter über „Der Tisch ist gerade nicht verbunden.“

Verhalten: Beim Erscheinen und bei jedem `beiVerbunden` `senden({ art: "anfrage" })`. Auf `anfrage` antwortet es mit
`{ art: "spieler", name, stand: spielerStand(karte) }`, sobald es eine Karte hat. Jede Änderung des eigenen Stands geht
als `spieler`-Nachricht hinaus, nicht mehr über `anmelden`. Scheitert `senden`, steht die Meldung wie bisher unter
„Du bist im Raum …“.

- [x] **Schritt 1: Tests umstellen und ergänzen**

Die Tests aus Plan C geben den Stand des Tischs jetzt per `raum.nachrichtSchicken({ art: "tisch", stand })` vor,
`anwesende` enthält nur noch, wer da ist. Neu: „fragt beim Erscheinen und nach dem Wiederbeitritt nach“ (`gesendet`
enthält `anfrage`, nach `verbundenMelden()` ein zweites Mal), „antwortet auf eine Anfrage mit seinem Stand“, „abhaken
schickt den Stand per Broadcast, nicht per Presence“ (`angemeldet` bleibt leer, `gesendet` zuletzt `spieler` mit
`abgehakt: 1`, Prüf-Schwerpunkt 5).

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/handy-spiel.test.tsx __tests__/ui/handy-raum.test.tsx`

- [x] **Schritt 3: `app/ui/handy-spiel.tsx` umbauen**

- [x] **Schritt 4: Prüfen und committen**

```bash
npm run check
git add app/ui/handy-spiel.tsx __tests__/ui/
git commit -m "Exchange game state on the phone by broadcast"
```

### Aufgabe 3: Tisch über Nachrichten, Stand raus aus Presence

**Dateien:**
- Ändern: `lib/raum/stand.ts` (`SpielerStaende`, `bingoNamen` über die Stände; `tischStandLesen` entfällt)
- Ändern: `lib/raum/spieler.ts` (`Anwesend` wieder ohne `stand`; `spielerleiste` nimmt die Stände)
- Ändern: `lib/raum/kanal.ts` (`anwesendeLesen` wieder ohne `stand`)
- Ändern: `app/ui/raum-kopf.tsx` (meldet sich einmal per Presence an; schickt `tisch` bei jeder Änderung von `stand`
  und als Antwort; fragt beim Verbinden und nach jedem Wiederbeitritt nach; hält die `SpielerStaende` aus
  `spieler`-Nachrichten für die Leiste)
- Ändern: `app/ui/spiel-ansicht.tsx` (Bingo aus `spieler`-Nachrichten statt aus Presence)
- Test: `__tests__/lib/raum/stand.test.ts`, `__tests__/lib/raum/spieler.test.ts`, `__tests__/lib/raum/kanal.test.ts`,
  `__tests__/ui/raum-kopf.test.tsx`, `__tests__/ui/spiel-raum.test.tsx`, `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: Aufgaben 1 und 2
- Liefert in `lib/raum/stand.ts`:
  - `type SpielerStaende = Record<string, SpielerStand>` (je Name der zuletzt gemeldete Stand)
  - `bingoNamen(bisher: readonly string[], staende: SpielerStaende, spiel: string): string[]` (bisher, dahinter neue
    Namen mit Bingo in diesem Spiel)
- Liefert in `lib/raum/spieler.ts`: `spielerleiste(bekannt, anwesende, staende: SpielerStaende, spiel: string | null)`
  mit `abgehakt` nur bei verbundenen Spielern, deren Stand zu `spiel` gehört
- `RaumKopf` und `SpielAnsicht` behalten ihre Props aus Plan C

- [x] **Schritt 1: Tests umstellen und ergänzen**

`stand.test.ts`, `spieler.test.ts`: die Fälle aus Plan C auf `SpielerStaende` umstellen (neues Bingo dazu, gegangene
bleiben, altes Spiel zählt nicht; Zahl nur für das laufende Spiel und nur verbunden). Tests für `tischStandLesen` und
für `stand` in Presence (`kanal.test.ts`) entfallen, „nur die neueste Anmeldung zählt“ bleibt.
`raum-kopf.test.tsx`: „der Tisch meldet sich nur einmal per Presence an“ (nach drei neuen Ständen genau ein Eintrag in
`angemeldet`, ohne `stand`, Prüf-Schwerpunkt 1), „schickt jeden neuen Stand an alle“, „beantwortet eine Anfrage mit
dem aktuellen Stand“, „Raum-Kopf fragt nach und zeigt die Antworten in der Leiste“ (Prüf-Schwerpunkt 3).
`spiel-raum.test.tsx`: Bingo-Tests schicken `spieler`-Nachrichten statt Presence-Einträge, sonst unverändert.
`start.test.tsx`: „Demo im Raum …“ erwartet den Stand in `gesendet` statt in `angemeldet`.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum __tests__/ui`

- [x] **Schritt 3: `lib/raum/` und die Ansichten umbauen**

- [x] **Schritt 4: Prüfen und committen**

```bash
npm run check
git add lib/raum/ app/ui/ __tests__/
git commit -m "Exchange game state at the table by broadcast"
```

### Aufgabe 4: Regressionstest, Doku, echte Handys

**Dateien:**
- Neu: `e2e/zwei-runden.spec.ts` (aus der Diagnose: zwei Runden, Abhaken in Runde 1, in Runde 2 ein Feld frei)
- Ändern: `docs/tools/Supabase.md` (Limit 5 Presence-Änderungen je Gerät in 30 s, Fehlermeldung, Ursache, Lösung;
  Ablauf mit Broadcast und Anfrage), `docs/Projektvision.md` (Geklärte Fragen Phase 3: Live-Spiel über Broadcast, Link
  ADR 0006), `docs/plaene/2026-10-22-live-spiel.md` (Hinweis: Spielstand-Teil durch diesen Plan ersetzt)

- [x] **Schritt 1: Playwright laufen lassen, alle müssen bestehen**

`npm run e2e`
Erwartet: `4 passed`

- [x] **Schritt 2: Doku, prüfen, committen, PR**

```bash
npm run check
git add e2e/zwei-runden.spec.ts docs/
git commit -m "Add Playwright test for two rounds in a room"
```

PR öffnen, `gh pr checks <nr>` grün, `/code-review`, `plan-pruefer` gegen diesen Plan, mergen.

- [ ] **Schritt 3 (Entwickler): Spiel mit echten Handys unter Production**

Wie Plan C, Aufgabe 8, Schritt 4: ein komplettes Spiel bis zum Bingo, mindestens 6 Runden, unterwegs neu laden,
mitten im Spiel beitreten, Bildschirm sperren.

**Fertig, wenn:** Das Spiel aus Schritt 3 läuft bis zum Bingo. `npm run e2e`, `npm run check` und `gh pr checks`
grün, `plan-pruefer` hat den Branch gegen diesen Plan geprüft. Damit ist Phase 3 abgeschlossen.
