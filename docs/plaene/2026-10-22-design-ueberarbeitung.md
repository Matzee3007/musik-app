---
titel: "Plan: Design überarbeiten und Tisch bedienen"
status: aktiv
erstellt: 2026-10-22
tags: [plan, oberflaeche, design, phase-4]
---

# Plan: Design überarbeiten und Tisch bedienen

**Ziel:** Der Tisch wirkt seriöser und dunkler, das Rad ist schlicht und deutlich größer, die Auflösung hat einen
eigenen Abschnitt, die Kulisse lässt sich einklappen. Dazu zwei Bedienwünsche: Song anhalten und Rückfrage vor
„Raum schließen“.

**Vorgehen:** Drei PRs nacheinander. Erst die Bedienung (klein, unabhängig vom Aussehen), dann Farben, Schrift und
Rad, dann der Aufbau der Bühne. Teil 2 und 3 sind gestapelt: Vor dem Merge von Teil 2 zuerst Teil 3 auf `main`
umstellen ([[Lernjournal Phase 4 - Design Spielshow|Journal]], Fehler mit `--delete-branch`).

**Technik:** wie [[2026-10-22-design-spielshow|Plan Design Spielshow]]: Tailwind v4 `@theme`, `next/font/google`,
Vitest mit Testing Library, Playwright. Keine neuen Pakete.

**Anforderung:** Rückmeldung des Entwicklers vom 2026-10-22 nach dem ersten Design, Entscheidungen in der Fragerunde:
Anthrazit mit Messing, Birnen weg und schlichter Ring, „Anhalten“ immer wenn der Song läuft, eingeklappt bleibt eine
schmale Leiste mit Code und Spielern.

## Annahmen (bitte prüfen)

- **Schrift für Schilder:** Bungee wirkt verspielt. Statt ihr `Barlow Condensed` (600, 700) für Code, Kategorie, Lösung
  und „Bingo!“, dieselbe Familie wie der Text, nur schmal. Ruhiger, bleibt aber gut lesbar aus der Entfernung.
- **Token-Namen** nach Rolle statt nach Bild, weil die Bilder nicht mehr passen: `nacht` → `grund`, `boden` →
  `flaeche`, `birne` → `akzent`. `licht` und `signal` bleiben.
- **Einklappen** merkt sich die App nicht über ein Neuladen hinaus (kein `localStorage`), Standard ist aufgeklappt.
- **Rückfrage** mit `window.confirm`, wie schon bei „Abhaken zurücknehmen?“.
- Das Handy bekommt nur die neuen Farben und die neue Schrift, sonst bleibt es wie es ist.

## Feste Vorgaben

- Alle Vorgaben aus [[2026-10-22-design-spielshow|Plan Design Spielshow]] gelten weiter (Texte und Rollen bleiben,
  Farben nur über Tokens, `Knopf` für Knöpfe, Fokus sichtbar, `npm run check` vor jedem Commit, `npm run e2e` vor
  jedem PR, Dev-Server nach Änderungen an `app/globals.css` neu starten).
- Neue Texte: Knopf „Anhalten“, Rückfrage „Willst du den Raum wirklich schließen?“, Knöpfe „QR-Code ausblenden“ und
  „QR-Code zeigen“.
- Branches: `feat/tisch-bedienung`, `feat/design-serioes`, `feat/buehne-gross`.

## Prüf-Schwerpunkte

1. Nach „Anhalten“ lässt sich der Song mit „Weiterhören“ fortsetzen, vor und nach der Auflösung (Aufgabe 1, Vitest).
2. „Raum schließen“ und dann „Abbrechen“: Der Raum bleibt offen, kein Handy erfährt etwas (Aufgabe 2, Vitest).
3. Das große Rad und die Auflösung passen auf 1280×800 ohne Scrollen, auch mit aufgeklappter Kulisse und bei Bingo
   (Aufgabe 5, e2e).
4. Eingeklappt sind Raum-Code und Spielerstände weiter sichtbar, nur der QR-Code fehlt (Aufgabe 4, Vitest).
5. Die Bots in `e2e/` schließen den Raum weiter: Sie müssen die Rückfrage bestätigen (Aufgabe 2, e2e).

## Teil 1: Bedienung (`feat/tisch-bedienung`)

### Aufgabe 1: Song anhalten

**Dateien:**
- Ändern: `app/ui/spiel-ansicht.tsx`, `app/ui/tisch.tsx`
- Test: `__tests__/ui/spiel-musik.test.tsx`

**Schnittstellen:**
- Liefert: `function anhalten()` in `spiel-ansicht.tsx`: Zeitgeber löschen, `abspieler.pausieren()`, Zustand
  `{ ...musik, laeuft: false, vorbei: true }`. `loesungZeigen()` nutzt sie für das Pausieren beim Aufdecken.
- `Tisch`-Prop `musik` bekommt `onAnhalten: () => void`.
- Anzeige: Läuft der Song (`musik.laeuft`), steht „Anhalten“ (`neben`) vor „Lösung anzeigen“ bzw. in der Auflösung
  allein. Steht er, erscheint wie bisher „Nochmal“/„Weiterhören“ bzw. „Weiterhören“.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
test("Anhalten pausiert den Song, Weiterhören setzt ihn fort", async () => {
  // Rad drehen und stehen lassen wie in den übrigen Tests der Datei
  klick("Anhalten");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Weiterhören" })).toBeDefined();
  klick("Weiterhören");
  expect(abspieler.fortsetzen).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Anhalten" })).toBeDefined();
});

test("nach der Auflösung lässt sich der weiterlaufende Song anhalten", async () => {
  // Rad drehen, Lösung anzeigen, Weiterhören
  klick("Anhalten");
  expect(screen.getByRole("button", { name: "Weiterhören" })).toBeDefined();
});
```

- [x] **Schritt 2:** `npx vitest run __tests__/ui/spiel-musik.test.tsx`, erwartet FAIL (kein Knopf „Anhalten“).
- [x] **Schritt 3:** `anhalten()` und Knopf nach der Schnittstelle.
- [x] **Schritt 4:** `npm run check`, erwartet Exit 0.
- [x] **Schritt 5:** Committen: `Add pause button at the table`.

### Aufgabe 2: Rückfrage vor „Raum schließen“

**Dateien:**
- Ändern: `app/ui/raum-kopf.tsx`, `e2e/raum.spec.ts`, `e2e/spieleabend.spec.ts`
- Test: `__tests__/ui/raum-kopf.test.tsx`

**Schnittstellen:**
- `schliessen()` fragt zuerst `window.confirm("Willst du den Raum wirklich schließen?")`, bei Nein passiert nichts.

- [x] **Schritt 1: Fehlschlagender Test**

```tsx
test("Raum schließen fragt nach, Abbrechen lässt den Raum offen", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  // RaumKopf wie in den übrigen Tests
  fireEvent.click(screen.getByRole("button", { name: "Raum schließen" }));
  expect(window.confirm).toHaveBeenCalledWith("Willst du den Raum wirklich schließen?");
  // Kanal hat nichts gesendet, onGeschlossen nicht aufgerufen, Raum noch gespeichert
});
```

Die drei vorhandenen Tests zu „Raum schließen“ bekommen `vi.spyOn(window, "confirm").mockReturnValue(true)`.

- [x] **Schritt 2:** `npx vitest run __tests__/ui/raum-kopf.test.tsx`, erwartet FAIL (`confirm` nicht aufgerufen).
- [x] **Schritt 3:** Rückfrage in `schliessen()`. In den e2e-Tests vor dem Klick
  `seite.once("dialog", (d) => d.accept())`.
- [x] **Schritt 4:** `npm run check && npm run e2e`, erwartet beides grün.
- [x] **Schritt 5:** Committen: `Ask before closing the room`, PR.

## Teil 2: Farben, Schrift, Rad (`feat/design-serioes`)

### Aufgabe 3: Anthrazit und Messing, schlichtes Rad

**Dateien:**
- Ändern: `app/globals.css`, `app/layout.tsx`, `lib/kategorien.ts`, alle Dateien in `app/` mit Token-Klassen
- Löschen: `app/ui/birnenkranz.tsx`, Birnen-CSS in `globals.css`
- Test: `__tests__/ui/spiel-ansicht.test.tsx` (Test „Birnenkranz läuft …“ entfällt mit dem Kranz),
  `e2e/design.spec.ts` (Test „bei „Bewegung reduzieren“ läuft kein Lauflicht“ entfällt)

**Farben:**

| Token | Hex | Rolle |
|---|---|---|
| `grund` | `#16171B` | Hintergrund, Anthrazit |
| `flaeche` | `#23252B` | Flächen, Felder, Eingaben |
| `akzent` | `#C9A45C` | Messing: Hauptknöpfe, Zeiger, Rand des Rads, Bingo |
| `licht` | `#ECE8E1` | Schrift, etwas gedämpfter als bisher |
| `signal` | `#E0645C` | Fehler, „Raum schließen“ |

Kategorien gedeckter, Schrift darauf in `grund`: Titel `#6FA8DC`, Interpret `#D27BA0`, Jahrzehnt `#E0955A`,
Jahr `#6DBE9C`, Jahr ±3 `#9D8BD8`.

- [x] **Schritt 1:** Tokens umbenennen und Werte setzen (`grep -rl` über `app/`, dann ersetzen), `Bungee` durch
  `Barlow_Condensed({ weight: ["600", "700"], variable: "--font-schild-familie" })`, `--font-schild` darauf.
- [x] **Schritt 2:** Rad: Birnenkranz und Birnen-CSS entfernen, Rahmen als feiner Ring `ring-2 ring-akzent/60` um
  die Scheibe, Trennlinien `stroke-grund`, Schrift auf dem Rad `font-schild` in `grund`.
- [x] **Schritt 3:** `npm run check && npm run e2e`, erwartet grün. Server vorher neu starten.
- [x] **Schritt 4:** Screenshots Start, Tisch, Handy (1280×800, 393, 360). Kein Rest von `nacht`, `boden`, `birne`:
  `grep -rnE "nacht|boden|birne" app` ohne Treffer.
- [x] **Schritt 5:** Committen: `Switch to anthracite and brass, plain wheel`, PR auf `feat/tisch-bedienung` oder
  `main`, je nachdem, ob Teil 1 schon gemergt ist.

## Teil 3: Große Bühne (`feat/buehne-gross`)

### Aufgabe 4: Kulisse einklappen

**Dateien:**
- Ändern: `app/ui/raum-kopf.tsx`, `app/ui/start.tsx`
- Test: `__tests__/ui/raum-kopf.test.tsx`

**Schnittstellen:**
- `RaumKopf` hält `const [qrSichtbar, setQrSichtbar] = useState(true)`. Textknopf „QR-Code ausblenden“ / „QR-Code
  zeigen“. Aufgeklappt `w-64`, eingeklappt `w-40` ohne QR-Code, Code kleiner (`text-3xl`).
- `start.tsx`: Raster `lg:grid-cols-[auto_1fr]`, damit die Breite der Kulisse den Platz bestimmt.

- [ ] **Schritt 1: Fehlschlagender Test**

```tsx
test("QR-Code lässt sich ausblenden, Code und Spieler bleiben", async () => {
  // RaumKopf wie in den übrigen Tests
  fireEvent.click(screen.getByRole("button", { name: "QR-Code ausblenden" }));
  expect(screen.queryByTitle(/QR-Code für Raum/)).toBeNull();
  expect(screen.getByText(code)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "QR-Code zeigen" }));
  expect(screen.getByTitle(/QR-Code für Raum/)).toBeDefined();
});
```

- [ ] **Schritt 2:** `npx vitest run __tests__/ui/raum-kopf.test.tsx`, erwartet FAIL.
- [ ] **Schritt 3:** Umsetzen nach der Schnittstelle.
- [ ] **Schritt 4:** `npm run check`, erwartet Exit 0.
- [ ] **Schritt 5:** Committen: `Let the side panel hide the QR code`.

### Aufgabe 5: Großes Rad und Abschnitt für die Auflösung

**Dateien:**
- Ändern: `app/ui/tisch.tsx`
- Test: `e2e/design.spec.ts`

**Schnittstellen:**
- Rad-Rahmen `w-[min(34rem,68vh,42vw)]`: so groß, wie Höhe und Breite erlauben (bei 1280×800 rund 535 px).
- Rechts ein eigener Abschnitt `<section aria-label="Auflösung">` als Fläche `bg-flaeche rounded-xl p-6`, Breite
  `w-[24rem]`: Runde, Kategorie, Musik und Knöpfe vor der Auflösung; danach Lösung `text-4xl`, Cover `size-56`,
  Angaben `text-lg`. „Bingo!“ und „Neues Spiel“ stehen ebenfalls in diesem Abschnitt, nicht mehr über der Bühne.

- [ ] **Schritt 1: Fehlschlagender Test** in `e2e/design.spec.ts`, im Test „Tisch passt …“ zusätzlich:

```ts
const rad = await seite.getByRole("img", { name: "Rad" }).boundingBox();
expect(rad!.width).toBeGreaterThanOrEqual(480);
expect(await seite.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
```

- [ ] **Schritt 2:** `npx playwright test e2e/design.spec.ts --project=chromium`, erwartet FAIL (Rad rund 330 px).
- [ ] **Schritt 3:** Umsetzen nach der Schnittstelle.
- [ ] **Schritt 4:** `npm run check && npm run e2e`, erwartet grün.
- [ ] **Schritt 5:** Screenshots: Runde, Auflösung, Bingo, eingeklappt, jeweils 1280×800; schmal 393 px.
- [ ] **Schritt 6:** Committen: `Enlarge the wheel and give the solution its own section`, PR.

## Abschluss

- `plan-pruefer` und `/code-review` über alle drei Teile, Funde mit dem Entwickler durchgehen.
- Vor jedem Merge `gh pr view <nr> --json mergeable` bis `MERGEABLE`, gestapelte PRs vorher auf `main` umstellen.
