---
titel: "Plan: Design Spielshow im Studio"
status: aktiv
erstellt: 2026-10-22
tags: [plan, oberflaeche, design, phase-4]
---

# Plan: Design Spielshow im Studio

**Ziel:** Ein einheitliches, ansprechendes Aussehen für Start, Beitreten, Tisch und Handy im Stil einer TV-Spielshow,
ohne das Verhalten der App zu ändern.

**Vorgehen:** Erst die Grundlage (Farben als Tailwind-Tokens, Schriften, gemeinsamer `Knopf`), dann je Bereich ein
eigener Branch und PR. Verhalten bleibt gleich, deshalb belegen vor allem die vorhandenen Tests, dass nichts kaputtgeht.
Neue Tests gibt es dort, wo das Design eine prüfbare Anforderung hat: Titel, Tisch ohne Scrollen, Felder ohne
abgeschnittenen Text, Zustand des Birnenkranzes. Jede Aufgabe endet mit Screenshots in 1280×800 und 393×852 (iPhone 15).

**Technik:** Tailwind CSS v4 (`@theme` in `app/globals.css`), `next/font/google` (Doku:
`node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`), Vitest mit Testing Library, Playwright. Keine
neuen Pakete.

**Anforderung:** Designplan aus der Session vom 2026-10-22 (Skill `frontend-design`), vom Entwickler freigegeben:
Richtung Spielshow, nur dunkles Thema, Titel „Musik-Bingo“. [[projects/musik-app/docs/Projektvision|Projektvision]]
Phase 4.

## Designentscheidungen

**Idee:** Studio einer Spielshow wie das „Glücksrad“. Der Laptop ist die Bühne, das Rad der Star mit einem Kranz aus
Glühbirnen, die Handys sind die Karten der Kandidaten.

| Token | Hex | Rolle |
|---|---|---|
| `nacht` | `#1C1E4A` | Hintergrund |
| `boden` | `#2C2F6B` | Flächen, Felder, Eingaben |
| `birne` | `#FFC83D` | Akzent: Birnen, Hauptknöpfe, Bingo |
| `licht` | `#FFF3D9` | Schrift |
| `signal` | `#FF5A5F` | nur Fehler und „Raum schließen“ |

Kategorie-Farben (Daten in `lib/kategorien.ts`), kräftig auf `nacht`, Schrift darauf in `nacht`:
Titel `#4FC3F7`, Interpret `#FF6FB5`, Jahrzehnt `#FF8C42`, Jahr `#5EE6A8`, Jahr ±3 `#B78CFF`.

**Schriften:** `Bungee` (nur Gewicht 400) als `font-schild` für Raum-Code, Kategorie, Lösung, „Bingo!“ und den Titel.
`Barlow` (400, 600, 700, kein variabler Font, daher Gewichte nötig) als Standardschrift `font-sans`.

**Grundsätze:**
1. Mutig nur an einer Stelle: der Birnenkranz ums Rad. Einzige Bewegung, die von selbst läuft: Lauflicht beim Drehen,
   alle Birnen blinken bei Bingo, sonst leuchten sie ruhig. Bei `prefers-reduced-motion` steht er.
2. Abgehakte Felder bekommen einen runden Stempelpunkt wie vom Bingo-Marker.
3. Keine Kästen mit Schatten. Die Bühne ist die Fläche selbst, Gliederung über Abstand und `boden`-Flächen.
4. Nur ein dunkles Thema. Keine `dark:`-Klassen mehr, kein `prefers-color-scheme`.

## Feste Vorgaben

- Texte, Rollen und `aria-*`-Attribute bleiben gleich, die Bots in `e2e/hilfen/raum.ts` suchen danach. Der Raum-Code
  bleibt ein einzelner Textknoten (Bot sucht `/^[A-Z]{4}$/`).
- Einzige Textänderung: „Musik-App“ wird „Musik-Bingo“ (Überschrift auf Start und Callback, `metadata.title`). Der
  Gerätename „Musik-App Tisch“ in Spotify bleibt.
- Farben nur über die Tokens (`bg-nacht`, `text-licht`, `bg-birne` …) oder die Kategorie-Farbe aus den Daten. Keine
  `zinc-`, `foreground`- oder `background`-Klassen mehr.
- Knöpfe nur über `Knopf` aus `app/ui/knopf.tsx`. Textknöpfe (unterstrichen, z. B. „Raum schließen“) bleiben `<button
  className="underline">`.
- Sichtbarer Fokus für alle Knöpfe und Eingaben: `focus-visible:outline-2 outline-birne`.
- Pro Bereich ein Branch und ein PR: `feat/design-grundlage`, `feat/design-start`, `feat/design-tisch`,
  `feat/design-handy`.
- Vor jedem Commit `npm run check` mit Exit-Code 0, vor jedem PR zusätzlich `npm run e2e`. Mit der Shell geschriebene
  Dateien vorher mit `npx prettier --write <datei>` formatieren.
- Screenshots mit einem Playwright-Skript im Scratchpad, nicht im Repo.

## Prüf-Schwerpunkte

1. Tisch im laufenden Spiel mit Raum, Spielern und Rad passt in 1280×800 ohne Scrollen (Aufgabe 3, e2e).
2. Das längste Kategorie-Wort „Jahrzehnt“ passt am Handy (393 px) ins Feld, ohne abgeschnitten zu werden (Aufgabe 4, e2e).
3. Bei „Bewegung reduzieren“ läuft kein Lauflicht (Aufgabe 3, CSS `prefers-reduced-motion`, Screenshot-Prüfung).
4. Lösung mit Cover und Liste passt ebenfalls ohne Scrollen auf den Laptop (Aufgabe 3, e2e, zweiter Messpunkt).
5. Raum-Code wird auch klein eingetippt angenommen: `raumCodeLesen` macht das schon, die neue Eingabe darf es nicht
   brechen (Aufgabe 2: kein `maxLength`, denn „EH MF“ mit Leerzeichen ist erlaubt; kein eigenes Umwandeln;
   `npm run e2e` mit `e2e/raum.spec.ts`).

## Dateien

| Datei | Zuständig für |
|---|---|
| `app/globals.css` | Tokens in `@theme`, Grundfarben von `body`, Keyframes für Birnenkranz und Stempel |
| `app/layout.tsx` | Schriften Bungee und Barlow, `metadata.title` |
| `app/ui/knopf.tsx` (neu) | `Knopf`, einheitlicher Knopf in zwei Arten |
| `lib/kategorien.ts` | neue Werte für `farbe` |
| `app/page.tsx`, `app/callback/page.tsx` | Titel „Musik-Bingo“ als Schild |
| `app/ui/start.tsx` | Raum eröffnen, Code eingeben, Anmelden, Playlists; Aufteilung Kulisse/Bühne im Raum |
| `app/ui/handy-raum.tsx` | Beitreten mit Namen am Handy |
| `app/ui/raum-kopf.tsx` | Kulisse: Code als Anzeigetafel, QR-Code, Spielerleiste |
| `app/ui/birnenkranz.tsx` (neu) | Glühbirnen rund ums Rad |
| `app/ui/rad-ansicht.tsx`, `app/ui/tisch.tsx`, `app/ui/musikspur.tsx` | Bühne |
| `app/ui/spiel-ansicht.tsx`, `app/ui/vorbereiten-ansicht.tsx`, `app/ui/songliste.tsx` | Tisch-Ansichten auf Tokens und `Knopf` |
| `app/ui/karte-ansicht.tsx`, `app/ui/handy-spiel.tsx` | Karte mit Stempel, Kopf und Notizen am Handy |
| `e2e/design.spec.ts` (neu) | Tisch ohne Scrollen, Felder ohne abgeschnittenen Text |

## Teil 1: Grundlage (`feat/design-grundlage`)

### Aufgabe 1: Tokens, Schriften, Knopf, Titel

**Dateien:**
- Ändern: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/callback/page.tsx`, `lib/kategorien.ts`
- Neu: `app/ui/knopf.tsx`
- Test: `__tests__/page.test.tsx`, `__tests__/ui/knopf.test.tsx` (neu)

**Schnittstellen:**
- Liefert: Tailwind-Klassen `bg-nacht`, `bg-boden`, `bg-birne`, `text-licht`, `text-nacht`, `text-signal`,
  `outline-birne`, `font-schild`, `font-sans` (Barlow).
- Liefert: `export default function Knopf({ onClick, children, art = "haupt", disabled }: { onClick: () => void;
  children: React.ReactNode; art?: "haupt" | "neben"; disabled?: boolean })` in `app/ui/knopf.tsx`.
  `haupt`: `bg-birne text-nacht`, `neben`: Rahmen `border-licht`, transparent. Beide `font-semibold`, deaktiviert
  `opacity-40`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
// __tests__/page.test.tsx: Erwartung anpassen
screen.getByRole("heading", { level: 1, name: "Musik-Bingo" })

// __tests__/ui/knopf.test.tsx
test("Knopf meldet Klick und ist deaktiviert ohne Klick", () => {
  const klick = vi.fn();
  const { rerender } = render(<Knopf onClick={klick}>Rad drehen</Knopf>);
  fireEvent.click(screen.getByRole("button", { name: "Rad drehen" }));
  expect(klick).toHaveBeenCalledTimes(1);
  rerender(<Knopf onClick={klick} disabled>Rad drehen</Knopf>);
  fireEvent.click(screen.getByRole("button", { name: "Rad drehen" }));
  expect(klick).toHaveBeenCalledTimes(1);
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/page.test.tsx __tests__/ui/knopf.test.tsx`
Erwartet: FAIL, Überschrift „Musik-Bingo“ nicht gefunden, `app/ui/knopf` nicht vorhanden.

- [x] **Schritt 3: Umsetzen**
  - `globals.css`: `:root`-Variablen und `prefers-color-scheme`-Block durch `@theme` mit den fünf Farben und
    `--font-schild: var(--font-bungee)`, `--font-sans: var(--font-barlow)` ersetzen; `body` in `bg-nacht text-licht`,
    `font-family` aus `body` entfernen (kommt über `font-sans`).
  - `layout.tsx`: `Geist`/`Geist_Mono` durch `Bungee({ weight: "400", variable: "--font-bungee", subsets: ["latin"] })`
    und `Barlow({ weight: ["400", "600", "700"], variable: "--font-barlow", subsets: ["latin"] })` ersetzen,
    `<body>` bekommt `font-sans`, `title: "Musik-Bingo"`.
  - `page.tsx` und `callback/page.tsx`: `<h1 className="font-schild text-5xl text-birne">Musik-Bingo</h1>`.
  - `kategorien.ts`: neue Farben aus der Tabelle oben.
  - `knopf.tsx` nach der Schnittstelle. Noch keine Ansicht umstellen, das machen die Teile 2 bis 4.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm run check`
Erwartet: Exit-Code 0.

- [x] **Schritt 5: Screenshots ansehen** (Start, Tisch, Handy): dunkler Grund, Titel als gelbes Schild, Kategorien in
  den neuen Farben. Alte schwarze Knöpfe sind auf dem dunklen Grund noch erwartet.

- [x] **Schritt 6: Committen, PR**

```bash
git add app/globals.css app/layout.tsx app/page.tsx app/callback/page.tsx lib/kategorien.ts app/ui/knopf.tsx \
  __tests__/page.test.tsx __tests__/ui/knopf.test.tsx docs/plaene/2026-10-22-design-spielshow.md
git commit -m "Add design tokens, fonts and shared button"
```

## Teil 2: Start und Beitreten (`feat/design-start`)

### Aufgabe 2: Startseite, Code-Eingabe, Namensabfrage

**Dateien:**
- Ändern: `app/ui/start.tsx`, `app/ui/handy-raum.tsx`, `app/ui/rueckruf.tsx`
- Test: bestehende `__tests__/ui/start.test.tsx`, `__tests__/ui/handy-raum.test.tsx`, `__tests__/ui/rueckruf.test.tsx`

**Schnittstellen:**
- Nutzt: `Knopf` (Aufgabe 1).

- [x] **Schritt 1: Umsetzen**
  - Start ohne Raum: „Raum eröffnen“ als `Knopf` `haupt`, darunter die Code-Eingabe als ein Feld im Stil einer
    Anzeigetafel (`font-schild text-3xl tracking-[0.3em] uppercase bg-boden`, Breite für 4 Zeichen, kein `maxLength`)
    mit „Beitreten“ als `Knopf` `neben`. Das Etikett „Raum-Code“ bleibt.
  - Anmelden, Playlists, Abmelden und Demo auf `Knopf`. Playlists als Liste von Flächen `bg-boden` mit Name und Anzahl
    Songs statt unterstrichener Links (weiter `<button>`).
  - Handy-Namensabfrage: Raum-Code als Schild (`font-schild`), Eingabe `bg-boden` groß genug für den Daumen
    (`text-xl`, `py-3`), „Beitreten“ als `Knopf` `haupt`, Meldungen in `text-signal`.
  - `rueckruf.tsx`: Link „Zur Startseite“ in `text-birne`.

- [x] **Schritt 2: Tests laufen lassen**

`npm run check && npm run e2e`
Erwartet: beide grün, keine Teständerung nötig.

- [x] **Schritt 3: Screenshots ansehen:** Start in 1280×800 und 393×852, Namensabfrage in 393×852. Fokus mit Tab sichtbar.

- [x] **Schritt 4: Committen, PR**

```bash
git add app/ui/start.tsx app/ui/handy-raum.tsx app/ui/rueckruf.tsx
git commit -m "Style start page and joining in game show look"
```

## Teil 3: Tisch (`feat/design-tisch`)

### Aufgabe 3: Bühne, Kulisse, Birnenkranz

**Dateien:**
- Neu: `app/ui/birnenkranz.tsx`, `e2e/design.spec.ts`
- Ändern: `app/ui/start.tsx`, `app/ui/raum-kopf.tsx`, `app/ui/rad-ansicht.tsx`, `app/ui/tisch.tsx`,
  `app/ui/musikspur.tsx`, `app/ui/spiel-ansicht.tsx`, `app/ui/vorbereiten-ansicht.tsx`, `app/ui/songliste.tsx`,
  `app/globals.css`
- Test: `__tests__/ui/spiel-ansicht.test.tsx`, `e2e/design.spec.ts`

**Schnittstellen:**
- Nutzt: `Knopf`, Tokens (Aufgabe 1); `Tisch`-Bot aus `e2e/hilfen/raum.ts` (`Tisch.eroeffnen`, `demoStarten`, `drehen`).
- Liefert: `export default function Birnenkranz({ modus }: { modus: "ruhig" | "lauf" | "bingo" })` in
  `app/ui/birnenkranz.tsx`. Ein `<div aria-hidden data-modus={modus}>` mit 24 Birnen auf einem Kreis um das Rad.
  `lauf`: Lauflicht über `animation-delay` je Birne, `bingo`: alle blinken, `ruhig`: leuchten ohne Bewegung.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
// __tests__/ui/spiel-ansicht.test.tsx
test("Birnenkranz läuft beim Drehen und steht danach", () => {
  // wie die vorhandenen Tests: SpielAnsicht mit festem Zufall, „Spiel starten“, „Rad drehen“
  expect(container.querySelector('[data-modus="lauf"]')).not.toBeNull();
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
  expect(container.querySelector('[data-modus="ruhig"]')).not.toBeNull();
});
```

```ts
// e2e/design.spec.ts
test("Tisch passt im Spiel ohne Scrollen auf den Laptop", async ({ browser }) => {
  // Kontext mit viewport 1280×800, Tisch.eroeffnen, ein Spieler tritt bei, demoStarten, drehen
  // nach dem Stillstand und nach „Lösung anzeigen“ jeweils:
  expect(await seite.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(800);
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/spiel-ansicht.test.tsx && npx playwright test e2e/design.spec.ts --project=chromium`
Erwartet: FAIL, kein `data-modus`; `scrollHeight` größer als 800.

- [x] **Schritt 3: Umsetzen**
  - `start.tsx` mit Raum: Raster `lg:grid-cols-[16rem_1fr]`, links `RaumKopf` (Kulisse), rechts der Ablauf (Bühne).
    Der Titel auf `page.tsx` bleibt. Sprengt er die 800 px, wird er dort `text-3xl` statt `text-5xl` (der e2e-Test
    entscheidet).
  - `raum-kopf.tsx`: Code als Anzeigetafel (`font-schild text-6xl text-birne`), QR-Code mit hellem Rand auf `licht`,
    Spieler untereinander als Zeilen `Name … Zahl` (Zahl rechts, `font-schild`), getrennte ausgegraut,
    „Raum schließen“ in `text-signal`.
  - `rad-ansicht.tsx`: Rad größer (`w-80`), Trennlinien in `nacht` statt weiß, Zeiger in `birne`, Text in
    `font-schild`; `Birnenkranz` darum. `tisch.tsx` bestimmt `modus`: `dreht` → `lauf`, `bingo` → `bingo`, sonst `ruhig`.
  - `tisch.tsx`: Rahmen der `section` entfällt. Kategorie als Schild (`font-schild text-3xl`, Kategorie-Farbe,
    Schrift `text-nacht`), Lösung `font-schild text-5xl text-birne`, Liste der Angaben in `text-licht/70` für die
    Etiketten, Cover `w-40`. Auflösung neben dem Cover statt darunter, damit sie in 800 px Höhe passt.
    Lokales `Knopf` durch `app/ui/knopf.tsx` ersetzen, „Lösung anzeigen“ und „Nächste Runde“ `haupt`, „Nochmal“ und
    „Weiterhören“ `neben`. Meldung in `text-signal`.
  - `musikspur.tsx`: Spur `bg-boden` statt `zinc`.
  - `spiel-ansicht.tsx`, `vorbereiten-ansicht.tsx`, `songliste.tsx`: Knöpfe auf `Knopf`, Eingaben und Auswahl `bg-boden`,
    keine `zinc`- und `dark:`-Klassen mehr.
  - `globals.css`: Keyframes `birne-lauf` und `birne-blinken`, unter `prefers-reduced-motion: reduce` keine Animation.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm run check && npm run e2e`
Erwartet: beide grün.

- [x] **Schritt 5: Screenshots ansehen:** Tisch vor dem Spiel, während das Rad dreht, mit Kategorie, mit Lösung, bei
  Bingo, jeweils 1280×800; Vorbereiten und Songliste. Einmal mit `reducedMotion: "reduce"` im Kontext.

- [x] **Schritt 6: Committen, PR**

```bash
git add app/ui/birnenkranz.tsx app/ui/start.tsx app/ui/raum-kopf.tsx app/ui/rad-ansicht.tsx app/ui/tisch.tsx \
  app/ui/musikspur.tsx app/ui/spiel-ansicht.tsx app/ui/vorbereiten-ansicht.tsx app/ui/songliste.tsx app/globals.css \
  __tests__/ui/spiel-ansicht.test.tsx e2e/design.spec.ts
git commit -m "Turn the table into a game show stage with bulb ring"
```

**Abweichungen bei der Umsetzung (2026-10-22):**
- Das Rad bleibt auch in der Auflösung sichtbar. Auf der breiten Bühne steht es links neben der Moderation, der Platz
  reicht. So entfällt das Verstecken, und bei Bingo blinkt der Kranz sichtbar. Schmal (`@container` unter `@2xl`)
  stapelt sich alles.
- Prüf-Schwerpunkt 3 hat einen Fehler gefunden: Die Regel für `prefers-reduced-motion` war weniger spezifisch als die
  für das Lauflicht und verlor. Behoben, dazu der e2e-Test „bei „Bewegung reduzieren“ läuft kein Lauflicht“.
- Änderungen an `app/globals.css` übernimmt der laufende Dev-Server nicht, erst nach einem Neustart.

## Teil 4: Handy (`feat/design-handy`)

### Aufgabe 4: Karte mit Stempel

**Dateien:**
- Ändern: `app/ui/karte-ansicht.tsx`, `app/ui/handy-spiel.tsx`, `app/globals.css`, `e2e/design.spec.ts`

**Schnittstellen:**
- Nutzt: Tokens (Aufgabe 1), `Spieler`-Bot (`Spieler.beitreten`) und `e2e/design.spec.ts` (Aufgabe 3).
- `KarteAnsicht` behält ihre Props.

- [x] **Schritt 1: Fehlschlagenden Test schreiben**

```ts
// e2e/design.spec.ts
test("Felder am Handy zeigen ihr Wort ganz", async ({ browser }) => {
  // Tisch eröffnen, demoStarten; Spieler mit viewport 393×852 tritt bei
  const abgeschnitten = await spieler.seite.getByRole("button", { name: /^Feld / }).evaluateAll((felder) =>
    felder.filter((f) => f.scrollWidth > f.clientWidth).length,
  );
  expect(abgeschnitten).toBe(0);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**

`npx playwright test e2e/design.spec.ts --project=chromium`
Erwartet: FAIL, mindestens ein „Jahrzehnt“-Feld ist breiter als sein Platz.

- [x] **Schritt 3: Umsetzen**
  - `karte-ansicht.tsx`: Felder `rounded-md`, Kategorie-Farbe als Grund, Wort in `text-nacht font-bold` mit
    `text-[clamp(0.6rem,3.2vw,0.9rem)]` und `break-words hyphens-auto` (Silbentrennung über `lang="de"`), Abstand
    `gap-1.5`. Ausgegraut: `opacity-50` statt grauer Schrift. Abgehakt statt „✓“-Fläche: runder Stempelpunkt
    (`absolute inset-[5%] rounded-full bg-birne`) unter dem Wort, das Wort bleibt lesbar.
    Bingo-Reihe: `ring-birne`.
  - `globals.css`: Keyframe `stempel` (kurz von groß auf normal), nur beim Abhaken, aus bei `prefers-reduced-motion`.
  - `handy-spiel.tsx`: Kopf als eine Zeile mit Raum-Code als Schild und Namen, der Satz „Du bist im Raum … als …“
    bleibt als Text (Bot sucht ihn) in `text-sm`. „Bingo!“ als `font-schild text-birne`. Notizen `bg-boden`, Schalter
    „Notizen an/aus“ als Textknopf in `text-birne`. Meldungen in `text-signal`.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm run check && npm run e2e`
Erwartet: beide grün.

- [x] **Schritt 5: Screenshots ansehen** in 393×852 und 360×780: wartend, im Spiel mit ausgegrauten Feldern, mit
  Stempeln, mit Bingo-Reihe, mit und ohne Notizen.

- [x] **Schritt 6: Committen, PR**

```bash
git add app/ui/karte-ansicht.tsx app/ui/handy-spiel.tsx app/globals.css e2e/design.spec.ts
git commit -m "Style the phone card with bingo stamps"
```

**Abweichungen bei der Umsetzung (2026-10-22):**
- Der Test war bei 393 px sofort grün, „Jahrzehnt“ passt dort knapp. Er prüft jetzt 360 px (häufige Android-Breite)
  und misst die Breite des Worts selbst gegen die Innenbreite des Felds: `scrollWidth` übersieht zentrierten Text,
  der nach beiden Seiten hinausragt.
- Statt Schriftgröße mit `clamp`: Silbentrennung (`hyphens-auto`, „Jahr-zehnt“) und weniger Seitenrand am Handy
  (`px-4` in `app/raum/[code]/page.tsx`).

## Abschluss

- `plan-pruefer` prüft jeden Branch gegen diesen Plan, `/code-review` vor jedem Merge.
- Nach Teil 4 mit dem Entwickler an echten Handys und dem Laptop prüfen, dann Status dieses Plans auf
  `abgeschlossen`.
