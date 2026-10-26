---
titel: "Plan: Online spielen (ohne Ton)"
status: aktiv
erstellt: 2026-10-26
tags: [plan, online-modus, raum, phase-4]
---

# Plan: Online spielen (ohne Ton)

**Ziel:** Auf der Startseite gibt es neben „Lokal spielen“ den Weg „Online spielen“. Der DJ spielt dann mit eigener Karte
im Browser mit, und jeder Spieler sieht Rad, Kategorie und Auflösung neben seiner Karte am PC.

**Vorgehen:** Teil 1 von 3 des Online-Modus (Teil 2 Notizen in der Auflösung, Teil 3 Ton vom DJ, je ein eigener Plan).
Online ist ein Raum, in dem der DJ einen Namen trägt (`TischRaum.dj`). Der Stand des Tischs meldet dann `online: true`
und nach der Auflösung die Angaben zum Song. Der Spieler baut daraus eine Runde und zeigt den bestehenden `Tisch` ohne
Knöpfe. Der DJ hat wie in der Demo ohne Raum die Karte aus `spiel.karte` neben dem Tisch. Spielbar und testbar mit der
Demo, ganz ohne Spotify.

**Technik:** React, Tailwind, Supabase Realtime (vorhandener Raum-Kanal), Vitest mit Testing Library, Playwright. Keine
neuen Pakete.

**Anforderung:** [[0008-online-modus-mit-ton-vom-dj|ADR 0008]], Fragerunden im Gespräch vom 2026-10-26: Modus auf der
Startseite, DJ spielt mit, jeder sieht Rad, Kategorie und Auflösung selbst, Spieler am eigenen PC, Spieler prüfen
selbst.

## Annahmen (bitte prüfen)

- **Knöpfe:** „Raum eröffnen“ heißt künftig „Lokal spielen“, daneben „Online spielen“. „Online spielen“ fragt nach dem
  Namen des DJs, „Online-Raum eröffnen“ eröffnet den Raum. Beitreten mit Raum-Code bleibt wie bisher.
- **Gleiches Layout für DJ und Spieler:** Tisch und Karte nebeneinander wie in der Demo ohne Raum
  (`max-w-5xl md:grid-cols-2`). Rad oben, Abschnitt zur Runde darunter, rechts die Karte.
- **Der DJ steht nicht in der Spielerleiste** seines Raum-Kopfs, er sieht seine Karte ja selbst.
- **QR-Code bleibt** im Online-Raum, auch wenn ihn online kaum jemand scannt.
- **Kein Ton in Teil 1.** Wer vor Teil 3 online spielen will, hört über einen Sprachkanal mit.

## Feste Vorgaben

- Begriffe aus `docs/Glossar.md`: DJ (nicht Host), Online-Modus, Lokaler Modus, Tisch, Spieler.
- Ein Stand ohne `online` gilt als lokal: Ältere Fassungen der App schicken das Feld nicht.
- Im lokalen Modus bekommen die Handys weiterhin keine Angaben zum Song (keine Lösung im Stand).
- Lösung nur im Stand, wenn `aufgeloest` wahr ist: vor der Auflösung verrät der Stand nichts.
- Bestehende Texte und Rollen bleiben, Tests und Bots suchen danach (`role="status"` für die Kategorie, Knöpfe
  „Rad drehen“, „Lösung anzeigen“, „Nächste Runde“, `aria-label="Rad"`).
- Prüfbefehle aus `CLAUDE.md`: `npm run check` vor jedem Commit, `npm run e2e` vor dem PR (Port 3000 frei).

## Prüf-Schwerpunkte

1. **Ein Spieler tippt den Namen des DJs** (auch in anderer Schreibweise, „matthias“ statt „Matthias“): „Name schon
   vergeben“, sonst stünden in der Bingo-Liste zwei Gleiche. → Aufgabe 2
2. **Ein Spieler tritt mitten in einer aufgelösten Runde bei:** Er sieht die Lösung sofort, das Rad dreht nicht noch
   einmal, die Kategorie ist sichtbar. → Aufgabe 3
3. **Beim Zuschauer erscheint die Kategorie erst, wenn das Rad steht**, wie beim DJ, sonst verrät das Schild die
   Kategorie 4 Sekunden vor dem Rad. → Aufgabe 3
4. **DJ und ein Spieler haben in derselben Runde Bingo:** Beide stehen in „Bingo! …“, bei allen. → Aufgabe 4
5. **Der DJ lädt die Seite neu:** Der Raum ist wieder ein Online-Raum mit seinem Namen, nicht plötzlich lokal.
   → Aufgabe 5

## Dateien

| Datei | Änderung |
|---|---|
| `lib/raum/stand.ts` | `TischStand` mit `online` und `song`, `tischStand` mit Schalter `online`, `istTischStand`, neu `rundeAusStand` |
| `lib/raum/spieler.ts` | Tisch in Presence mit optionalem `name`, `nameVergeben` zählt ihn mit |
| `lib/raum/kanal.ts` | `anwesendeLesen` behält den Namen des Tischs |
| `lib/raum/speicher.ts` | `TischRaum.dj` |
| `app/ui/tisch.tsx` | Schalter `zuschauer` (keine Knöpfe), Rad dreht auch bei neuer Rundennummer ohne Klick |
| `app/ui/spiel-ansicht.tsx` | `raum.dj`: Karte neben dem Tisch, Stand mit `online`, Bingo des DJs |
| `app/ui/start.tsx`, `app/ui/raum-kopf.tsx` | „Lokal spielen“ und „Online spielen“, Name des DJs, Anmelden mit Namen |
| `app/ui/handy-spiel.tsx` | online: Tisch als Zuschauer neben Karte und Notizen |
| `e2e/hilfen/raum.ts`, `e2e/online.spec.ts` | Bot eröffnet lokal oder online, ein Browser-Test für eine Online-Runde |

### Aufgabe 1: Stand mit Lösung für den Online-Modus

**Dateien:**
- Ändern: `lib/raum/stand.ts`
- Test: `__tests__/lib/raum/stand.test.ts`

**Schnittstellen:**
- Liefert:
  - `type SongAngaben = Pick<Song, "titel" | "interpret" | "jahr" | "cover">`
  - `TischStand = { spiel: string; online?: true; runde: { nummer; kategorie; aufgeloest; song?: SongAngaben } | null; bingo: string[] }`
  - `tischStand(spiel: string, runde: Runde | null, bingo: string[], online = false): TischStand`
  - `rundeAusStand(stand: TischStand): Runde | null`: Kategorie aus `KATEGORIEN` per Id, Song aus `song` oder vor der
    Auflösung ein leerer Song `{ id: "", titel: "", interpret: "", jahr: 0 }`, `abgehaktesFeld: null`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("online nach der Auflösung: Stand mit online und den Angaben zum Song", () => {
  const stand = tischStand("s1", { ...runde, aufgeloest: true }, [], true);
  expect(stand.online).toBe(true);
  expect(stand.runde?.song).toEqual({ titel: "Bohemian Rhapsody", interpret: "Queen", jahr: 1975, cover: undefined });
});

test("online vor der Auflösung: kein Song im Stand", () => {
  expect(tischStand("s1", runde, [], true).runde?.song).toBeUndefined();
});

test("lokal auch nach der Auflösung kein Song und kein online", () => {
  const stand = tischStand("s1", { ...runde, aufgeloest: true }, []);
  expect(stand.runde?.song).toBeUndefined();
  expect("online" in stand).toBe(false);
});

test("istTischStand nimmt Stände mit und ohne online und song, keinen kaputten Song", () => {
  expect(istTischStand({ spiel: "s", runde: null, bingo: [] })).toBe(true);
  expect(istTischStand(tischStand("s1", { ...runde, aufgeloest: true }, [], true))).toBe(true);
  expect(istTischStand({ spiel: "s", online: true, bingo: [],
    runde: { nummer: 1, kategorie: "titel", aufgeloest: true, song: { titel: 3 } } })).toBe(false);
});

test("rundeAusStand baut die Runde, vor der Auflösung mit leerem Song", () => {
  expect(rundeAusStand({ spiel: "s", runde: null, bingo: [] })).toBeNull();
  const offen = rundeAusStand(tischStand("s1", runde, [], true))!;
  expect(offen.kategorie.id).toBe("titel");
  expect(offen.song.titel).toBe("");
  const aufgeloest = rundeAusStand(tischStand("s1", { ...runde, aufgeloest: true }, [], true))!;
  expect(aufgeloest.song.interpret).toBe("Queen");
});
```

`runde` ist eine Runde 1, Kategorie Titel, mit dem Song „Bohemian Rhapsody“, Queen, 1975 aus `SONGLISTE`.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/stand.test.ts`
Erwartet: FAIL, `rundeAusStand` ist nicht exportiert, `stand.online` ist `undefined`.

- [x] **Schritt 3: `tischStand`, `istTischStand` und `rundeAusStand` in `lib/raum/stand.ts`**

`online` nur setzen, wenn wahr (damit lokale Stände unverändert bleiben), `song` nur bei `online && aufgeloest`.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/lib/raum/stand.test.ts`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/stand.ts __tests__/lib/raum/stand.test.ts
git commit -m "Send song details in online table state after reveal"
```

### Aufgabe 2: DJ mit Namen in Presence

**Dateien:**
- Ändern: `lib/raum/spieler.ts`, `lib/raum/kanal.ts`
- Test: `__tests__/lib/raum/spieler.test.ts`, `__tests__/lib/raum/kanal.test.ts`

**Schnittstellen:**
- Liefert: `Anwesend = { schluessel: string; rolle: "tisch"; name?: string } | { schluessel; rolle: "spieler"; name }`.
  `nameVergeben` zählt den Namen des Tischs wie den eines anderen Spielers.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
// spieler.test.ts
test("der Name des DJs im Online-Raum ist vergeben, ohne Groß- und Kleinschreibung", () => {
  const anwesende: Anwesend[] = [{ schluessel: "t", rolle: "tisch", name: "Matthias" }];
  expect(nameVergeben(anwesende, "matthias", "a")).toBe(true);
});

// kanal.test.ts, nach dem Muster der vorhandenen Tests zu anwesendeLesen (Zeile 86)
test("ein Tisch mit Namen behält ihn, presence_ref fällt weg", ...);
// zustand { t: [{ schluessel: "t", rolle: "tisch", name: "Matthias", presence_ref: "r1" }] }
// erwartet [{ schluessel: "t", rolle: "tisch", name: "Matthias" }]
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/spieler.test.ts __tests__/lib/raum/kanal.test.ts`
Erwartet: FAIL, Typfehler bei `name` am Tisch und `false` statt `true`.

- [x] **Schritt 3: `Anwesend` und `nameVergeben` in `lib/raum/spieler.ts`, `anwesendeLesen` in `lib/raum/kanal.ts`**

Ein Tisch ohne Namen bleibt `{ schluessel, rolle }` ohne Feld `name` (die vorhandenen Tests prüfen mit `toEqual`).

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/lib/raum`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/spieler.ts lib/raum/kanal.ts __tests__/lib/raum/spieler.test.ts __tests__/lib/raum/kanal.test.ts
git commit -m "Treat the online DJ's name as taken"
```

### Aufgabe 3: Tisch als Zuschauer

**Dateien:**
- Ändern: `app/ui/tisch.tsx`
- Test: neu `__tests__/ui/tisch-zuschauer.test.tsx`

**Schnittstellen:**
- Nutzt: `rundeAusStand` (Aufgabe 1) im Test, um Runden zu bauen.
- Liefert: `Tisch` mit `zuschauer?: boolean`. Mit `zuschauer` fehlt die Zeile mit den Knöpfen und „Jahr korrigieren“,
  der Hinweis „Richtig? Hake ein Feld … ab.“ bleibt. Für alle gilt: Wechselt `runde.nummer` zwischen zwei Rendern, dreht
  das Rad (`dreht` wahr bis `onStillstand`), auch ohne Klick auf „Rad drehen“. Beim ersten Rendern dreht es nicht.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
test("Zuschauer sieht keine Knöpfe", () => {
  zeigen(offeneRunde);  // render(<Tisch zuschauer runde={…} … no-op-Handler />)
  expect(screen.queryByRole("button")).toBeNull();
});

test("neue Runde: Kategorie erst, wenn das Rad steht", () => {
  const { neu } = zeigen(null);
  neu(offeneRunde);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("Das Rad dreht …")).toBeDefined();
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
  expect(screen.getByRole("status").textContent).toBe("Titel");
});

test("Beitritt in einer aufgelösten Runde: Lösung sofort, das Rad dreht nicht", () => {
  zeigen(aufgeloesteRunde);
  expect(screen.getByRole("status").textContent).toBe("Titel");
  expect(screen.getByRole("heading", { level: 2, name: "Bohemian Rhapsody" })).toBeDefined();
  expect(screen.getByText("Richtig? Hake ein Feld Titel ab.")).toBeDefined();
});
```

`neu(runde)` rendert denselben `Tisch` mit `rerender` und neuer Runde.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/tisch-zuschauer.test.tsx`
Erwartet: FAIL, Knöpfe vorhanden und `status` sofort sichtbar.

- [x] **Schritt 3: `zuschauer` und Drehen bei neuer Rundennummer in `app/ui/tisch.tsx`**

Rundennummer wie in `HandySpiel` beim Rendern vergleichen (State mit der zuletzt gesehenen Nummer), nicht im Effekt.
`drehen()` setzt `dreht` weiter selbst, damit sich am DJ-Tisch nichts ändert.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui`
Erwartet: PASS, auch die vorhandenen Tests von `SpielAnsicht`.

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/tisch.tsx __tests__/ui/tisch-zuschauer.test.tsx
git commit -m "Add spectator mode to the table view"
```

### Aufgabe 4: Spielansicht des DJs im Online-Raum

**Dateien:**
- Ändern: `app/ui/spiel-ansicht.tsx`
- Test: `__tests__/ui/spiel-raum.test.tsx`

**Schnittstellen:**
- Nutzt: `tischStand(…, online)` (Aufgabe 1).
- Liefert: `raum?: { kanal; onStand; dj?: string }`. Mit `dj`: Karte (`KarteAnsicht` mit `spiel.karte`) neben dem Tisch
  im Layout ohne Raum, Stand mit `online: true`, und hat die Karte des DJs Bingo, steht `dj` in der Bingo-Liste.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
test("online: Karte des DJs am Tisch, Stand mit online und nach der Auflösung mit Song", () => {
  const { onStand } = spielen(undefined, undefined, "Matthias");   // spielen() bekommt dj als dritten Parameter
  expect(screen.getAllByRole("button", { name: /^Feld / })).toHaveLength(25);
  drehen("Rad drehen");
  klick("Lösung anzeigen");
  expect(onStand).toHaveBeenLastCalledWith(expect.objectContaining({ online: true,
    runde: expect.objectContaining({ song: expect.objectContaining({ titel: SONGLISTE[0].titel }) }) }));
});

test("online: Bingo des DJs und eines Spielers stehen beide in der Liste", () => {
  // Zufall 0.999 wie in spiel-ansicht.test.tsx ("fünf in einer Reihe"): Felder 20 bis 24 sind "Jahr ±3", das Rad
  // wählt immer "Jahr ±3". Vier Runden lang hakt der DJ Feld 20 + runde ab. In Runde 5 schickt der Test erst
  // { art: "spieler", name: "Anna", stand: { spiel: <Kennung aus onStand>, abgehakt: 5, bingo: true } }, dann hakt
  // der DJ Feld 24 ab.
  // erwartet: onStand zuletzt mit bingo, das "Anna" und "Matthias" enthält,
  //           Überschrift "Bingo! Anna, Matthias"
});
```

`spielen()` bekommt dafür `zufall` als vierten Parameter, Standard `() => 0`.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/spiel-raum.test.tsx`
Erwartet: FAIL, keine Felder am Tisch, `online` fehlt im Stand.

- [x] **Schritt 3: `raum.dj` in `app/ui/spiel-ansicht.tsx`**

Bingo des DJs über `bingoNamen(alt, { [dj]: { spiel: spielId, abgehakt, bingo: true } }, spielId)` dazunehmen, sobald
`hatBingo(spiel.karte)`. Layout und `onFeldKlick` wie im Zweig `!raum`.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/spiel-ansicht.tsx __tests__/ui/spiel-raum.test.tsx
git commit -m "Let the DJ play along with a card in online rooms"
```

### Aufgabe 5: Startseite mit „Lokal spielen“ und „Online spielen“

**Dateien:**
- Ändern: `lib/raum/speicher.ts`, `app/ui/start.tsx`, `app/ui/raum-kopf.tsx`, `e2e/hilfen/raum.ts`
- Test: `__tests__/ui/start.test.tsx`, `__tests__/ui/raum-kopf.test.tsx`

**Schnittstellen:**
- Nutzt: `raum.dj` (Aufgabe 4), `Anwesend` mit Namen (Aufgabe 2), `nameLesen` aus `lib/raum/spieler.ts`.
- Liefert: `TischRaum = { code: string; bekannt: string[]; dj?: string }`. `RaumKopf` meldet sich mit
  `{ schluessel, rolle: "tisch", name: dj }` an, wenn `dj` gesetzt ist (neuer Parameter `dj?: string`).
  `Tisch.eroeffnen(browser, dj?: string)` im Bot: ohne `dj` „Lokal spielen“, mit `dj` „Online spielen“, Name, „Online-Raum eröffnen“.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
// start.test.tsx: vorhandene Tests suchen künftig "Lokal spielen" statt "Raum eröffnen"
test("Online spielen fragt nach dem Namen und eröffnet einen Online-Raum", async () => {
  // klick "Online spielen", Name "Matthias" tippen, klick "Online-Raum eröffnen"
  // erwartet: tischRaumLaden()?.dj === "Matthias", Raum-Kopf sichtbar,
  //           Demo starten → Spiel starten zeigt 25 Felder (Karte des DJs)
});

test("Online-Raum eröffnen ist aus, solange der Name leer ist", async () => { … });

test("gespeicherter Online-Raum ist nach dem Neuladen wieder online", async () => {
  // tischRaumSpeichern({ code: "ABCD", bekannt: [], dj: "Matthias" }), rendern, Demo starten
  // erwartet: 25 Felder am Tisch
});

// raum-kopf.test.tsx
test("im Online-Raum meldet sich der Tisch mit dem Namen des DJs an", async () => {
  // erwartet: raum.angemeldet enthält { schluessel, rolle: "tisch", name: "Matthias" }
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/start.test.tsx __tests__/ui/raum-kopf.test.tsx`
Erwartet: FAIL, keine Knöpfe „Lokal spielen“ und „Online spielen“.

- [x] **Schritt 3: `TischRaum.dj`, Knöpfe und Namensfeld in `start.tsx`, `dj` in `RaumKopf`, Bot anpassen**

Das Namensfeld wie in `HandyRaum` (`label` „Dein Name“, `nameLesen`). `dj` aus `tischRaum` an `RaumKopf` und an das
`raum`-Objekt in `ablauf()` geben, `VorbereitenAnsicht` reicht es schon an `SpielAnsicht` weiter.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/speicher.ts app/ui/start.tsx app/ui/raum-kopf.tsx e2e/hilfen/raum.ts __tests__/ui/start.test.tsx __tests__/ui/raum-kopf.test.tsx
git commit -m "Add online rooms to the start page"
```

### Aufgabe 6: Spieler sieht im Online-Raum den Tisch

**Dateien:**
- Ändern: `app/ui/handy-spiel.tsx`
- Test: `__tests__/ui/handy-spiel.test.tsx`

**Schnittstellen:**
- Nutzt: `rundeAusStand` (Aufgabe 1), `Tisch` mit `zuschauer` (Aufgabe 3).
- Liefert: Ist `stand.online`, zeigt `HandySpiel` links `Tisch zuschauer` (Runde aus `rundeAusStand`, `bingo` aus
  `stand.bingo.length > 0`, `gewinner` = `stand.bingo`), rechts Karte und Notizen, im Layout `max-w-5xl md:grid-cols-2`.
  Ohne Tisch in Presence heißt der Hinweis online „Der DJ ist gerade nicht verbunden.“

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
const online: TischStand = { ...runde3, online: true };
const onlineAufgeloest: TischStand = { ...online, runde: { ...runde3.runde!, aufgeloest: true,
  song: { titel: "Bohemian Rhapsody", interpret: "Queen", jahr: 1975 } } };

test("online: Rad und Kategorie neben der Karte", () => {
  spielen(online);
  expect(screen.getByRole("img", { name: "Rad" })).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe("Titel");
  expect(felder()).toHaveLength(25);
});

test("online: nach der Auflösung Lösung und Angaben", () => {
  spielen(onlineAufgeloest);
  expect(screen.getByRole("heading", { level: 2, name: "Bohemian Rhapsody" })).toBeDefined();
  expect(screen.getByText("Queen")).toBeDefined();
});

test("lokal kein Rad am Handy", () => {
  spielen(runde3);
  expect(screen.queryByRole("img", { name: "Rad" })).toBeNull();
});

test("online ohne Tisch: Der DJ ist gerade nicht verbunden.", () => {
  const { neu } = spielen(null, []);
  neu(online);
  expect(screen.getByText("Der DJ ist gerade nicht verbunden.")).toBeDefined();
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/handy-spiel.test.tsx`
Erwartet: FAIL, kein Rad am Handy.

- [x] **Schritt 3: Online-Zweig in `app/ui/handy-spiel.tsx`**

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/handy-spiel.tsx __tests__/ui/handy-spiel.test.tsx
git commit -m "Show the table to players in online rooms"
```

### Aufgabe 7: Browser-Test einer Online-Runde und Abschluss

**Dateien:**
- Neu: `e2e/online.spec.ts`
- Ändern: `docs/tools/Playwright.md` (Liste der Browser-Tests um `online.spec.ts` ergänzen, falls es dort eine gibt)

**Schnittstellen:**
- Nutzt: `Tisch.eroeffnen(browser, "Matthias")` (Aufgabe 5) und den vorhandenen Spieler-Bot.

- [x] **Schritt 1: Browser-Test schreiben**

```ts
test("Online-Raum: DJ und Spieler sehen dieselbe Runde und haken beide ab", async ({ browser }) => {
  // DJ eröffnet online als "Matthias", Demo starten, Spieler "Anna" tritt bei.
  // "Matthias" als Name für Anna → "Name schon vergeben", dann "Anna".
  // DJ dreht, Anna sieht dieselbe Kategorie (role=status) erst nach dem Stillstand.
  // DJ zeigt die Lösung, Anna sieht dieselbe Überschrift wie der DJ.
  // Beide haken ein Feld der Kategorie ab, Raum-Kopf des DJs zeigt "Anna 1".
  // Am Ende: keine Fehler in tisch.fehler und anna.fehler.
});
```

- [x] **Schritt 2: Browser-Tests laufen lassen, sie müssen bestehen**

`npm run e2e` (Port 3000 vorher frei, nach Änderungen am Raum zusätzlich `npx playwright test --repeat-each=3`)
Erwartet: alle Tests grün, auch die vorhandenen mit „Lokal spielen“.

- [x] **Schritt 3: Screenshots prüfen**

Mit dem Playwright-MCP DJ und Spieler im Online-Raum bei 1280×800: Rad, Abschnitt zur Runde und Karte sind
ohne seitliches Scrollen sichtbar. Fällt die Karte unter den Tisch, ist das in Ordnung, seitliches Scrollen nicht.

- [x] **Schritt 4: Prüfen und committen**

```bash
npm run check
git add e2e/online.spec.ts docs/tools/Playwright.md
git commit -m "Add browser test for an online round"
```

PR „Add online mode without audio“, `/code-review`, Funde mit dem Entwickler durchgehen, `gh pr checks <nr>` grün,
mergen. Danach Plan auf `status: abgeschlossen`.
