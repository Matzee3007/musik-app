---
titel: "Plan: Oberfläche Phase 1"
status: aktiv
erstellt: 2026-10-19
tags: [plan, oberflaeche, react, phase-1]
---

# Plan: Oberfläche Phase 1

**Ziel:** Ein spielbares Hitster Bingo auf einem Gerät: links der Tisch (Rad drehen, Runde, Auflösung), rechts eine
Karte zum Abhaken, mit Bingo-Anzeige und neuem Spiel.

**Vorgehen:** Eine Client-Komponente `SpielAnsicht` hält den `Spiel`-Stand aus `lib/spiel.ts` in `useState` und ruft
bei jedem Klick einen Spielzug auf. `Tisch` und `KarteAnsicht` zeigen nur an und melden Klicks. Getestet wird an der
Nahtstelle `SpielAnsicht`, so wie ein Spieler sie bedient (Testing Library, Klicks, sichtbarer Text).

**Technik:** Next.js App Router, React (`useState`), Tailwind CSS, Vitest mit Testing Library (`fireEvent`). Keine neuen
Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], Roadmap Phase 1 und „So läuft eine Runde“;
Spielzüge aus [[2026-10-19-spiellogik|Plan Spiellogik]]; Entscheidungen der Session dort (keine Musik, eine Karte).

## Annahmen (bitte prüfen)

- **Keine Rad-Animation, keine Musikspur** in Phase 1: Nach „Rad drehen“ steht die Kategorie sofort da. Animation und
  Musikspur kommen mit der Musik in Phase 2.
- **Rückfrage beim Zurücknehmen** mit dem Browser-Dialog `window.confirm("Abhaken zurücknehmen?")`, kein eigenes Fenster.
- Felder zeigen Kategorie-Farbe als Hintergrund, Kategorie-Name in dunkler Schrift (lesbar auf allen fünf Farben),
  abgehakt zusätzlich ein großes „✓“.
- Felder, die man gerade nicht abhaken darf, reagieren einfach nicht (die Regeln stehen in `feldAbhaken`). Der Tisch
  sagt nach der Auflösung: „Richtig? Hake ein Feld <Kategorie> ab.“
- Laptop: Tisch und Karte nebeneinander (`md:grid-cols-2`), schmaler Bildschirm: untereinander.

## Feste Vorgaben

- Nur `app/ui/spiel-ansicht.tsx` trägt `"use client"`; `Tisch` und `KarteAnsicht` werden von dort importiert und sind
  damit automatisch Client-Komponenten. `app/page.tsx` bleibt Server-Komponente.
- Kein Zufall beim ersten Rendern (Hydration): Das Spiel startet erst nach Klick auf „Spiel starten“.
- Spielregeln nur über die Funktionen aus `lib/spiel.ts` und `lib/bingo.ts`, keine eigenen Regeln in Komponenten.
- `SpielAnsicht` nimmt `zufall?: Zufall` als Prop (Standard `Math.random`), damit Tests feste Werte einsetzen.
- Texte auf Deutsch nach dem Glossar (Runde, Auflösung, Karte, Feld, Stapel).
- Tests in `__tests__/ui/spiel-ansicht.test.tsx`; vor jedem Commit `npm run check` mit Exit-Code 0.
- Mit Shell geschriebene Dateien vor dem Check mit `npx prettier --write <datei>` formatieren (der Hook greift dort nicht).

## Prüf-Schwerpunkte

1. Vor der Auflösung darf der Song nirgends zu sehen sein, sonst ist die Runde verraten (Aufgabe 2).
2. Versehentlicher Klick auf ein abgehaktes Feld: Ohne Bestätigung bleibt es abgehakt (Aufgabe 3).
3. Stapel leer: Statt „Nächste Runde“ steht „Von vorn“, die Karte bleibt erhalten (Aufgabe 4).
4. Nach Bingo lässt sich keine Runde mehr starten, nur ein neues Spiel (Aufgabe 5).
5. Neues Spiel: frische Karte ohne Häkchen und voller Stapel (Aufgabe 5).

## Dateien

| Datei | Zuständig für |
|---|---|
| `app/page.tsx` | Überschrift, rendert `<SpielAnsicht songs={SONGLISTE} />` |
| `app/ui/spiel-ansicht.tsx` | `"use client"`, Spielstand, Spielzüge bei Klicks, Bingo-Anzeige, Aufteilung Tisch/Karte |
| `app/ui/tisch.tsx` | Anzeige der Runde: Rad drehen, Kategorie, Auflösung, Von vorn |
| `app/ui/karte-ansicht.tsx` | 5×5-Raster der Felder |
| `__tests__/ui/spiel-ansicht.test.tsx` | Tests der Oberfläche |
| `__tests__/page.test.tsx` | bestehender Test, um „Spiel starten“ ergänzt |

Gemeinsame Testdaten in `spiel-ansicht.test.tsx`: `FUENF_SONGS = SONGLISTE.slice(0, 5)`, `bohemian` = der Song mit Id
`queen-bohemian-rhapsody`, `starten(songs, zufall)` rendert `SpielAnsicht` und klickt „Spiel starten“. Vor jedem Test
`cleanup()` (Testing Library räumt in Vitest nicht automatisch auf).

## Aufgaben

### Aufgabe 1: Spiel starten

**Dateien:** Neu `app/ui/spiel-ansicht.tsx`, `app/ui/tisch.tsx`, `app/ui/karte-ansicht.tsx`,
`__tests__/ui/spiel-ansicht.test.tsx`; Ändern `app/page.tsx`, `__tests__/page.test.tsx`

**Schnittstellen:**
- Nutzt: `spielStarten`, `Spiel`, `Runde` aus `@/lib/spiel`; `Karte`; `KATEGORIEN`; `SONGLISTE`; `Zufall`
- Liefert:
  - `SpielAnsicht({ songs, zufall }: { songs: readonly Song[]; zufall?: Zufall })` (Default-Export)
  - `Tisch(props: { runde: Runde | null; stapelLeer: boolean; bingo: boolean; onRadDrehen: () => void;
    onLoesungAnzeigen: () => void; onVonVorn: () => void; onNeuesSpiel: () => void })` (`onNeuesSpiel` kam bei der
    Umsetzung von Aufgabe 5 dazu)
  - `KarteAnsicht(props: { karte: Karte; onFeldKlick: (index: number) => void })`. Jedes Feld ist ein `<button>` mit
    `aria-label="Feld <Kategorie-Name>"` und `aria-pressed={abgehakt}`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
test("Startseite zeigt Überschrift und „Spiel starten“", () => { /* page.test.tsx */
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1, name: "Musik-App" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Spiel starten" })).toBeDefined();
});
test("nach „Spiel starten“ gibt es eine Karte mit 25 freien Feldern und „Rad drehen“", () => {
  starten(FUENF_SONGS);
  const felder = screen.getAllByRole("button", { name: /^Feld / });
  expect(felder).toHaveLength(25);
  expect(felder.every((f) => f.getAttribute("aria-pressed") === "false")).toBe(true);
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen** (`npx vitest run __tests__/page.test.tsx __tests__/ui`)
- [x] **Schritt 3: Komponenten schreiben.** `SpielAnsicht`: `useState<Spiel | null>(null)`, ohne Spiel nur der Knopf
  „Spiel starten“, sonst `<div className="grid gap-8 md:grid-cols-2">` mit `Tisch` und `KarteAnsicht`. `Tisch` zeigt in
  dieser Aufgabe nur „Rad drehen“. `page.tsx`: Satz „Kommt bald.“ ersetzen durch `<SpielAnsicht songs={SONGLISTE} />`.
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add start screen with card and table"`

### Aufgabe 2: Runde und Auflösung

**Dateien:** Ändern `app/ui/spiel-ansicht.tsx`, `app/ui/tisch.tsx`, Test `__tests__/ui/spiel-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `rundeStarten`, `loesungAnzeigen`; `Kategorie.loesung`

- [x] **Schritt 1: Fehlschlagende Tests schreiben** (Zufall `() => 0`: Rad wählt Titel)

```tsx
test("Rad drehen zeigt Runde und Kategorie, verrät den Song aber nicht", () => {
  starten([bohemian], () => 0);
  klick("Rad drehen");
  expect(tisch().getByText("Runde 1")).toBeDefined();
  expect(tisch().getByText("Titel")).toBeDefined();
  expect(tisch().getByText("Song läuft")).toBeDefined();
  expect(screen.queryByText(/Bohemian Rhapsody|Queen|1975/)).toBeNull();
});
test("Lösung anzeigen zeigt die Lösung groß und alle Angaben zum Song", () => {
  starten([bohemian], () => 0);
  klick("Rad drehen");
  klick("Lösung anzeigen");
  expect(screen.getByRole("heading", { level: 2, name: "Bohemian Rhapsody" })).toBeDefined();
  for (const text of ["Queen", "1975", "1970er"]) expect(screen.getByText(text)).toBeDefined();
  expect(screen.getByText("Richtig? Hake ein Feld Titel ab.")).toBeDefined();
});
test("nach der Auflösung startet „Nächste Runde“ Runde 2", () => {
  starten(FUENF_SONGS, () => 0);
  klick("Rad drehen");
  klick("Lösung anzeigen");
  klick("Nächste Runde");
  expect(screen.getByText("Runde 2")).toBeDefined();
});
```

`klick(name)` = `fireEvent.click(screen.getByRole("button", { name }))`.
`tisch()` = `within(screen.getByRole("region", { name: "Tisch" }))`: Die Karten-Felder zeigen den Kategorie-Namen
ebenfalls als Text, deshalb sucht der Test „Titel“ nur im Tisch.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [x] **Schritt 3: Tisch ausbauen.** Der Tisch ist `<section aria-label="Tisch">`. Ohne Runde: „Rad drehen“. Laufende Runde: „Runde N“, Kategorie-Name in einem
  Kasten in ihrer Farbe, „Song läuft“, Knopf „Lösung anzeigen“. Aufgelöst: Kategorie, `<h2>` mit
  `kategorie.loesung(song)`, darunter Titel, Interpret, Jahr, Jahrzehnt (Jahrzehnt über die Lösung der Kategorie
  `jahrzehnt` aus `KATEGORIEN`, keine zweite Rechnung), Hinweis „Richtig? Hake ein Feld <Kategorie> ab.“, Knopf
  „Nächste Runde“. Die Angaben zum Song als Liste `<dl>` mit Bezeichnung (`<dt>Interpret</dt>`) und Wert
  (`<dd>Queen</dd>`), auch die schon groß gezeigte, weil die Spieler daran prüfen.
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add round and reveal to the table"`

### Aufgabe 3: Abhaken und Zurücknehmen

**Dateien:** Ändern `app/ui/spiel-ansicht.tsx`, `app/ui/karte-ansicht.tsx`, Test `__tests__/ui/spiel-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `feldAbhaken`, `abhakenZuruecknehmen`

- [x] **Schritt 1: Fehlschlagende Tests schreiben** (Zufall `() => 0`, Runde aufgelöst, Kategorie Titel)

```tsx
test("ein Titel-Feld lässt sich nach der Auflösung abhaken", () => {
  aufgeloest();
  const feld = screen.getAllByRole("button", { name: "Feld Titel" })[0];
  fireEvent.click(feld);
  expect(feld.getAttribute("aria-pressed")).toBe("true");
});
test("Zurücknehmen nur nach Bestätigung", () => {
  aufgeloest();
  const feld = screen.getAllByRole("button", { name: "Feld Titel" })[0];
  fireEvent.click(feld);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(feld);
  expect(feld.getAttribute("aria-pressed")).toBe("true");
  confirm.mockReturnValue(true);
  fireEvent.click(feld);
  expect(feld.getAttribute("aria-pressed")).toBe("false");
  expect(confirm).toHaveBeenCalledWith("Abhaken zurücknehmen?");
});
```

`aufgeloest()` = `starten(FUENF_SONGS, () => 0)`, „Rad drehen“, „Lösung anzeigen“. Nach jedem Test
`vi.restoreAllMocks()`.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [x] **Schritt 3: Klick auf ein Feld in `SpielAnsicht`:** abgehakt → `window.confirm("Abhaken zurücknehmen?")`, bei Ja
  `abhakenZuruecknehmen`; frei → `feldAbhaken`. `KarteAnsicht`: 5×5-Raster (`grid grid-cols-5`), Feld mit
  Kategorie-Farbe als Hintergrund, Name in dunkler Schrift, abgehakt zusätzlich „✓“.
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add marking and unmarking fields"`

### Aufgabe 4: Stapel leer

**Dateien:** Ändern `app/ui/spiel-ansicht.tsx`, `app/ui/tisch.tsx`, Test `__tests__/ui/spiel-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `stapelNeuMischen`

- [x] **Schritt 1: Fehlschlagender Test**

```tsx
test("ist der Stapel leer, mischt „Von vorn“ neu und die Karte bleibt", () => {
  starten([bohemian], () => 0);
  klick("Rad drehen");
  klick("Lösung anzeigen");
  fireEvent.click(screen.getAllByRole("button", { name: "Feld Titel" })[0]);
  expect(screen.getByText("Alle Songs gespielt")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Nächste Runde" })).toBeNull();
  klick("Von vorn");
  klick("Nächste Runde");
  expect(screen.getByText("Runde 2")).toBeDefined();
  expect(screen.getAllByRole("button", { name: "Feld Titel", pressed: true })).toHaveLength(1);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
- [x] **Schritt 3: Tisch:** aufgelöst und `stapelLeer` → „Alle Songs gespielt“ und Knopf „Von vorn“ statt „Nächste
  Runde“. `SpielAnsicht` ruft dafür `stapelNeuMischen(spiel, songs, zufall)`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add reshuffle when the deck is empty"`

### Aufgabe 5: Bingo und neues Spiel

**Dateien:** Ändern `app/ui/spiel-ansicht.tsx`, `app/ui/tisch.tsx`, Test `__tests__/ui/spiel-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `hatBingo`, `spielStarten`

- [x] **Schritt 1: Fehlschlagende Tests schreiben.** Mit Zufall `() => 0.999` tauscht das Mischen nichts: Die Karte
  liegt in der Reihenfolge der Kategorien, die letzte Zeile (Felder 20 bis 24) ist ganz „Jahr ±3“, und das Rad wählt
  immer „Jahr ±3“. Fünf Runden mit je einem Häkchen in dieser Zeile ergeben Bingo.

```tsx
test("fünf in einer Reihe zeigen Bingo, danach nur noch „Neues Spiel“", () => {
  starten(FUENF_SONGS, () => 0.999);
  for (let runde = 0; runde < 5; runde++) {
    klick(runde === 0 ? "Rad drehen" : "Nächste Runde");
    klick("Lösung anzeigen");
    fireEvent.click(screen.getAllByRole("button", { name: /^Feld / })[20 + runde]);
  }
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Nächste Runde" })).toBeNull();
  klick("Neues Spiel");
  expect(screen.queryAllByRole("button", { name: /^Feld /, pressed: true })).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
- [x] **Schritt 3: Bingo anzeigen.** `SpielAnsicht` berechnet `hatBingo(spiel.karte)` und gibt es als `bingo` an den
  Tisch. Bei Bingo zeigt der Tisch `<h2>Bingo!</h2>` und nur den Knopf „Neues Spiel“, der `spielStarten(songs, zufall)`
  aufruft. Die Auflösung der letzten Runde bleibt darunter sichtbar.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add bingo screen and new game"`

### Aufgabe 6: Im Browser spielen

**Dateien:** keine

- [ ] **Schritt 1:** `npm run build` muss ohne Fehler durchlaufen (Produktionsfassung, findet Fehler, die Tests nicht
  sehen, z. B. falsche Server/Client-Grenze).
- [ ] **Schritt 2:** `npm run dev`, Seite unter http://localhost:3000 mit `curl -s localhost:3000 | grep "Spiel starten"`
  prüfen, dann spielt der Entwickler selbst ein paar Runden im Browser (Laptop- und schmale Fensterbreite).
- [ ] **Schritt 3:** Was ihm auffällt, als eigene kleine Commits auf diesem Branch, jeweils mit `npm run check`.

## Abschluss

PR „Add playable game screen for phase 1“, `gh pr checks <nr>` grün, mergen. Damit ist **Phase 1 fertig**: In
derselben Session die Phase abschließen (Regel „Phasenwechsel“ der globalen `CLAUDE.md`): Journal mit `journal`,
Roadmap abhaken, Übergabe mit `naechste-session`, alle PRs mergen.
