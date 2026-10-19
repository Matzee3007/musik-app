---
titel: "Plan: Spiellogik"
status: abgeschlossen
erstellt: 2026-10-19
tags: [plan, spiellogik, tdd, phase-1]
---

# Plan: Spiellogik

**Ziel:** Rad, Karte, Songauswahl, Abhaken und Bingo-Erkennung als reine, getestete TypeScript-Funktionen in `lib/`,
auf denen die Oberfläche (Plan B) aufbaut.

**Vorgehen:** Jeder Baustein bekommt eine eigene Datei und einen eigenen Test-Zyklus nach dem Skill `tdd`. Zufall
wird als Funktion übergeben (Standard `Math.random`), damit Tests feste Werte einsetzen können. Am Ende verbindet
`lib/spiel.ts` alles zu einem Spielstand, den Funktionen unverändert lassen oder als neues Objekt zurückgeben.

**Technik:** TypeScript, Vitest. Keine neuen Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], Roadmap Phase 1 und „Spielregeln im
Detail“; Begriffe im [[projects/musik-app/docs/Glossar|Glossar]]; [[0002-spieler-pruefen-selbst|ADR 0002]].

## Entscheidungen der Session (2026-10-19)

- Phase 1 in zwei Pläne geteilt: **A Spiellogik** (dieser Plan, eigener PR), **B Oberfläche** (Tisch und Karte
  nebeneinander, danach).
- **Keine Musik** in Phase 1, der Tisch zeigt nur, dass ein Song läuft. Musik kommt in Phase 2.
- **Eine Karte** auf dem Gerät. Stechen und „Bingo-Erkennung abschalten“ brauchen mehrere Spieler und kommen in
  Phase 3.
- **Songliste schlägt Claude vor** (Aufgabe 6), der Entwickler prüft sie im PR.

## Annahmen (bitte prüfen)

- Farben der Kategorien: Titel `#3b82f6` (blau), Interpret `#ec4899` (pink), Jahrzehnt `#f59e0b` (orange), Jahr
  `#10b981` (grün), Jahr ±3 `#8b5cf6` (lila). Die Felder tragen zusätzlich den Namen, Farbe allein reicht nicht.
- Lösungstexte: Jahrzehnt `"1970er"`, Jahr `"1975"`, Jahr ±3 `"1972 bis 1978"`.
- Pro Runde hakt man höchstens ein Feld ab, und erst nach der Auflösung. Zurücknehmen geht jederzeit; nimmt man das
  Feld der laufenden Runde zurück, darf man in dieser Runde neu abhaken.
- Nach einem Bingo startet keine neue Runde mehr (Neues Spiel kommt mit der Oberfläche).

## Feste Vorgaben

- Spiellogik importiert nichts aus React, Next.js, Spotify oder Supabase (Architekturprinzip 2).
- Kategorien sind Daten in `KATEGORIEN`, keine Fallunterscheidung nach Kategorie außerhalb von `lib/kategorien.ts`
  (Architekturprinzip 3).
- Funktionen ändern ihre Eingaben nicht, sie geben neue Objekte zurück.
- Namen auf Deutsch nach dem Glossar (`Karte`, `Feld`, `Runde`, `Spiel`, `Kategorie`, nicht `Card`, `Round`).
- Import über den Alias `@/lib/<datei>`. Tests in `__tests__/lib/<datei>.test.ts`.
- Vor jedem Commit `npm run check` mit Exit-Code 0, Commit-Nachricht auf Englisch im Imperativ.

## Prüf-Schwerpunkte

1. Abhaken eines Feldes einer anderen Kategorie als der gedrehten → Spiel bleibt unverändert (Aufgabe 7).
2. Zweites Abhaken in derselben Runde → ignoriert (Aufgabe 7).
3. Abhaken vor „Lösung anzeigen“ → ignoriert (Aufgabe 7).
4. Ein Song läuft nie zweimal im Spiel; leerer Stapel → keine neue Runde, nach `stapelNeuMischen` wieder alle Songs
   (Aufgabe 7).
5. Jahrzehnt an der Grenze: 1999 → `"1990er"`, 2000 → `"2000er"` (Aufgabe 2).

## Dateien

| Datei | Zuständig für |
|---|---|
| `lib/zufall.ts` | Typ `Zufall`, `mischen` |
| `lib/song.ts` | Typ `Song` |
| `lib/kategorien.ts` | Typen `KategorieId`, `Kategorie`, Daten `KATEGORIEN` mit Lösung je Kategorie |
| `lib/rad.ts` | `radDrehen` |
| `lib/karte.ts` | Typen `Feld`, `Karte`, `karteAusteilen`, `feldSetzen` |
| `lib/bingo.ts` | `hatBingo` |
| `lib/songliste.ts` | Daten `SONGLISTE` (feste Songliste für Phase 1) |
| `lib/spiel.ts` | Typen `Runde`, `Spiel` und die Spielzüge |
| `__tests__/hilfen/zufallsfolge.ts` | Testhilfe: Zufall mit festen Werten |

## Aufgaben

### Aufgabe 1: Zufall und Mischen

**Dateien:** Neu `lib/zufall.ts`, `__tests__/hilfen/zufallsfolge.ts`, Test `__tests__/lib/zufall.test.ts`

**Schnittstellen:**
- Liefert: `type Zufall = () => number` (Werte in [0, 1) wie `Math.random`),
  `mischen<T>(liste: readonly T[], zufall: Zufall = Math.random): T[]`,
  Testhilfe `zufallsfolge(...werte: number[]): Zufall` (gibt die Werte der Reihe nach zurück, danach von vorn).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("mischen mit Zufall 0 ergibt die Fisher-Yates-Reihenfolge", () => {
  expect(mischen([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
});
test("mischen behält alle Elemente und ändert die Eingabe nicht", () => {
  const liste = [1, 2, 3, 4, 5];
  const gemischt = mischen(liste, zufallsfolge(0.7, 0.1, 0.5));
  expect([...gemischt].sort()).toEqual([1, 2, 3, 4, 5]);
  expect(liste).toEqual([1, 2, 3, 4, 5]);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
  `npx vitest run __tests__/lib/zufall.test.ts`, erwartet: FAIL, Import `@/lib/zufall` lässt sich nicht auflösen.
- [x] **Schritt 3: `zufallsfolge` und `mischen` schreiben.** Fisher-Yates auf einer Kopie: `i` von hinten nach vorn,
  `j = Math.floor(zufall() * (i + 1))`, tauschen.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen** (gleicher Befehl, PASS).
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add shuffle with injectable randomness"`

### Aufgabe 2: Song und Kategorien

**Dateien:** Neu `lib/song.ts`, `lib/kategorien.ts`, Test `__tests__/lib/kategorien.test.ts`

**Schnittstellen:**
- Liefert: `type Song = { id: string; titel: string; interpret: string; jahr: number }`,
  `type KategorieId = "titel" | "interpret" | "jahrzehnt" | "jahr" | "jahrPlusMinus3"`,
  `type Kategorie = { id: KategorieId; name: string; farbe: string; loesung: (song: Song) => string }`,
  `KATEGORIEN: readonly Kategorie[]` in der Reihenfolge Titel, Interpret, Jahrzehnt, Jahr, Jahr ±3.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const bohemian: Song = { id: "x", titel: "Bohemian Rhapsody", interpret: "Queen", jahr: 1975 };
const loesung = (id: KategorieId, song: Song) => KATEGORIEN.find((k) => k.id === id)!.loesung(song);

test("jede Kategorie zeigt ihre Lösung", () => {
  expect(loesung("titel", bohemian)).toBe("Bohemian Rhapsody");
  expect(loesung("interpret", bohemian)).toBe("Queen");
  expect(loesung("jahrzehnt", bohemian)).toBe("1970er");
  expect(loesung("jahr", bohemian)).toBe("1975");
  expect(loesung("jahrPlusMinus3", bohemian)).toBe("1972 bis 1978");
});
test("Jahrzehnt an der Grenze", () => {
  expect(loesung("jahrzehnt", { ...bohemian, jahr: 1999 })).toBe("1990er");
  expect(loesung("jahrzehnt", { ...bohemian, jahr: 2000 })).toBe("2000er");
});
test("fünf Kategorien mit eigener Id, eigenem Namen und eigener Farbe", () => {
  expect(KATEGORIEN.map((k) => k.name)).toEqual(["Titel", "Interpret", "Jahrzehnt", "Jahr", "Jahr ±3"]);
  expect(new Set(KATEGORIEN.map((k) => k.farbe)).size).toBe(5);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/kategorien.test.ts`)
- [x] **Schritt 3: `Song`, `KategorieId`, `Kategorie`, `KATEGORIEN` schreiben**, Farben aus „Annahmen“.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add categories as data"`

### Aufgabe 3: Rad

**Dateien:** Neu `lib/rad.ts`, Test `__tests__/lib/rad.test.ts`

**Schnittstellen:**
- Nutzt: `Kategorie`, `KATEGORIEN`, `Zufall`
- Liefert: `radDrehen(kategorien: readonly Kategorie[], zufall: Zufall = Math.random): Kategorie`

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("Zufall 0 wählt die erste Kategorie", () => {
  expect(radDrehen(KATEGORIEN, () => 0).id).toBe("titel");
});
test("Zufall knapp unter 1 wählt die letzte Kategorie", () => {
  expect(radDrehen(KATEGORIEN, () => 0.999).id).toBe("jahrPlusMinus3");
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
- [x] **Schritt 3: `radDrehen` schreiben**: Index `Math.floor(zufall() * kategorien.length)`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add wheel spin"`

### Aufgabe 4: Karte

**Dateien:** Neu `lib/karte.ts`, Test `__tests__/lib/karte.test.ts`

**Schnittstellen:**
- Nutzt: `KategorieId`, `Zufall`, `mischen`
- Liefert: `type Feld = { kategorie: KategorieId; abgehakt: boolean }`, `type Karte = Feld[]` (25 Felder, zeilenweise:
  Index = Zeile × 5 + Spalte), `karteAusteilen(kategorien: readonly KategorieId[], zufall: Zufall = Math.random): Karte`,
  `feldSetzen(karte: Karte, index: number, abgehakt: boolean): Karte`

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const ids = KATEGORIEN.map((k) => k.id);

test("Karte hat 25 freie Felder, jede Kategorie genau fünfmal", () => {
  const karte = karteAusteilen(ids, zufallsfolge(0.3, 0.8, 0.1));
  expect(karte).toHaveLength(25);
  expect(karte.every((f) => !f.abgehakt)).toBe(true);
  for (const id of ids) expect(karte.filter((f) => f.kategorie === id)).toHaveLength(5);
});
test("anderer Zufall ergibt eine andere Karte", () => {
  expect(karteAusteilen(ids, () => 0)).not.toEqual(karteAusteilen(ids, zufallsfolge(0.9, 0.2, 0.6)));
});
test("feldSetzen hakt ein Feld ab und lässt die alte Karte unverändert", () => {
  const karte = karteAusteilen(ids, () => 0);
  const neu = feldSetzen(karte, 7, true);
  expect(neu[7].abgehakt).toBe(true);
  expect(karte[7].abgehakt).toBe(false);
  expect(feldSetzen(neu, 7, false)[7].abgehakt).toBe(false);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
- [x] **Schritt 3: `karteAusteilen` und `feldSetzen` schreiben**: jede Id fünfmal in eine Liste, mit `mischen`
  durchmischen, in Felder umwandeln.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add card dealing and field marking"`

### Aufgabe 5: Bingo-Erkennung

**Dateien:** Neu `lib/bingo.ts`, Test `__tests__/lib/bingo.test.ts`

**Schnittstellen:**
- Nutzt: `Karte`, `feldSetzen`, `karteAusteilen`
- Liefert: `hatBingo(karte: Karte): boolean`

- [x] **Schritt 1: Fehlschlagende Tests schreiben** mit einer Hilfe
  `abgehakt(...indizes: number[]): Karte` (frische Karte, die genannten Felder per `feldSetzen` abgehakt):

```ts
test("leere Karte hat kein Bingo", () => expect(hatBingo(abgehakt())).toBe(false));
test("waagerecht: Zeile 2", () => expect(hatBingo(abgehakt(10, 11, 12, 13, 14))).toBe(true));
test("senkrecht: Spalte 4", () => expect(hatBingo(abgehakt(4, 9, 14, 19, 24))).toBe(true));
test("Diagonale links oben nach rechts unten", () => expect(hatBingo(abgehakt(0, 6, 12, 18, 24))).toBe(true));
test("Diagonale rechts oben nach links unten", () => expect(hatBingo(abgehakt(4, 8, 12, 16, 20))).toBe(true));
test("vier in einer Reihe sind kein Bingo", () => expect(hatBingo(abgehakt(0, 1, 2, 3))).toBe(false));
test("Reihe über den Zeilenumbruch ist kein Bingo", () => expect(hatBingo(abgehakt(3, 4, 5, 6, 7))).toBe(false));
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
- [x] **Schritt 3: `hatBingo` schreiben**: die 12 Linien (5 Zeilen, 5 Spalten, 2 Diagonalen) als Index-Listen,
  Bingo, wenn bei einer alle Felder abgehakt sind.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add bingo detection"`

### Aufgabe 6: Feste Songliste

**Dateien:** Neu `lib/songliste.ts`, Test `__tests__/lib/songliste.test.ts`

**Schnittstellen:**
- Nutzt: `Song`
- Liefert: `SONGLISTE: readonly Song[]`, Id als Kurzform `"<interpret>-<titel>"` in Kleinbuchstaben mit Bindestrichen

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("25 Songs mit eindeutiger Id", () => {
  expect(SONGLISTE).toHaveLength(25);
  expect(new Set(SONGLISTE.map((s) => s.id)).size).toBe(25);
});
test("mindestens sechs Jahrzehnte, damit die Kategorie Jahrzehnt etwas zu raten hat", () => {
  expect(new Set(SONGLISTE.map((s) => Math.floor(s.jahr / 10))).size).toBeGreaterThanOrEqual(6);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
- [x] **Schritt 3: `SONGLISTE` schreiben** mit diesen Songs (Original-Erscheinungsjahr, im PR zu prüfen):

| Interpret | Titel | Jahr |
|---|---|---|
| Elvis Presley | Jailhouse Rock | 1957 |
| Chuck Berry | Johnny B. Goode | 1958 |
| The Rolling Stones | (I Can't Get No) Satisfaction | 1965 |
| The Beatles | Hey Jude | 1968 |
| Queen | Bohemian Rhapsody | 1975 |
| ABBA | Dancing Queen | 1976 |
| Bee Gees | Stayin' Alive | 1977 |
| Gloria Gaynor | I Will Survive | 1978 |
| Survivor | Eye of the Tiger | 1982 |
| Cyndi Lauper | Girls Just Want to Have Fun | 1983 |
| Nena | 99 Luftballons | 1983 |
| Bon Jovi | Livin' on a Prayer | 1986 |
| Whitney Houston | I Wanna Dance with Somebody | 1987 |
| Nirvana | Smells Like Teen Spirit | 1991 |
| Haddaway | What Is Love | 1993 |
| Oasis | Wonderwall | 1995 |
| Spice Girls | Wannabe | 1996 |
| Britney Spears | ...Baby One More Time | 1998 |
| Eminem | Lose Yourself | 2002 |
| Beyoncé | Crazy in Love | 2003 |
| Amy Winehouse | Rehab | 2006 |
| Rihanna | Umbrella | 2007 |
| Adele | Rolling in the Deep | 2010 |
| Daft Punk | Get Lucky | 2013 |
| The Weeknd | Blinding Lights | 2019 |

- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add fixed song list for phase 1"`

### Aufgabe 7: Spielstand und Spielzüge

**Dateien:** Neu `lib/spiel.ts`, Test `__tests__/lib/spiel.test.ts`; Ändern `docs/Glossar.md` (Begriff „Stapel“),
`CLAUDE.md` (Repo-Struktur: `lib/` ist da)

**Schnittstellen:**
- Nutzt: alles aus Aufgabe 1 bis 5
- Liefert:
  - `type Runde = { nummer: number; kategorie: Kategorie; song: Song; aufgeloest: boolean; abgehaktesFeld: number | null }`
  - `type Spiel = { karte: Karte; stapel: Song[]; runde: Runde | null }`
  - `spielStarten(songs: readonly Song[], zufall: Zufall = Math.random): Spiel`: Karte aus `KATEGORIEN` austeilen,
    Stapel = gemischte Songs, `runde: null`
  - `rundeStarten(spiel: Spiel, zufall: Zufall = Math.random): Spiel`: Rad drehen, ersten Song vom Stapel nehmen,
    Nummer = vorige + 1 (erste Runde 1). Unverändert, wenn die laufende Runde noch nicht aufgelöst ist, der Stapel
    leer ist oder die Karte Bingo hat.
  - `loesungAnzeigen(spiel: Spiel): Spiel`: `aufgeloest: true`
  - `feldAbhaken(spiel: Spiel, index: number): Spiel`: nur nach der Auflösung, nur ein freies Feld der gedrehten
    Kategorie, nur einmal pro Runde; merkt sich `abgehaktesFeld`. Sonst unverändert.
  - `abhakenZuruecknehmen(spiel: Spiel, index: number): Spiel`: jederzeit; war es das Feld der laufenden Runde,
    wird `abgehaktesFeld` wieder `null`.
  - `stapelNeuMischen(spiel: Spiel, songs: readonly Song[], zufall: Zufall = Math.random): Spiel`: neuer gemischter
    Stapel aus allen Songs, Karte bleibt.

- [x] **Schritt 1: Fehlschlagende Tests schreiben.** Hilfe `aufgeloesteRunde()`: `spielStarten(SONGS, () => 0)`,
  `rundeStarten(…, () => 0)` (Kategorie Titel), `loesungAnzeigen`; `SONGS` sind drei Songs aus `SONGLISTE`;
  `titelFeld(spiel)` und `anderesFeld(spiel)` liefern den Index des ersten freien Feldes mit bzw. ohne Kategorie
  Titel. Tests:
  - `spielStarten`: 25 Felder, Stapel hat 3 Songs, `runde` ist `null`.
  - `rundeStarten`: Runde 1 mit Kategorie Titel und dem ersten Song des Stapels, Stapel hat danach 2 Songs.
  - zweites `rundeStarten` ohne Auflösung → `toBe` dasselbe Objekt.
  - drei Runden nacheinander (jeweils auflösen) → drei verschiedene Songs, Nummern 1, 2, 3; vierte Runde → unverändert;
    nach `stapelNeuMischen(spiel, SONGS)` hat der Stapel wieder 3 Songs und die Karte ist dieselbe.
  - `feldAbhaken` vor der Auflösung → unverändert.
  - `feldAbhaken(spiel, anderesFeld)` → unverändert.
  - `feldAbhaken(spiel, titelFeld)` → Feld abgehakt, `abgehaktesFeld` gesetzt; zweites Titel-Feld danach → unverändert.
  - `abhakenZuruecknehmen` des eben abgehakten Feldes → Feld frei, danach geht `feldAbhaken` in derselben Runde wieder.
  - Karte mit Bingo (Felder direkt per `feldSetzen` gesetzt) → `rundeStarten` unverändert.
- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/spiel.test.ts`)
- [x] **Schritt 3: `lib/spiel.ts` schreiben** nach den Schnittstellen oben.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Doku:** Glossar unter „Ablauf“: **Stapel**: Die Songs, die in diesem Spiel noch nicht gelaufen sind;
  ist er leer, mischt der DJ neu oder wählt eine andere Playlist. _Nicht verwenden_: Queue, Warteschlange.
  `CLAUDE.md`, Repo-Struktur: `lib/` mit der Spiellogik als reine Funktionen eintragen, den Satz „kommt in Phase 1“
  streichen.
- [x] **Schritt 6: Prüfen und committen:** `npm run check`, `git commit -m "Add game state and moves"`

## Abschluss

PR „Add game logic for phase 1“ öffnen, `gh pr checks <nr>` grün, Entwickler prüft die Songliste, mergen. Danach
Plan B (Oberfläche) mit `plan-schreiben`.
