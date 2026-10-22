---
titel: "Plan: Live-Spiel"
status: aktiv
erstellt: 2026-10-22
tags: [plan, phase-3, supabase, realtime, handy, bingo]
---

# Plan: Live-Spiel

**Ziel:** Im Raum spielt jeder Spieler auf dem eigenen Handy mit Karte und Notizfläche, der Tisch gibt Runde und
Auflösung vor, zeigt statt der Karte die Spieler mit ihrer Zahl abgehakter Felder und bei Bingo die Namen.

**Vorgehen:** Der Spielstand läuft über **Presence**, nicht über Broadcast (neues [[0005-spielstand-ueber-presence|ADR
0005]]): Der Tisch hinterlegt in seinem Presence-Eintrag einen `TischStand` (Spiel, Runde, Bingo-Namen), jedes Handy
in seinem einen `SpielerStand` (Spiel, Zahl abgehakter Felder, Bingo). Wer beitritt, neu lädt oder vom
Sperrbildschirm zurückkommt, sieht so sofort den aktuellen Stand. Die Regeln sind reine Funktionen in `lib/raum/`,
die Handy-Karte nutzt `karteAusteilen`, `feldSetzen` und `hatBingo` aus Phase 1. Ohne Raum bleibt das Spiel auf einem
Gerät wie bisher.

**Technik:** `@supabase/supabase-js` 2.117.2 (ein weiteres `track()` ersetzt den eigenen Presence-Eintrag),
React 19, Vitest mit Testing Library, Playwright 1.63.0 (nur lokal).

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 3 (Spielstand,
Raum, Neuladen, Handy, Tisch, Fertig). Entscheidungen des Entwicklers am 2026-10-22: Spielstand über Presence,
Weitermachen nach dem Neuladen des Tischs kommt in Phase 4, nach einem Bingo darf in derselben Runde noch abhaken, wer
in ihr noch nicht abgehakt hat, das Spiel auf einem Gerät ohne Supabase bleibt.

## Feste Vorgaben

- Fachbegriffe aus [[projects/musik-app/docs/Glossar|Glossar]]: Spiel, Runde, Auflösung, Karte, Feld, Notizfläche,
  Tisch, Spieler (nicht „Partie“, „Antwortfeld“, „Reveal“).
- Kennung eines Spiels: `crypto.randomUUID()`, neu bei jedem „Spiel starten“ und „Neues Spiel“. Keine fortlaufende
  Nummer: Lädt der Tisch neu, beginnt er wieder bei 1, und Handys behielten ihre alte Karte.
- Pro Runde hakt ein Spieler höchstens ein Feld ab, auch über Neuladen hinweg.
- Felder ausgegraut (`aria-disabled="true"`, `opacity-40`): vor der Auflösung alle nicht abgehakten; danach alle
  außer den freien Feldern der gedrehten Kategorie; alle, wenn in dieser Runde schon abgehakt.
- Nach einem Bingo im Spiel kein Zurücknehmen mehr, auf keiner Karte. Abhaken in der laufenden Runde bleibt erlaubt
  (zwei Bingos in derselben Runde gewinnen beide).
- Speicher am Handy: `localStorage` `musik-app:handy-karte` (die `HandyKarte`), `musik-app:notizen` (`"aus"` oder
  fehlt). „Raum geschlossen“ löscht Raum und Karte.
- Lädt der Tisch neu, ist das Spiel weg (Phase 4): Der Raum bleibt, die Handys warten auf das nächste Spiel.
- Kategorie und Lösung erscheinen nicht auf dem Handy (Phase 4).
- Keine neuen Pakete.

## Prüf-Schwerpunkte

1. **Handy lädt nach dem Abhaken neu oder kommt vom Sperrbildschirm zurück:** Karte und Haken sind da, und in
   derselben Runde lässt sich kein zweites Feld abhaken. Test: „abhaken merkt sich die Runde“ (Aufgabe 3), „Karte und
   Haken überstehen das Neuladen“ (Aufgabe 6).
2. **Spieler tritt mitten im Spiel bei, oder der Tisch startet ein neues Spiel, während ein Handy weg war:** Er bekommt
   sofort eine Karte für das laufende Spiel, eine Karte aus einem alten Spiel wird ersetzt. Test: `karteFuer`
   (Aufgabe 3), „neues Spiel teilt eine neue Karte aus“ (Aufgabe 6).
3. **Anna und Ben haben in derselben Runde Bingo, Ben tippt später:** Der Tisch zeigt „Bingo! Anna, Ben“, Anna kann
   ihr Feld nicht mehr zurücknehmen. Test: `bingoNamen` (Aufgabe 1), `zuruecknehmen` nach Bingo (Aufgabe 3), „Bingo
   zweier Spieler“ (Aufgabe 7).
4. **Anna hat Bingo und verliert danach die Verbindung:** Ihr Name bleibt in „Bingo! Anna“, die Musik bleibt aus.
   Test: `bingoNamen` mit `bisher` (Aufgabe 1).
5. **Tisch ist weg (Laptop zugeklappt, Raum geschlossen, während das Handy gesperrt war):** Das Handy zeigt „Der Tisch
   ist gerade nicht verbunden.“ statt still weiterzuwarten (Fund 5 aus PR #28). Test in Aufgabe 6.

Bewusst nicht gelöst: Ein Name wird frei, solange sein Spieler nicht verbunden ist (Fund 6 aus PR #27). Nimmt ein
anderer ihn, zählt der Tisch beide unter einem Namen. Für einen Spieleabend unter Freunden in Ordnung.

### Aufgabe 1: Spielstand im Raum

**Dateien:**
- Neu: `lib/raum/stand.ts`
- Ändern: `lib/raum/spieler.ts` (`Anwesend` mit `stand`, `spielerleiste` mit Zahl)
- Ändern: `app/ui/raum-kopf.tsx` (Aufruf `spielerleiste(…, null)`, damit der Typecheck grün bleibt; die Zahl zeigt
  erst Aufgabe 7)
- Test: `__tests__/lib/raum/stand.test.ts`, Ändern: `__tests__/lib/raum/spieler.test.ts`

**Schnittstellen:**
- Nutzt: `KategorieId` aus `lib/kategorien.ts`, `Runde` aus `lib/spiel.ts`
- Liefert in `lib/raum/stand.ts`:
  - `type TischStand = { spiel: string; runde: { nummer: number; kategorie: KategorieId; aufgeloest: boolean } | null;
    bingo: string[] }`
  - `type SpielerStand = { spiel: string; abgehakt: number; bingo: boolean }`
  - `tischStand(spiel: string, runde: Runde | null, bingo: string[]): TischStand` (die Runde ohne Song, Kategorie als
    Id)
  - `tischStandLesen(anwesende: readonly Anwesend[]): TischStand | null` (Stand des ersten Tischs mit Stand)
  - `bingoNamen(bisher: readonly string[], anwesende: readonly Anwesend[], spiel: string): string[]` (bisher, dahinter
    neue Spieler mit `stand.spiel === spiel` und `bingo`, jeder Name einmal)
- Liefert in `lib/raum/spieler.ts`: `Anwesend` mit optionalem `stand?: TischStand` (Tisch) bzw.
  `stand?: SpielerStand` (Spieler); `spielerleiste(bekannt, anwesende, spiel: string | null)` liefert
  `{ name: string; verbunden: boolean; abgehakt: number | null }[]` (Zahl nur bei verbundenen Spielern mit Stand für
  dieses Spiel)

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("tischStand nimmt Kategorie-Id und lässt den Song weg", () => {
  const runde = { nummer: 2, kategorie: KATEGORIEN[1], song: SONGLISTE[0], aufgeloest: true, abgehaktesFeld: null };
  expect(tischStand("s1", runde, [])).toEqual({
    spiel: "s1", runde: { nummer: 2, kategorie: "interpret", aufgeloest: true }, bingo: [],
  });
});
test("bingoNamen nimmt neue Bingos dazu und behält gegangene", () => {
  const anwesende: Anwesend[] = [
    { schluessel: "b", rolle: "spieler", name: "Ben", stand: { spiel: "s1", abgehakt: 5, bingo: true } },
    { schluessel: "c", rolle: "spieler", name: "Cem", stand: { spiel: "alt", abgehakt: 9, bingo: true } },
  ];
  expect(bingoNamen(["Anna"], anwesende, "s1")).toEqual(["Anna", "Ben"]);
});
```

Weitere: „tischStandLesen liefert null ohne Tisch oder ohne Stand“, „bingoNamen nennt jeden nur einmal“ (Ben doppelt
nach dem Neuladen). In `spieler.test.ts`: „spielerleiste zeigt die Zahl nur für das laufende Spiel“ (Anna Stand `s1`
mit 3 → 3, Ben Stand `alt` → `null`, nicht verbundene → `null`); bestehende Erwartungen bekommen `abgehakt: null`.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/stand.test.ts __tests__/lib/raum/spieler.test.ts`
Erwartet: FAIL, `lib/raum/stand.ts` fehlt

- [ ] **Schritt 3: `lib/raum/stand.ts` schreiben, `Anwesend` und `spielerleiste` erweitern**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/lib/raum`
Erwartet: PASS

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/stand.ts lib/raum/spieler.ts app/ui/raum-kopf.tsx __tests__/lib/raum/
git commit -m "Add game state shared through the room"
```

### Aufgabe 2: Kanal überträgt den Stand

**Dateien:**
- Ändern: `lib/raum/kanal.ts` (`anwesendeLesen` übernimmt `stand`, Kommentar an `RaumNachricht` anpassen: bleibt bei
  `geschlossen`)
- Test: `__tests__/lib/raum/kanal.test.ts`
- Neu: `docs/adr/0005-spielstand-ueber-presence.md`, Ändern: `docs/adr/0004-mehrspieler-ohne-tabellen.md` (Hinweis
  unter „Entscheidung“: Runde und Auflösung laufen seit ADR 0005 über Presence)

**Schnittstellen:**
- Nutzt: `Anwesend` aus Aufgabe 1
- Liefert: `verbinden()` und `beiAnwesenden` liefern `stand` mit, wenn das Gerät einen angemeldet hat. Ein weiteres
  `anmelden(ich)` ersetzt den eigenen Eintrag und gilt auch für das Neuanmelden nach dem Wiederbeitritt (so schon
  umgesetzt, nur Test).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

„Anwesende behalten ihren Stand“ (Nachbau-Presence enthält Tisch mit `stand` und `presence_ref` → Ergebnis mit
`stand`, ohne `presence_ref`), „nach erneutem anmelden meldet der Wiederbeitritt den neuen Stand“ (zweimal
`anmelden` mit verschiedenem Stand, dann `SUBSCRIBED` → letzter `track` hat den zweiten Stand).

- [ ] **Schritt 2: Tests laufen lassen, der erste muss fehlschlagen**

`npx vitest run __tests__/lib/raum/kanal.test.ts`

- [ ] **Schritt 3: `anwesendeLesen` erweitern**

`stand` nur übernehmen, wenn vorhanden, damit Einträge ohne Stand weiter gleich aussehen.

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: ADR 0005 schreiben**

Kontext: Broadcast speichert nichts, ein gesperrtes oder neu geladenes Handy verpasst „Runde“ und „Auflösung“.
Entscheidung: Stand im Presence-Eintrag (Tisch: `TischStand`, Spieler: `SpielerStand`), Broadcast nur für
„geschlossen“. Alternativen: Broadcast mit „Stand anfragen“ beim Beitritt und Wiederbeitritt (mehr Nachrichtenarten,
jeder verpasste Fall ein eigener Weg); Tabellen (bleibt bei ADR 0004). Konsequenzen: jede Änderung ein `track()`
(einige pro Runde, weit unter dem Limit), geht ein Spieler, ist auch seine Zahl weg (Leiste zeigt ihn grau ohne Zahl),
der Tisch muss Bingo-Namen selbst festhalten.

- [ ] **Schritt 6: Prüfen und committen**

```bash
npm run check
git add lib/raum/kanal.ts __tests__/lib/raum/kanal.test.ts docs/adr/
git commit -m "Carry game state in room presence"
```

### Aufgabe 3: Karte am Handy

**Dateien:**
- Neu: `lib/raum/handy-karte.ts`
- Ändern: `lib/bingo.ts` (`bingoLinie`)
- Test: `__tests__/lib/raum/handy-karte.test.ts`, Ändern: `__tests__/lib/bingo.test.ts`

**Schnittstellen:**
- Nutzt: `TischStand`, `SpielerStand` (Aufgabe 1), `karteAusteilen`, `feldSetzen`, `Karte`, `hatBingo`, `Zufall`
- Liefert:
  - `bingoLinie(karte: Karte): number[] | null` in `lib/bingo.ts` (erste volle Linie, `hatBingo` bleibt)
  - `type HandyKarte = { spiel: string; karte: Karte; abgehakt: { runde: number; feld: number } | null }`
  - `karteFuer(gemerkt: HandyKarte | null, spiel: string, zufall: Zufall = Math.random): HandyKarte` (gemerkt, wenn
    das Spiel stimmt, sonst neu ausgeteilt)
  - `feldFrei(handy: HandyKarte, stand: TischStand, index: number): boolean`
  - `abhaken(handy: HandyKarte, stand: TischStand, index: number): HandyKarte` (unverändert, wenn nicht frei)
  - `zuruecknehmen(handy: HandyKarte, stand: TischStand, index: number): HandyKarte` (unverändert bei Bingo im Spiel
    oder nicht abgehaktem Feld; war es das Feld dieser Runde, wird `abgehakt` wieder `null`)
  - `spielerStand(handy: HandyKarte): SpielerStand`

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

Testhilfe im Test: eine Karte, deren Felder 0 bis 4 `titel` sind, und
`stand = { spiel: "s1", runde: { nummer: 3, kategorie: "titel", aufgeloest: true }, bingo: [] }`.

```ts
test("abhaken merkt sich die Runde, ein zweites Feld geht nicht", () => {
  const nach = abhaken(handy, stand, 0);
  expect(nach.abgehakt).toEqual({ runde: 3, feld: 0 });
  expect(feldFrei(nach, stand, 1)).toBe(false);
  expect(abhaken(nach, stand, 1)).toBe(nach);
});
test("zuruecknehmen nach einem Bingo im Spiel geht nicht", () => {
  const nach = abhaken(handy, stand, 0);
  expect(zuruecknehmen(nach, { ...stand, bingo: ["Ben"] }, 0)).toBe(nach);
});
```

Weitere: „vor der Auflösung ist kein Feld frei“, „nur Felder der gedrehten Kategorie sind frei“, „ohne Runde ist kein
Feld frei“, „zuruecknehmen des Felds dieser Runde gibt die Runde frei“, „karteFuer behält die Karte desselben Spiels“,
„karteFuer teilt für ein anderes Spiel neu aus“, „spielerStand zählt Haken und erkennt Bingo“. In `bingo.test.ts`:
„bingoLinie liefert die Diagonale“ (`[0, 6, 12, 18, 24]`), „bingoLinie ohne Bingo ist null“.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/handy-karte.test.ts __tests__/lib/bingo.test.ts`

- [ ] **Schritt 3: `lib/raum/handy-karte.ts` schreiben, `bingoLinie` ergänzen**

`hatBingo` bleibt und nutzt dieselbe Liste `LINIEN`.

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/handy-karte.ts lib/bingo.ts __tests__/lib/
git commit -m "Add the phone card rules"
```

### Aufgabe 4: Karte und Notizfläche merken

**Dateien:**
- Ändern: `lib/raum/speicher.ts`
- Test: `__tests__/lib/raum/speicher.test.ts`

**Schnittstellen:**
- Nutzt: `HandyKarte` (Aufgabe 3)
- Liefert: `handyKarteLaden(): HandyKarte | null`, `handyKarteSpeichern(karte: HandyKarte): void`,
  `notizenAn(): boolean` (wahr, solange nicht `"aus"` gespeichert ist), `notizenSpeichern(an: boolean): void`;
  `handyRaumLoeschen()` löscht zusätzlich die Karte

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

„Karte übersteht das Neuladen“, „Notizfläche ist anfangs an und merkt sich aus“, „Raum löschen löscht auch die
Karte“.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/speicher.test.ts`

- [ ] **Schritt 3: Funktionen in `lib/raum/speicher.ts` ergänzen**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/speicher.ts __tests__/lib/raum/speicher.test.ts
git commit -m "Remember the phone card and notes setting"
```

### Aufgabe 5: Ausgegraute und hervorgehobene Felder

**Dateien:**
- Ändern: `app/ui/karte-ansicht.tsx`
- Test: `__tests__/ui/karte-ansicht.test.tsx` (neu)

**Schnittstellen:**
- Liefert: `KarteAnsicht({ karte, onFeldKlick, ausgegraut?: (index: number) => boolean, hervorgehoben?: number[] })`.
  Ausgegraut: `aria-disabled="true"` und `opacity-40`, der Klick kommt trotzdem an (die Spielansicht entscheidet).
  Hervorgehoben: deutlicher Rahmen (`ring-4 ring-foreground`) und `data-bingo="true"`. Ohne beide Props wie bisher.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

„graut die genannten Felder aus“ (`ausgegraut={(i) => i > 0}` → 24 Felder mit `aria-disabled="true"`),
„hebt die Bingo-Reihe hervor“ (`hervorgehoben={[0, 1, 2, 3, 4]}` → 5 Felder mit `data-bingo`).

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/karte-ansicht.test.tsx`

- [ ] **Schritt 3: Props in `app/ui/karte-ansicht.tsx` ergänzen**

- [ ] **Schritt 4: Alle UI-Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui`

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/karte-ansicht.tsx __tests__/ui/karte-ansicht.test.tsx
git commit -m "Grey out and highlight card fields"
```

### Aufgabe 6: Spielen am Handy

**Dateien:**
- Neu: `app/ui/handy-spiel.tsx`
- Ändern: `app/ui/handy-raum.tsx` (Zustand „drin“ zeigt `HandySpiel`; beim Wiederbeitritt erst nach erfolgreichem
  `anmelden` „drin“, damit die Anmeldung von `HandySpiel` mit Stand die letzte ist)
- Test: `__tests__/ui/handy-spiel.test.tsx` (neu), Ändern: `__tests__/ui/handy-raum.test.tsx`

**Schnittstellen:**
- Nutzt: Aufgaben 1 bis 5, `RaumKanal`, `tabSchluessel`
- Liefert: `HandySpiel({ code: string; name: string; kanal: RaumKanal; anwesende: Anwesend[]; zufall?: Zufall })`.
  `HandyRaum` reicht Raum-Code und seine `anwesende` durch.

Verhalten von `HandySpiel`:
- `stand = tischStandLesen(anwesende)`. Kein Tisch (`tischDa` falsch): „Der Tisch ist gerade nicht verbunden.“ Tisch
  ohne Stand: „Warte auf das Spiel …“. Darüber immer „Du bist im Raum ABCD als Anna.“ (bleibt aus Plan B, der
  Playwright-Test nutzt den Satz).
- Mit Stand: `karteFuer(handyKarteLaden(), stand.spiel, zufall)`, jede Änderung mit `handyKarteSpeichern` sichern
  und als `kanal.anmelden({ schluessel: tabSchluessel(), rolle: "spieler", name, stand: spielerStand(karte) })`
  melden: einmal, sobald die Karte da ist, danach nur, wenn sich `spielerStand` ändert.
- Karte über `KarteAnsicht`: `ausgegraut` = nicht abgehakt und nicht `feldFrei`. Klick auf ein freies Feld:
  `abhaken`; auf ein abgehaktes: `window.confirm("Abhaken zurücknehmen?")`, dann `zuruecknehmen`.
- Eigenes Bingo (`bingoLinie` nicht `null`): Überschrift „Bingo!“, `hervorgehoben` = die Linie. Bingo anderer
  (`stand.bingo` ohne den eigenen Namen): „Bingo! Anna“ mit allen Namen.
- Notizfläche: `textarea` mit Label „Notizen“, leert sich bei jeder neuen Runde und jedem neuen Spiel (über
  `key={`${stand.spiel}-${stand.runde?.nummer}`}`). Knopf „Notizen aus“ bzw. „Notizen an“, gemerkt mit
  `notizenSpeichern`. Ohne Notizfläche nimmt die Karte die ganze Breite ein (`max-w-sm` → `max-w-lg`).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

Mit `nachgebauterRaum()` und Anwesenden aus Tisch (mit Stand) und Anna; den Stand ändert der Test über
`anwesendeSetzen`.

Testnamen: „vor der Auflösung sind alle Felder grau“, „nach der Auflösung sind nur die Felder der Kategorie frei“,
„abhaken meldet die Zahl an den Tisch“ (`angemeldet` zuletzt `stand: { spiel: "s1", abgehakt: 1, bingo: false }`),
„Karte und Haken überstehen das Neuladen“ (Prüf-Schwerpunkt 1: neu rendern, Feld bleibt `aria-pressed`, alles grau),
„neues Spiel teilt eine neue Karte aus“ (Prüf-Schwerpunkt 2: Stand mit `spiel: "s2"` → kein Feld abgehakt),
„eigenes Bingo zeigt Bingo! und die Reihe“, „Bingo eines anderen zeigt seinen Namen“, „ohne Tisch: Der Tisch ist
gerade nicht verbunden.“ (Prüf-Schwerpunkt 5), „Notizfläche leert sich bei neuer Runde“, „Notizen aus wird gemerkt“.
In `handy-raum.test.tsx`: bestehende Tests bleiben grün, „Warte auf das Spiel …“ steht dort weiter (Tisch ohne
Stand).

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/handy-spiel.test.tsx __tests__/ui/handy-raum.test.tsx`

- [ ] **Schritt 3: `app/ui/handy-spiel.tsx` schreiben, `app/ui/handy-raum.tsx` anpassen**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/handy-spiel.tsx app/ui/handy-raum.tsx __tests__/ui/
git commit -m "Play the card on the phone"
```

### Aufgabe 7: Tisch spielt im Raum

**Dateien:**
- Ändern: `app/ui/start.tsx` (hält `stand: TischStand | null`, gibt ihn an `RaumKopf`, gibt `raum` an Demo und
  `VorbereitenAnsicht`; „Raum schließen“ setzt `stand` auf `null`)
- Ändern: `app/ui/raum-kopf.tsx` (Prop `stand`, meldet den Tisch mit Stand an und bei jeder Änderung neu, Leiste mit
  Zahl: „Anna 7“)
- Ändern: `app/ui/vorbereiten-ansicht.tsx` (reicht `raum` an `SpielAnsicht` durch)
- Ändern: `app/ui/spiel-ansicht.tsx` (Prop `raum`)
- Ändern: `app/ui/tisch.tsx` (Prop `gewinner?: string[]`: Überschrift „Bingo! Anna, Ben“)
- Test: `__tests__/ui/spiel-raum.test.tsx` (neu), Ändern: `__tests__/ui/raum-kopf.test.tsx`,
  `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: `tischStand`, `bingoNamen`, `spielerleiste` (Aufgabe 1), `RaumKanal`
- Liefert: `SpielAnsicht({ …, raum?: { kanal: RaumKanal; onStand: (stand: TischStand) => void } })`,
  `VorbereitenAnsicht({ …, raum? })` mit demselben Typ, `RaumKopf({ code, kanal, stand: TischStand | null,
  onGeschlossen })`

Verhalten von `SpielAnsicht` mit `raum`:
- Kennung `spiel` als State, neu mit `crypto.randomUUID()` bei „Spiel starten“ und „Neues Spiel“, dann `bingo: []`.
- Nach jeder Änderung von Spiel, Runde oder Bingo `raum.onStand(tischStand(spiel, runde, bingo))`.
- `raum.kanal.beiAnwesenden`: `bingo = bingoNamen(bingo, anwesende, spiel)`. Wird `bingo` nicht leer, hört die Musik
  auf (`musikAnhalten`).
- Statt `KarteAnsicht` nichts: Der Tisch steht allein, `Tisch` bekommt `bingo={bingo.length > 0}` und
  `gewinner={bingo}`. Die eigene Karte von `Spiel` bleibt unbenutzt.
- Ohne `raum` alles wie bisher (Tisch und Karte auf einem Gerät).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

`spiel-raum.test.tsx` mit `nachgebauterRaum()`, `SONGLISTE` und festem `zufall`:
„im Raum steht keine Karte am Tisch“, „Rad drehen und Lösung anzeigen melden den Stand“ (`onStand` zuletzt mit
`runde.aufgeloest: true` und der Kategorie-Id), „Bingo eines Spielers zeigt Bingo! Anna“, „Bingo zweier Spieler“
(Prüf-Schwerpunkt 3: erst Anna, dann Ben mit Bingo → „Bingo! Anna, Ben“), „Bingo bleibt, wenn der Spieler geht“
(Prüf-Schwerpunkt 4), „Neues Spiel bekommt eine neue Kennung und leert Bingo“.
`raum-kopf.test.tsx`: „meldet den Tisch mit Stand an“ (`angemeldet` zuletzt mit dem `stand` der Prop, auch nach
`rerender` mit neuem Stand), „Leiste zeigt die Zahl abgehakter Felder“ (Anna mit Stand `s1`, 7 → „Anna 7“).
`start.test.tsx`: „Demo im Raum zeigt den Tisch ohne Karte“.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/spiel-raum.test.tsx __tests__/ui/raum-kopf.test.tsx __tests__/ui/start.test.tsx`

- [ ] **Schritt 3: `spiel-ansicht.tsx`, `tisch.tsx`, `raum-kopf.tsx`, `vorbereiten-ansicht.tsx` und `start.tsx`
  anpassen**

- [ ] **Schritt 4: Alle Tests laufen lassen, sie müssen bestehen**

`npm test`
Erwartet: alle PASS, auch `spiel-ansicht`, `spiel-musik` und `spiel-aufloesung` (Spiel auf einem Gerät unverändert)

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/ __tests__/ui/
git commit -m "Run the game from the table in a room"
```

### Aufgabe 8: Playwright, Doku und Spiel mit echten Handys

**Dateien:**
- Neu: `e2e/spiel.spec.ts`
- Ändern: `docs/Projektvision.md` (Phase 4: „Tisch macht nach dem Neuladen weiter“; Geklärte Fragen zu Phase 3:
  Bingo-Regel in derselben Runde, Spielstand über Presence mit Link auf ADR 0005), `docs/Glossar.md` (Bingo: „wer es
  zuerst hat“ → „wer es in der Runde des ersten Bingos hat“), `CLAUDE.md` (Repo-Struktur nur, falls sich etwas
  ändert), `docs/tools/Supabase.md` (Presence trägt den Spielstand, `track()` ersetzt den Eintrag)

- [ ] **Schritt 1: `e2e/spiel.spec.ts` schreiben**

Ein Test, drei Browser-Kontexte gegen das echte Supabase-Projekt: Tisch „Raum eröffnen“ → Handy 1 tritt als „Anna“
bei → Tisch „Demo starten“, „Spiel starten“ → Handy 1 zeigt 25 Felder, alle mit `aria-disabled="true"` → Tisch „Rad
drehen“, warten auf „Lösung anzeigen“, klicken → Handy 1 hat genau 5 Felder ohne `aria-disabled` → eines anklicken →
Tisch zeigt „Anna 1“ → Handy 1 lädt neu, das Feld ist weiter `aria-pressed="true"` → Handy 2 tritt als „Ben“ bei und
sieht 25 Felder (mitten im Spiel) → Tisch zeigt „Ben 0“. Bingo hängt vom Zufall ab und wird in Vitest und mit echten
Handys geprüft.

- [ ] **Schritt 2: Laufen lassen, beide Tests müssen bestehen**

`npm run e2e`
Erwartet: `2 passed`

- [ ] **Schritt 3: Doku, prüfen, committen, PR**

```bash
npm run check
git add e2e/spiel.spec.ts docs/ CLAUDE.md
git commit -m "Add Playwright test for a game in a room"
```

PR öffnen, `gh pr checks <nr>` grün, `/code-review`, `plan-pruefer` gegen diesen Plan.

- [ ] **Schritt 4 (Entwickler): Spiel mit echten Handys unter der Production**

Nach dem Merge am Laptop `https://musik-bingo.vercel.app`, mit Spotify anmelden, Raum eröffnen, Playlist wählen. Zwei
Handys treten per QR-Code bei. Ein komplettes Spiel bis zum Bingo: Notizfläche nutzen, nach jeder Auflösung abhaken,
die Zahlen in der Leiste steigen. Unterwegs lädt ein Handy neu (Karte bleibt), ein drittes tritt mitten im Spiel bei
(bekommt sofort eine Karte), ein Handy sperrt kurz den Bildschirm (sieht danach die laufende Runde). Bei Bingo zeigt
der Tisch den Namen und die Musik hört auf.

**Fertig, wenn:** Das Spiel aus Schritt 4 läuft bis zum Bingo, der Tisch zeigt den Namen. `npm run e2e`,
`npm run check` und `gh pr checks` grün, `plan-pruefer` hat den Branch gegen diesen Plan geprüft. Damit ist Phase 3
abgeschlossen.
