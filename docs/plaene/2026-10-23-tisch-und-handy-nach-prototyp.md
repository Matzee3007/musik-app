---
titel: "Plan: Tisch und Handy nach den Prototypen"
status: aktiv
erstellt: 2026-10-23
tags: [plan, oberflaeche, design, phase-4]
---

# Plan: Tisch und Handy nach den Prototypen

**Ziel:** Der Abschnitt zur Runde am Tisch hat in jedem Zustand dieselbe Größe und zeigt Lösung und Cover größer, die
Musikspur wird eine bewegte Wellenlinie, der Raum wird eine Schublade mit einem Knopf, die Kategoriefarben werden
kräftiger, die Handy-Karte bekommt höhere Felder mit Kreuz, und die Songliste vor dem Spiel fällt weg.

**Vorgehen:** Drei PRs nacheinander, jeder von `main` aus, nachdem der vorige gemergt ist: Teil 1 Tisch und Raum (mit
den Farben), Teil 2 Handy-Karte, Teil 3 ohne Songliste. Vorlage für Maße, Texte und Verhalten sind die Prototypen,
die der Entwickler am 2026-10-22/23 abgenommen hat. Was hier steht, geht vor, wo ein Prototyp anders aussieht.

**Technik:** Tailwind v4 (Container-Queries `@container`, `cqw`), SVG, `requestAnimationFrame`, `localStorage`,
Vitest mit Testing Library, Playwright. Keine neuen Pakete.

**Anforderung:** Rückmeldung des Entwicklers im Gespräch vom 2026-10-22/23, abgenommen in drei Prototypen (privat,
claude.ai): [Tisch](https://claude.ai/artifact/QJePjRFYUsy4rjjBCizeUr) (Version 7),
[Handy](https://claude.ai/artifact/EFZbt35Ln1uqzZAKfthRst) (Version 2),
[Playlists](https://claude.ai/artifact/Xm6q6XqR3iQdMLuYBLPNUu) (Version 2). Entscheidungen: Raum-Zustand bleibt
über ein Neuladen (1B), der Raum blendet sich nicht von selbst aus (2A).

## Annahmen (bitte prüfen)

- **Gesuchte Angabe bei „Jahr ±3“** ist die Zeile „Jahr“.
- **Bei Bingo** steht „Bingo! …“ im großen Platz statt der Lösung. Die Lösung bleibt in den Angaben sichtbar, das
  Cover auch (vorher wurde es bei Bingo ausgeblendet).
- **Lange Titel** brechen im großen Platz nach zwei Zeilen mit „…“ ab, ab 17 Zeichen ist die Schrift kleiner.
- **Die offene Schublade** darf auf Laptops unter etwa 1600 Pixel Breite den linken Rand des Rads verdecken (vom
  Entwickler so gewünscht: Rad und Abschnitt immer gleich groß).
- **Kreuz und Hochformat** gelten auch für die Karte in der Demo am Laptop (dieselbe `KarteAnsicht`).

## Feste Vorgaben

- Kategoriefarben: Titel `#3d8bff`, Interpret `#ff4f9a`, Jahrzehnt `#ff8a1f`, Jahr `#1fd18a`, Jahr ±3 `#9b6bff`.
- Bestehende Texte und Rollen bleiben, Tests und Bots suchen danach: `role="status"` nur für die Kategorie, Lösung als
  `h2`, „Bingo! …“ als Überschrift, „Musikspur läuft“/„Musikspur steht“ als `role="img"`, „Cover von <Titel>“,
  „Runde <n>“, „Richtig? Hake ein Feld <Kategorie> ab.“, alle Knopftexte, „Raum schließen“, Titel
  „QR-Code für Raum <Code>“.
- Neue Texte: „Bereit?“, „Das Rad dreht …“, „Lösung · <Kategorie>“, Platzhalter „· · ·“, Knopf „Raum ausblenden“ /
  „Raum zeigen“, „<n> Songs mit unsicherem Jahr. Prüfe es bei der Auflösung.“ (Einzahl: „1 Song mit unsicherem
  Jahr. …“).
- Farben nur über Tokens aus `app/globals.css` oder `kategorie.farbe`, Knöpfe über `Knopf`, Fokus sichtbar
  (`outline-akzent`), `prefers-reduced-motion` beachten.
- `npm run check` vor jedem Commit, `npm run e2e` vor jedem PR, nach Änderungen an `app/globals.css` den Dev-Server
  neu starten. Screenshots der Zustände mit dem Playwright-MCP vor jedem PR (1280×800 und 390×844).
- Branches: `feat/tisch-buehne-fest`, `feat/handy-karte-hoch`, `feat/ohne-songliste`.

## Prüf-Schwerpunkte

1. Der Abschnitt „Runde“ ist bei „Rad drehen“, „Song läuft“, „Lösung“ und „Bingo“ gleich groß (Aufgabe 4, e2e).
2. Tisch mit offenem Raum und bei Bingo passt auf 1280×800 ohne Scrollen, das Rad ist mindestens 480 Pixel breit
   (Aufgabe 4, e2e, bestehender Test in `e2e/design.spec.ts` bleibt grün).
3. Raum ausblenden, Seite neu laden: Der Raum bleibt ausgeblendet, der Code steht im Knopf (Aufgabe 5, Vitest).
4. Handy 390×844 mit Notizen: Karte, Notizen und „Notizen aus“ passen ohne Scrollen (Aufgabe 6, e2e).
5. Playlist mit fraglichen Jahren: Vor dem Spiel ist kein Titel und kein Jahr zu sehen, nur die Zahl (Aufgabe 7,
   Vitest).

## Teil 1: Tisch und Raum (`feat/tisch-buehne-fest`)

### Aufgabe 1: Kräftigere Kategoriefarben

**Dateien:**
- Ändern: `lib/kategorien.ts`
- Test: `__tests__/lib/kategorien.test.ts`

**Schnittstellen:**
- Liefert: `KATEGORIEN[i].farbe` mit den Werten aus den Festen Vorgaben.

- [x] **Schritt 1: Fehlschlagenden Test schreiben**

```ts
test("Kategorien haben die kräftigen Farben", () => {
  expect(Object.fromEntries(KATEGORIEN.map((k) => [k.id, k.farbe]))).toEqual({
    titel: "#3d8bff",
    interpret: "#ff4f9a",
    jahrzehnt: "#ff8a1f",
    jahr: "#1fd18a",
    jahrPlusMinus3: "#9b6bff",
  });
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**

`npx vitest run __tests__/lib/kategorien.test.ts`
Erwartet: FAIL, `titel` ist `#6fa8dc`

- [x] **Schritt 3: Farben in `lib/kategorien.ts` tauschen**
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**

`npx vitest run __tests__/lib/kategorien.test.ts`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/kategorien.ts __tests__/lib/kategorien.test.ts docs/plaene/2026-10-23-tisch-und-handy-nach-prototyp.md
git commit -m "Use stronger category colors"
```

### Aufgabe 2: Wellenlinie als reine Funktion

**Dateien:**
- Neu: `app/ui/welle.ts`
- Test: `__tests__/ui/welle.test.ts`

**Schnittstellen:**
- Liefert: `wellenPunkte(sekunden: number, staerke: number): [number, number][]` in einem Feld 240 × 100, Mitte
  `y = 50`. Punkte: `[6, 50]`, `[34, 50]`, dann 11 Zacken, dann `[206, 50]`, `[234, 50]` (15 Punkte). Zacke `i`
  liegt bei `x = 34 + (i + 0.5) / 11 · 172`, abwechselnd nach oben (gerade `i`, `y < 50`) und unten. Höhe
  `46 · sin(π · (i + 0.5) / 11)^1.6 · wackeln · staerke`, `wackeln` aus zwei Sinus je Zacke wie im Prototyp
  (Werte zwischen 0,1 und 1). `staerke` 1 = läuft, 0,18 = steht.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("außen flach, 11 Zacken abwechselnd oben und unten", () => {
  const p = wellenPunkte(1.3, 1);
  expect(p).toHaveLength(15);
  expect([p[0], p[1], p[13], p[14]].every(([, y]) => y === 50)).toBe(true);
  expect(p.slice(2, 13).map(([, y]) => Math.sign(y - 50))).toEqual([-1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1]);
});

test("die mittlere Zacke ist höher als die äußeren", () => {
  const ausschlag = (y: number) => Math.abs(y - 50);
  const p = wellenPunkte(0, 1);
  expect(ausschlag(p[7][1])).toBeGreaterThan(ausschlag(p[2][1]));
  expect(ausschlag(p[7][1])).toBeGreaterThan(ausschlag(p[12][1]));
});

test("Stärke 0 ist eine flache Linie, kein Ausschlag geht über das Feld hinaus", () => {
  expect(wellenPunkte(2, 0).every(([, y]) => y === 50)).toBe(true);
  for (let s = 0; s < 10; s += 0.37)
    expect(wellenPunkte(s, 1).every(([, y]) => y >= 4 && y <= 96)).toBe(true);
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/welle.test.ts`
Erwartet: FAIL, Modul `@/app/ui/welle` fehlt

- [x] **Schritt 3: `wellenPunkte` in `app/ui/welle.ts` schreiben**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/welle.ts __tests__/ui/welle.test.ts
git commit -m "Add zigzag wave shape for the music track"
```

### Aufgabe 3: Musikspur als bewegte Wellenlinie

**Dateien:**
- Ändern: `app/ui/musikspur.tsx`, `app/globals.css` (Balken-Animation `musikspur-springen` und `.musikspur-balken`
  entfernen, Fortschritt bleibt)
- Test: `__tests__/ui/spiel-musik.test.tsx` (bestehende Tests müssen grün bleiben)

**Schnittstellen:**
- Nutzt: `wellenPunkte` aus Aufgabe 2.
- Liefert: `Musikspur({ farbe, laeuft, dauerMs })` unverändert, `role="img"` mit „Musikspur läuft“/„Musikspur
  steht“. Breite `w-[21rem] max-w-full`, SVG `h-[5.6rem]`, `viewBox="0 0 240 100"`, `preserveAspectRatio="none"`,
  `polyline` ohne Füllung, Strich in `farbe`, 7px mit `vector-effect: non-scaling-stroke`, runde Enden und Ecken.
  Darunter der Fortschrittsbalken wie bisher.
- Verhalten: Ein Effekt startet eine `requestAnimationFrame`-Schleife und hält sie beim Aushängen an. Die Stärke
  nähert sich in etwa 250 ms dem Ziel (`laeuft` → 1, sonst 0,18). Mit `prefers-reduced-motion` (über
  `window.matchMedia?.`, jsdom kennt es nicht) ein einziges Bild mit `sekunden = 0`. Die Schleife setzt nur das
  Attribut `points` über eine Ref, kein React-State je Bild.

- [x] **Schritt 1: `npx vitest run __tests__/ui/spiel-musik.test.tsx` laufen lassen, er muss vor der Änderung bestehen**
- [x] **Schritt 2: `Musikspur` umbauen, CSS der Balken entfernen**
- [x] **Schritt 3: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui`
Erwartet: PASS

- [x] **Schritt 4: Prüfen und committen**

```bash
npm run check
git add app/ui/musikspur.tsx app/globals.css
git commit -m "Show the music track as a moving zigzag line"
```

### Aufgabe 4: Abschnitt zur Runde mit festem Gerüst

**Dateien:**
- Ändern: `app/ui/tisch.tsx`, `app/ui/spiel-ansicht.tsx` (Spielfeld im Raum ohne `max-w-5xl`)
- Test: `__tests__/ui/spiel-ansicht.test.tsx`, `__tests__/ui/spiel-aufloesung.test.tsx`, `e2e/design.spec.ts`

**Schnittstellen:**
- Liefert: Abschnitt `<section aria-label="Runde">` mit vier Plätzen in fester Reihenfolge, in jedem Zustand
  vorhanden:
  1. **Kopf:** links „Runde <n>“ (vor Runde 1 „Noch keine Runde“), rechts die Kategorie (`role="status"`, nur wenn
     das Rad steht; sonst ein leeres Schild gleicher Höhe ohne Rolle).
  2. **Großer Platz** (`h-[8.4rem]`, Hintergrund `bg-grund`): vor Runde 1 „Bereit?“, beim Drehen „Das Rad dreht …“
     (beide leise, `text-licht/60`), bei laufendem Song die `Musikspur`, bei Auflösung „Lösung · <Kategorie>“ und
     darunter die Lösung als `h2` in `text-akzent` (`text-[3.6rem]`, ab 17 Zeichen `text-[2.7rem]`, `line-clamp-2`),
     bei Bingo „Bingo! …“ als `h2`.
  3. **Mitte:** links der Cover-Platz (quadratisch, `clamp(11rem, 36vh, 22rem)`), vor der Auflösung eine Platte
     (`repeating-radial-gradient`, Mitte in `kategorie.farbe`), die sich bei laufendem Song dreht; ab der Auflösung
     das Cover (`alt="Cover von <Titel>"`). Rechts `dl` mit Titel, Interpret, Jahr, Jahrzehnt (Etikett klein,
     Großbuchstaben, Wert `text-[1.55rem]`). Vor der Auflösung Wert „· · ·“ blass. Die gesuchte Zeile (Kategorie,
     bei „Jahr ±3“ die Zeile Jahr) hat `data-gesucht` und Etikett und Wert in `kategorie.farbe`, vor der Auflösung
     mit „ · gesucht“ hinter dem Etikett.
  4. **Fuß:** eine Zeile Hinweis (Auflösung: „Richtig? Hake ein Feld … ab.“ links, „Jahr korrigieren“ rechts; Bingo:
     leer; sonst leer mit fester Höhe), darunter die Knöpfe rechtsbündig mit fester Mindesthöhe.
- Maße: Der Tisch-Container setzt `--rad: min(48rem, calc(100dvh - 13rem), calc(100cqw - 38.5rem))`. Ab `@5xl`
  nebeneinander: Rad `w-[var(--rad)]`, Abschnitt `w-[36rem] h-[max(var(--rad),34rem)]` mit
  `grid-rows-[auto_auto_1fr_auto]`. Darunter untereinander wie bisher, Abschnitt `min-h-[34rem]`.
- `Musikspur`, `Knopf`, `onJahrKorrigieren` und alle Rückrufe bleiben, wie sie sind.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

In `__tests__/ui/spiel-ansicht.test.tsx`:

```tsx
test("vor der Auflösung stehen alle vier Angaben verdeckt, die gesuchte ist markiert", () => {
  // wie "Rad drehen zeigt Runde und Kategorie …": Rad drehen, Rad steht, Kategorie Titel
  expect(tisch().getAllByText("· · ·")).toHaveLength(4);
  expect(tisch().getByText("Titel · gesucht")).toBeDefined();
});
```

In `__tests__/ui/spiel-aufloesung.test.tsx`:

```tsx
test("bei Bingo bleibt das Cover sichtbar", () => {
  // bis zum Bingo spielen wie in spiel-musik.test.tsx (bisZumBingo)
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  expect(screen.getByRole("img", { name: /^Cover von / })).toBeDefined();
});
```

In `e2e/design.spec.ts`:

```ts
test("Abschnitt zur Runde bleibt in jedem Zustand gleich groß", async ({ browser }) => {
  // Tisch 1280×800 mit Raum und Anna, Demo starten
  const runde = seite.getByRole("region", { name: "Runde" });
  const groessen = [await runde.boundingBox()];
  // Rad drehen → nach "Lösung anzeigen" warten → Größe; Lösung anzeigen → Größe; Nächste Runde → Größe
  expect(new Set(groessen.map((g) => `${g!.width}×${g!.height}`)).size).toBe(1);
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/spiel-ansicht.test.tsx __tests__/ui/spiel-aufloesung.test.tsx`
Erwartet: FAIL, kein „· · ·“ und kein Cover bei Bingo

- [x] **Schritt 3: `Tisch` auf das Gerüst umbauen, `max-w-5xl` im Raum entfernen**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm test`
Erwartet: PASS

> **Abweichung (2026-10-23):** `e2e/design.spec.ts` und die Screenshots (Schritt 5) erst am Ende von Aufgabe 5:
> Solange die Raum-Spalte Breite nimmt, ist der Tisch zu schmal für Rad und Abschnitt nebeneinander. `--rad` zieht
> 13rem statt 10rem von der Höhe ab, weil mit Spotify die Auswahl „Ausschnitt“ über dem Tisch steht. Der neue
> e2e-Test „Abschnitt … gleich groß“ kommt deshalb auch erst in Aufgabe 5.

- [x] **Schritt 5: Screenshots der Zustände prüfen** (vor Runde 1, Rad dreht, Song läuft, Ausschnitt vorbei,
  Lösung, Bingo; 1280×800 und 1600×900) und mit dem Prototyp vergleichen.
- [x] **Schritt 6: Prüfen und committen**

```bash
npm run check
git add app/ui/tisch.tsx app/ui/spiel-ansicht.tsx __tests__/ui/spiel-ansicht.test.tsx __tests__/ui/spiel-aufloesung.test.tsx e2e/design.spec.ts
git commit -m "Give the round panel a fixed layout with larger answer and cover"
```

### Aufgabe 5: Raum als Schublade mit einem Knopf

**Dateien:**
- Ändern: `lib/raum/speicher.ts`, `app/ui/raum-kopf.tsx`, `app/ui/start.tsx` (Raster `lg:grid-cols-[auto_1fr]` und
  `max-w-7xl` weg, stattdessen `relative w-full`)
- Test: `__tests__/lib/raum/speicher.test.ts`, `__tests__/ui/raum-kopf.test.tsx` (Test „QR-Code lässt sich
  ausblenden …“ ersetzen)

**Schnittstellen:**
- Liefert: `raumSichtbar(): boolean` und `raumSichtbarSpeichern(an: boolean): void` in `lib/raum/speicher.ts`,
  Schlüssel `musik-app:raum-sichtbar`, gespeichert wird nur „aus“ (Muster wie `notizenAn`). Standard: sichtbar.
- `RaumKopf` zeigt einen runden Knopf oben links (`absolute left-0 top-0`, 2,5rem hoch, Symbol Seitenleiste als
  SVG, `aria-expanded`, `aria-controls`). Name „Raum ausblenden“, ausgeblendet „Raum <Code> zeigen“ mit sichtbarem
  Code im Knopf. Die Schublade (Code, QR-Code, Spieler, „Raum schließen“) liegt ab `lg` `absolute left-0 top-0
  z-10 w-64` über der Bühne (Hintergrund `bg-grund/95`, Ring `ring-akzent/25`, Schatten), darunter statisch oben.
  Ausgeblendet fehlt die Schublade ganz. Die Knöpfe „QR-Code ausblenden“/„QR-Code zeigen“ entfallen.
- Die Presence- und Nachrichten-Effekte bleiben unverändert und laufen auch bei ausgeblendetem Raum.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
// __tests__/lib/raum/speicher.test.ts
test("Raum ist sichtbar, bis er ausgeblendet wird, und bleibt es über ein Neuladen", () => {
  expect(raumSichtbar()).toBe(true);
  raumSichtbarSpeichern(false);
  expect(raumSichtbar()).toBe(false);
  raumSichtbarSpeichern(true);
  expect(localStorage.getItem("musik-app:raum-sichtbar")).toBeNull();
});
```

```tsx
// __tests__/ui/raum-kopf.test.tsx
test("ein Knopf blendet QR-Code und Spieler aus, der Code bleibt im Knopf", () => {
  kopf();
  fireEvent.click(screen.getByRole("button", { name: "Raum ausblenden" }));
  expect(screen.queryByTitle("QR-Code für Raum ABCD")).toBeNull();
  expect(screen.queryByRole("button", { name: "Raum schließen" })).toBeNull();
  expect(screen.getByRole("button", { name: "Raum ABCD zeigen" }).textContent).toContain("ABCD");
});

test("ausgeblendet bleibt der Raum nach dem Neuladen ausgeblendet", () => {
  raumSichtbarSpeichern(false);
  kopf();
  expect(screen.queryByTitle("QR-Code für Raum ABCD")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Raum ABCD zeigen" }));
  expect(screen.getByTitle("QR-Code für Raum ABCD")).toBeDefined();
  expect(raumSichtbar()).toBe(true);
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/speicher.test.ts __tests__/ui/raum-kopf.test.tsx`
Erwartet: FAIL, `raumSichtbar` fehlt

- [x] **Schritt 3: Speicherfunktionen, `RaumKopf` und Rahmen in `start.tsx` umbauen**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm test` und `npm run e2e`
Erwartet: PASS, Bots finden „Raum schließen“ weiterhin (Raum ist beim Start sichtbar)

- [x] **Schritt 5: Screenshots** mit offenem und ausgeblendetem Raum (1280×800, 1600×900, 390×844)
- [x] **Schritt 6: Prüfen, committen, PR**

```bash
npm run check
git add lib/raum/speicher.ts app/ui/raum-kopf.tsx app/ui/start.tsx __tests__/lib/raum/speicher.test.ts __tests__/ui/raum-kopf.test.tsx
git commit -m "Turn the room column into a drawer with one toggle"
```

> **Nachtrag (2026-10-23):** Die Screenshots auf 1280×800 zeigten ein zu großes Cover (36vh), das über den Fuß
> ragte. Das Cover ist jetzt höchstens so groß, wie der Abschnitt Höhe übrig hat:
> `min(22rem, calc(max(var(--rad), 34rem) - 24.5rem))`.

Danach PR, `gh pr checks <nr>`, `/code-review`, Funde mit dem Entwickler durchgehen, Merge.

## Teil 2: Handy-Karte (`feat/handy-karte-hoch`)

### Aufgabe 6: Höhere Felder und Kreuz

**Dateien:**
- Ändern: `app/ui/karte-ansicht.tsx`, `app/ui/handy-spiel.tsx`
- Test: `__tests__/ui/karte-ansicht.test.tsx`, `e2e/design.spec.ts`

**Schnittstellen:**
- Liefert: `KarteAnsicht` mit neuem Prop `hoeher?: boolean`. Felder `aspect-[3/4]`, mit `hoeher` `aspect-[2/3]`,
  Schrift `text-[13px]` (ab `sm` wie bisher `text-sm`). Das Wort bleibt das erste Kind des Felds (Browser-Test).
- Abgehakt zeigt ein Feld statt des Kreises ein SVG-Kreuz mit `data-kreuz`, `aria-hidden`, Klasse `stempel`
  (Animation bleibt): zwei Linien von Ecke zu Ecke (12/12 → 88/88 und 88/12 → 12/88 im `viewBox 0 0 100 100`,
  `preserveAspectRatio="none"`), darunter `stroke-grund/55` 15px, darüber `stroke-akzent` 9px, runde Enden,
  `vector-effect: non-scaling-stroke`.
- `HandySpiel` übergibt `hoeher={!notizen}`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
test("ein abgehaktes Feld zeigt ein Kreuz, ein freies keins", () => {
  render(<KarteAnsicht karte={feldSetzen(karte, 2, true)} onFeldKlick={() => {}} />);
  expect(felder()[2].querySelector("[data-kreuz]")).not.toBeNull();
  expect(felder()[3].querySelector("[data-kreuz]")).toBeNull();
});
```

```ts
// e2e/design.spec.ts
test("Handy mit Notizen passt ohne Scrollen", async ({ browser }) => {
  // Tisch eröffnen, Anna beitreten, Anna 390×844, Demo starten, 25 Felder abwarten
  expect(await hoehe(anna.seite)).toBeLessThanOrEqual(844);
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/karte-ansicht.test.tsx`
Erwartet: FAIL, kein `[data-kreuz]`

- [x] **Schritt 3: `KarteAnsicht` und `HandySpiel` umbauen**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm test` und `npx playwright test e2e/design.spec.ts`
Erwartet: PASS, auch „Felder am Handy zeigen ihr Wort ganz“

- [x] **Schritt 5: Screenshots** am Handy (390×844, 360×780) mit und ohne Notizen, mit Bingo-Reihe
- [x] **Schritt 6: Prüfen, committen, PR**

```bash
npm run check
git add app/ui/karte-ansicht.tsx app/ui/handy-spiel.tsx __tests__/ui/karte-ansicht.test.tsx e2e/design.spec.ts
git commit -m "Make card fields taller and mark them with a cross"
```

**Abweichung (PR zu Aufgabe 6):** Im Bingo-Zustand war die Seite bei 390×844 und 360×780 je 25 px zu hoch. Deshalb hat
die Notizfläche auf Bildschirmen bis 800 px Höhe 2 statt 3 Zeilen, und die Raumseite hat am Handy `py-4` statt `py-8`.
Der Browser-Test prüft beide Größen zu Spielbeginn, den Bingo-Zustand nur die Messung von Hand (zu langsam für die
Suite).

## Teil 3: Ohne Songliste (`feat/ohne-songliste`)

### Aufgabe 7: Nur die Zahl der unsicheren Jahre

**Dateien:**
- Ändern: `lib/vorbereiten.ts`, `app/ui/vorbereiten-ansicht.tsx`
- Löschen: `app/ui/songliste.tsx`, `__tests__/ui/songliste.test.tsx`
- Neu: `docs/adr/0007-keine-songliste-vor-dem-spiel.md`
- Ändern: `CLAUDE.md` (Prinzip 4: „lässt sich vom DJ in der Auflösung korrigieren“), `docs/Projektvision.md` (Phase
  2, „Korrigieren“: Hinweis auf ADR 0007)
- Test: `__tests__/lib/vorbereiten.test.ts`, `__tests__/ui/vorbereiten-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `markierung(jahre)` aus `lib/erscheinungsjahr.ts`, `jahreVon`, `gespeicherteJahre`, `spielSongs` aus
  `lib/vorbereiten.ts`.
- Liefert: `unsichereJahre(songs: readonly PlaylistSong[], gespeichert: Record<string, GespeicherteJahre>): number`
  in `lib/vorbereiten.ts`: Zahl der Songs mit `markierung(jahreVon(song, gespeichert)) !== null`.
- `VorbereitenAnsicht` zeigt nach dem Vorbereiten an Stelle der `Songliste`: „Musik …“-Zeile wie bisher,
  `h2` „<n> Songs bereit, <m> übersprungen“ (Einzahl „1 Song“), `Knopf` „Spiel starten“ (startet mit
  `spielSongs(songs, gespeicherteJahre())` und aktiviert den Player im Klick wie bisher) oder „Keine spielbaren
  Songs“, darunter nur bei `unsichereJahre > 0` den Hinweis aus den Festen Vorgaben. Keine Titel, Interpreten oder
  Jahre.
- ADR 0007: Kontext (DJ spielt mit, Liste verrät Lösungen), Entscheidung (keine Liste, Korrektur nur in der
  Auflösung, Zahl der unsicheren Jahre), Alternativen (Liste wie bisher, Liste nur der fraglichen Songs, Liste
  hinter „Zeigen“), Konsequenzen (falsches Jahr fällt erst in der Runde auf, Korrektur gilt ab dann für die
  Playlist).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
// __tests__/lib/vorbereiten.test.ts
test("zählt Songs mit unsicherem Jahr, eine Korrektur macht es sicher", async () => {
  // t1: MusicBrainz 1975 (sicher), t2: ohne ISRC (nicht gefunden), wie in der alten songliste.test.tsx
  expect(unsichereJahre([song("t1"), song("t2", null)], gespeicherteJahre())).toBe(1);
  korrekturSpeichern("t2", 1999);
  expect(unsichereJahre([song("t1"), song("t2", null)], gespeicherteJahre())).toBe(0);
});
```

```tsx
// __tests__/ui/vorbereiten-ansicht.test.tsx
test("nach dem Vorbereiten stehen keine Titel und Jahre, nur die Zahl der unsicheren", async () => {
  // Playlist mit einem Song ohne MusicBrainz-Treffer
  await screen.findByText("1 Song bereit, 0 übersprungen");
  expect(screen.getByText("1 Song mit unsicherem Jahr. Prüfe es bei der Auflösung.")).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
  // Titel des Testsongs aus der Datei einsetzen
  expect(screen.queryByText(testsong.titel)).toBeNull();
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/vorbereiten.test.ts __tests__/ui/vorbereiten-ansicht.test.tsx`
Erwartet: FAIL, `unsichereJahre` fehlt

- [x] **Schritt 3: `unsichereJahre` schreiben, `VorbereitenAnsicht` umbauen, `Songliste` und ihren Test löschen**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm test` und `npm run e2e`
Erwartet: PASS (die Bots klicken nur „Spiel starten“)

- [x] **Schritt 5: ADR 0007 schreiben, `CLAUDE.md` und `docs/Projektvision.md` anpassen**
- [x] **Schritt 6: Prüfen, committen, PR**

```bash
npm run check
git add -A lib/vorbereiten.ts app/ui/vorbereiten-ansicht.tsx app/ui/songliste.tsx __tests__ docs/adr/0007-keine-songliste-vor-dem-spiel.md CLAUDE.md docs/Projektvision.md
git commit -m "Drop the song list before the game"
```

**Ergänzung (PR zu Aufgabe 7):** Die Fälle „Spiel starten“ und „Keine spielbaren Songs“ aus dem gelöschten
`songliste.test.tsx` stehen jetzt in `vorbereiten-ansicht.test.tsx`. In `docs/Projektvision.md` ist auch der „Ablauf am
Tisch“ angepasst, nicht nur „Korrigieren“.

## Nach Teil 3

- `plan-pruefer` gegen diesen Plan laufen lassen, danach Plan auf `status: abgeschlossen`.
- Journal und Übergabe: Prüfung an echten Geräten (Kreuz auf iOS/Android, Welle auf dem Laptop, Schublade über dem
  Rad auf 13-Zoll-Laptops).
