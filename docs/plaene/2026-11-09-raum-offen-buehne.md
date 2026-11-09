---
titel: "Plan: Schritt „Raum offen“ im Stil der Bühne"
status: aktiv
erstellt: 2026-11-09
tags: [plan, oberflaeche, design, phase-4]
---

# Plan: Schritt „Raum offen“ im Stil der Bühne

**Ziel:** Der Bildschirm zwischen Bühne und Playlist-Auswahl, also der DJ hat einen Raum eröffnet, ist aber noch nicht
bei Spotify angemeldet, sieht aus wie die Bühne (Variante A „Bühne mit Raum“).

**Vorgehen:** Eine neue Ansicht `RaumOffen` übernimmt Kopf, Verlauf und Rad-Ring der Bühne. Die Raum-Schublade
(`RaumKopf`) und „Ton teilen“ bekommt sie als fertige Elemente aus `start.tsx` und ändert sie nicht. Der Ablauf bleibt
gleich: Der Raum wird weiter gemerkt, Raum → Spotify → Playlist. Nur der Zweig „im Raum, ohne Token, ohne Demo“ in
`start.tsx` zeigt die neue Ansicht statt der alten Hülle mit der Überschrift „Musik-Bingo“.

**Technik:** Tailwind v4 mit den Farbtokens aus `app/globals.css`, Vitest mit Testing Library, Playwright. Keine neuen
Pakete.

**Anforderung:** Gespräch vom 2026-11-09: Wer schon einmal einen Raum eröffnet hat, landet beim Öffnen der App direkt in
diesem Schritt und sieht die Bühne gar nicht. Der Schritt wirkte deshalb wie „Startseite nicht geändert“. Gewählt:
Variante A aus dem Mock `scratchpad/mock-raum-anmelden/index.html` (Session 2026-11-09). Vorgänger:
[[2026-11-08-startseite-buehne|Plan: Startseite „Bühne“ und Playlist-Raster]].

## Feste Vorgaben

- Alle festen Vorgaben aus [[2026-11-08-startseite-buehne|Plan Bühne]] gelten weiter: Farbtokens, Schriften, Knöpfe nur
  über `app/ui/knopf.tsx`, Cover und Dekoration wie dort.
- Die Messing-Hexwerte bleiben nur in `app/ui/buehne.tsx`. `RaumOffen` holt sich Ring und Logo von dort (Exporte
  `ring` und `Logo`), statt sie zu kopieren.
- `RaumKopf` und `TonTeilen` bleiben unverändert und werden nur anders platziert.
- Texte aus dem Mock: Schlagzeile „Raum {code} ist offen.“ mit zweiter Zeile „Verbinde die Musik.“ in `text-akzent`.
  Darunter der Absatz „Deine Mitspieler können jetzt beitreten. Melde dich bei Spotify an, dann spielst du die Songs aus
  deinen eigenen Playlists.“ Knöpfe „Mit Spotify anmelden“ (haupt) mit „Nur du brauchst ein Konto, deine Mitspieler
  nicht.“ und „Demo starten“ (neben) mit „Mit Beispielsongs, ganz ohne Spotify.“ Band „So kommen die anderen rein“: am
  Tisch „QR-Code scannen oder {adresse} öffnen und {code} eingeben.“, online „Link schicken: {adresse}/raum/{code}“.
- Laptop (ab `lg`): Schublade links (Spalte `w-64`), Text rechts daneben, Ring rechts wie auf der Bühne. Handy: zuerst
  der Text, darunter die Schublade, Ring blass (wie die Bühne am Handy).
- „Ton teilen“ (nur Online-Raum) steht rechts im Kopf.
- 1440 px und 390 px ohne seitliches Scrollen, sichtbarer Tastaturfokus (`outline-akzent`).

## Prüf-Schwerpunkte

1. Gemerkter Raum nach dem Neuladen: Es erscheint wieder „Raum … ist offen“ mit der Schublade, nicht die Bühne und
   nicht die alte Hülle. → Aufgabe 2
2. Ohne Spotify-Client-ID im Raum: „Mit Spotify anmelden“ ist aus, der bekannte Hinweis „Spotify ist hier nicht
   eingerichtet …“ steht da, die Demo geht. → Aufgabe 1 (Hinweis wird gezeigt) und Aufgabe 2
3. Spotify nicht erreichbar im Raum: Der Hinweis „Spotify ist gerade nicht erreichbar …“ steht in der Ansicht. →
   Aufgabe 1 (Hinweis) und Aufgabe 2 (bestehender Test „ohne Netz …“ bleibt grün)
4. Online-Raum: „Ton teilen“ bleibt da und bedienbar, im lokalen Raum fehlt es. → Aufgabe 2 (bestehender Test „im
   Online-Raum gibt es Ton teilen, im lokalen nicht“)
5. Schublade ausgeblendet („Raum ausblenden“) und eingeblendet: Bei 1440 und 390 px kein seitliches Scrollen, nichts
   überdeckt die Knöpfe. → Aufgabe 3

Reifegrad: Gemerkte Räume (`musik-app:tisch-raum` im localStorage) bleiben im selben Format, es ändert sich nur die
Darstellung. Nach dem Anmelden, im Vorbereiten und am Tisch bleibt alles wie heute.

## Fremde Dienste

keine (Spotify und Supabase nur über den bestehenden Code, unverändert)

## Dateien

| Datei | Zuständig für |
|---|---|
| Ändern `app/ui/buehne.tsx` | exportiert `ring` und `Logo` (Ring und Schriftzug im Kopf), sonst unverändert |
| Neu `app/ui/raum-offen.tsx` | Ansicht „Raum offen, noch nicht angemeldet“ |
| Ändern `app/ui/start.tsx` | Zweig im Raum ohne Token und ohne Demo zeigt `RaumOffen` |
| Tests | neu `__tests__/ui/raum-offen.test.tsx`, `__tests__/ui/start.test.tsx`, `e2e/design.spec.ts` |

## Aufgaben

### Aufgabe 1: Ansicht `RaumOffen`

**Dateien:**
- Ändern: `app/ui/buehne.tsx` (Export von `ring`, neue Komponente `Logo` aus dem bisherigen Kopf-Inhalt)
- Neu: `app/ui/raum-offen.tsx`
- Test: `__tests__/ui/raum-offen.test.tsx`

**Schnittstellen:**
- Liefert: `export const ring: React.CSSProperties` und `export function Logo()` in `app/ui/buehne.tsx`
- Liefert:
  `export default function RaumOffen(props: { code: string; online: boolean; adresse: string; schublade: React.ReactNode; tonTeilen?: React.ReactNode; anmeldenAus: boolean; hinweis?: React.ReactNode; onAnmelden: () => void; onDemo: () => void })`

- [x] **Schritt 1: Tests schreiben** (`__tests__/ui/raum-offen.test.tsx`, Grundwerte `code="EHMF"`,
  `adresse="musik-bingo.vercel.app"`, `schublade={<p>Schublade</p>}`):
  - `"zeigt die Schlagzeile mit dem Code als h1 und das Logo"`:
    `getByRole("heading", { level: 1, name: "Raum EHMF ist offen. Verbinde die Musik." })`, Text „Musik-Bingo“.
  - `"Mit Spotify anmelden und Demo starten rufen ihre Handler"`
  - `"anmeldenAus schaltet nur Anmelden aus, der Hinweis steht da"`: mit `anmeldenAus` und
    `hinweis={<p>Spotify ist hier nicht eingerichtet</p>}` ist der Knopf `disabled`, „Demo starten“ nicht, der Text ist da.
  - `"am Tisch erklärt das Band QR-Code und Adresse, online den Link"`: `online={false}` → Text
    „QR-Code scannen oder musik-bingo.vercel.app öffnen und EHMF eingeben.“; `online` → „Link schicken:
    musik-bingo.vercel.app/raum/EHMF“.
  - `"zeigt Schublade und Ton teilen, ohne tonTeilen keinen Platzhalter"`: „Schublade“ da; mit
    `tonTeilen={<button>Ton teilen</button>}` Knopf da, ohne kein Knopf „Ton teilen“.
- [x] **Schritt 2:** `npx vitest run __tests__/ui/raum-offen.test.tsx` → FAIL (Modul fehlt)
- [x] **Schritt 3: `RaumOffen` bauen.** Hülle wie die `section` der Bühne (gleicher Verlauf, `flex-1`, Ring mit den
  Klassen der Bühne, Zeiger ab `xl`). Kopf: `Logo` links, `tonTeilen` rechts (`ml-auto`). Inhalt: Raster
  `lg:grid-cols-[256px_minmax(0,600px)] lg:gap-16`, links `div relative` mit `schublade`, rechts Text mit `h1` (`font-schild`,
  `text-[42px] sm:text-[76px]`), Absatz, zwei Wege wie auf der Bühne (`sm:grid-cols-2`), darunter `hinweis`. Am Handy
  steht der Text vor der Schublade (`order-2` für die Schublade unterhalb `lg`). Danach das Band auf `bg-flaeche` mit
  `h2` „So kommen die anderen rein“ wie das Band „Mitspielen“ der Bühne. In `buehne.tsx` den Kopf auf `<Logo />`
  umstellen, `__tests__/ui/buehne.test.tsx` muss unverändert grün bleiben.
- [x] **Schritt 4:** `npx vitest run __tests__/ui/raum-offen.test.tsx __tests__/ui/buehne.test.tsx` → PASS
- [x] **Schritt 5:** `npm run check`, dann `git commit -m "Add room-open view in stage style"`

### Aufgabe 2: `RaumOffen` in die Startseite einbauen

**Dateien:**
- Ändern: `app/ui/start.tsx` (Rückgabe im Raum, ab dem Kommentar „Im Raum wie im Studio“)
- Test: `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: `RaumOffen` aus Aufgabe 1

- [x] **Schritt 1: Tests anpassen und ergänzen:**
  - `"Am Tisch spielen zeigt den Raum-Kopf, danach Demo und Anmelden"`: zusätzlich
    `getByRole("heading", { level: 1, name: /^Raum [A-Z]{4} ist offen\./ })`, keine Überschrift „Musik-Bingo“ als `h1`.
  - `"gespeicherter Raum ist nach dem Neuladen wieder da"`: zusätzlich die Überschrift „Raum … ist offen“.
  - Neu `"im Raum ohne Client-ID ist Anmelden aus, der Hinweis steht da, die Demo geht"`.
  - Neu `"im Raum nach dem Anmelden kommt die Playlist-Auswahl wie bisher"`: mit Token und gemerktem Raum gibt es
    `heading` „Playlist wählen“ und keine Überschrift „Raum … ist offen“.
- [x] **Schritt 2:** `npx vitest run __tests__/ui/start.test.tsx` → FAIL bei den neuen Erwartungen
- [x] **Schritt 3: Umbauen.** `RaumKopf` einmal als `const schublade = <RaumKopf … />` und `TonTeilen` als
  `tonTeilen` bauen. Im Raum gilt: ohne `token`, ohne `demo` → `<RaumOffen code={tischRaum.code}
  online={tischRaum.dj !== undefined} adresse={window.location.host} schublade={schublade} tonTeilen={…}
  anmeldenAus={!id} hinweis={…} onAnmelden={anmelden} onDemo={() => setDemo(true)} />`. Der Hinweis ist der bisherige
  Text ohne Client-ID bzw. `unerreichbarHinweis`. Dafür ziehen `anmelden` und `unerreichbarHinweis` aus `ablauf()` in
  den Rumpf von `Start`. Sonst bleibt die bisherige Hülle mit „Musik-Bingo“ für Playlists, Vorbereiten, Demo und Tisch.
- [x] **Schritt 4:** `npm test` → PASS
- [x] **Schritt 5:** `npm run check`, dann `git commit -m "Show room-open view before Spotify login"`

### Aufgabe 3: Im Browser prüfen

**Dateien:**
- Test: `e2e/design.spec.ts`

- [x] **Schritt 1: Test schreiben:** `"Raum offen bei 1440 und 390 px ohne seitliches Scrollen, Schublade ein und aus"`
  (je Breite): Raum über „Am Tisch spielen“ eröffnen, Überschrift „Raum … ist offen“ sichtbar,
  `document.documentElement.scrollWidth <= innerWidth`, „Mit Spotify anmelden“ sichtbar und nicht überdeckt
  (`toBeInViewport` und Klick-Probe `trial: true`), dasselbe nach „Raum ausblenden“.
- [x] **Schritt 2:** `npx playwright test e2e/design.spec.ts -g 'Raum offen'` → PASS (der Test prüft fertigen Code,
  rot heißt: Layout nachbessern)
- [x] **Schritt 3:** Screenshots bei 1440 und 390 px, je am Tisch und online, neben Variante A des Mocks legen. Dann
  `npm run e2e` → alle grün.
- [x] **Schritt 4:** `npm run check`, dann `git commit -m "Check room-open view in the browser"`

## Abschluss

- Agent `plan-pruefer` gegen diesen Plan, `/code-review`, PR mit Vorschau. Die Vorschau hat kein Supabase und zeigt den
  Schritt nicht. Abnahme lokal (`npm run dev`) oder nach dem Merge in Production.
