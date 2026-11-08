---
titel: "Plan: Startseite „Bühne“ und Playlist-Raster"
status: aktiv
erstellt: 2026-11-08
tags: [plan, oberflaeche, design, phase-4]
---

# Plan: Startseite „Bühne“ und Playlist-Raster

**Ziel:** Die Startseite vor dem Raum und die Playlist-Auswahl sehen aus wie Variante B „Bühne“ aus dem Mock: Kopf mit
Logo, Plakat-Schlagzeile und Rad-Ring, darunter ein Band „Mitspielen“. Die Playlists stehen als Raster mit Cover.

**Vorgehen:** Zwei neue Ansichten lösen den Code aus `app/ui/start.tsx` heraus: `Buehne` (Raumwahl) und
`PlaylistAuswahl`. Abläufe und Reihenfolge (erst Raum, dann Spotify, dann Playlist) bleiben gleich. Damit es Cover gibt,
liest `eigenePlaylists` zusätzlich das Bild der Playlist aus. Der Tisch, die Raum-Schublade (`RaumKopf`) und das Handy
bleiben unverändert.

**Technik:** Tailwind v4 mit den Farbtokens aus `app/globals.css`, Vitest mit Testing Library, Playwright. Keine neuen
Pakete.

**Anforderung:** Gespräch vom 2026-11-08, Mock Variante B (`scratchpad/mock-start/index.html`, Abschnitt
„Variante B: Bühne“). Vorgänger: [[2026-10-22-design-ueberarbeitung|Plan Design überarbeiten]].

## Feste Vorgaben

- Farben bleiben „Anthrazit und Messing“: `grund`, `flaeche`, `akzent`, `licht`, `signal`. Neue Abstufungen nur als
  Deckkraft (`licht/70`, `akzent/40` …), keine neuen Tokens.
- Schriften bleiben Barlow (Text) und Barlow Condensed (`font-schild` für Logo, Schlagzeile, Titel, Raum-Code).
- Knöpfe nur über `app/ui/knopf.tsx` (`haupt`, `neben`).
- Texte aus dem Mock: „Dreh das Rad. Erkenn den Song.“, Unterzeile „Musik-Bingo für den Abend mit Freunden. Du bist der
  DJ und spielst die Songs aus deinem Spotify.“, Knöpfe „Am Tisch spielen“ (ersetzt „Lokal spielen“) mit „Alle in
  einem Raum, der Laptop spielt den Ton.“ und „Online spielen“ mit „Jeder bei sich, du teilst den Ton über den
  Browser.“, Band „Mitspielen“ mit „Code vom DJ eingeben, ohne Konto.“, Titel „Playlist wählen“.
- Nicht aus dem Mock übernommen: Link „So wird gespielt“ (hat keinen Inhalt) und der Hinweis „Ab 25 Songs reicht es für
  eine ganze Karte“: Die 25 Felder der Karte sind Kategorien, keine Songs (`lib/karte.ts`), die Grenze stimmt also nicht.
- Cover als `<img>` wie in `app/ui/tisch.tsx:194`, nicht `next/image` (bräuchte Freigabe der Spotify-Adressen).
- Laptop 1440 px und Handy 390 px ohne seitliches Scrollen, sichtbarer Tastaturfokus (`outline-akzent`).

## Prüf-Schwerpunkte

1. Playlist ohne Bild (Spotify liefert `images: null` oder `[]`): Kachel zeigt eine Platzhalterfläche mit dem ersten
   Buchstaben, kein kaputtes Bild. → Aufgabe 1 und 3
2. Keine eigene Playlist mit Songs: statt leerer Fläche ein Hinweis, was zu tun ist. → Aufgabe 3
3. Ohne Supabase (Vorschauen auf Vercel): Raum-Knöpfe und Code-Feld aus, Hinweis sichtbar, Demo geht weiter. → Aufgabe 2
4. Langer Playlist-Name: bricht in der Kachel höchstens zweizeilig um und schiebt das Raster nicht breiter. → Aufgabe 4
5. Tisch im Spiel passt weiter ohne Scrollen auf den Laptop (die Überschrift „Musik-Bingo“ zieht um). → Aufgabe 4

## Dateien

| Datei | Zuständig für |
|---|---|
| Ändern `lib/spotify/playlists.ts` | `Playlist` bekommt `cover: string \| null` |
| Neu `app/ui/buehne.tsx` | Startseite vor dem Raum: Kopf mit Logo, Schlagzeile, Ring, zwei Wege, Namensfeld, Band „Mitspielen“ |
| Neu `app/ui/playlist-auswahl.tsx` | Raster der Playlists, leerer Zustand, Fuß mit Demo und Abmelden |
| Ändern `app/ui/start.tsx` | nutzt beide Ansichten, Zustände `djEingabe`/`codeEingabe` ziehen in `Buehne` |
| Ändern `app/page.tsx` | `main` ohne Zentrierung und Überschrift, beides wandert in `start.tsx` (Zustände im Raum) |
| Tests | `__tests__/lib/spotify/playlists.test.ts`, neu `__tests__/ui/buehne.test.tsx`, neu `__tests__/ui/playlist-auswahl.test.tsx`, `__tests__/ui/start.test.tsx`, `__tests__/page.test.tsx`, `e2e/hilfen/raum.ts` und vier `e2e/*.spec.ts` (Knopftext) |

## Aufgaben

### Aufgabe 1: Cover der Playlist lesen

**Dateien:** Ändern `lib/spotify/playlists.ts`, Test `__tests__/lib/spotify/playlists.test.ts`

**Schnittstellen:**
- Liefert: `type Playlist = { id: string; name: string; anzahlSongs: number; cover: string | null }`

- [ ] **Schritt 1: Tests anpassen und ergänzen.** Bestehende Erwartungen bekommen `cover: null`. Neu:

```ts
test("eigenePlaylists liefert das erste Bild als Cover, ohne Bild null", async () => {
  const abruf = spotify(
    seite(
      [
        { ...eigene("p1", 30), images: [{ url: "https://i.scdn.co/a" }] },
        { ...eigene("p2", 30), images: null },
      ],
      null,
    ),
  );
  expect((await eigenePlaylists("a1", abruf)).map((p) => p.cover)).toEqual([
    "https://i.scdn.co/a",
    null,
  ]);
});
```

- [ ] **Schritt 2:** `npx vitest run __tests__/lib/spotify/playlists.test.ts` → FAIL (`cover` fehlt)
- [ ] **Schritt 3:** `PlaylistSeite.items[]` um `images?: { url: string }[] | null` ergänzen, `cover: p.images?.[0]?.url ?? null`
- [ ] **Schritt 4:** derselbe Befehl → PASS. `npm run typecheck` zeigt, wo `Playlist` sonst gebaut wird (Testdaten), dort `cover: null` ergänzen.
- [ ] **Schritt 5:** `npm run check`, dann `git commit -m "Read playlist cover from Spotify"`

### Aufgabe 2: Ansicht `Buehne`

**Dateien:** Neu `app/ui/buehne.tsx`, Test `__tests__/ui/buehne.test.tsx`

**Schnittstellen:**
- Liefert: `export default function Buehne(props: { supabase: boolean; onTisch: () => void; onOnline: (dj: string) => void; onBeitreten: (code: string) => void })`
- Nutzt: `nameLesen` (`lib/raum/spieler`), `raumCodeLesen` (`lib/raum/code`), `Knopf`

- [ ] **Schritt 1: Tests schreiben** (`__tests__/ui/buehne.test.tsx`):
  - `"zeigt Schlagzeile als h1 und das Logo"`: `getByRole("heading", { level: 1, name: "Dreh das Rad. Erkenn den Song." })`, Text „Musik-Bingo“ vorhanden.
  - `"Am Tisch spielen ruft onTisch"`
  - `"Online spielen fragt nach dem Namen, Online-Raum eröffnen ruft onOnline mit dem Namen"`: Knopf „Online-Raum eröffnen“ erst aus, nach Eingabe „Sam“ an, Klick → `onOnline("Sam")`.
  - `"Beitreten ist erst mit gültigem Code an und ruft onBeitreten"`: Feld `getByLabelText("Raum-Code")`, Eingabe „eh mf“ → Klick „Beitreten“ → `onBeitreten("EHMF")` (Wert so, wie `raumCodeLesen` ihn liefert).
  - `"ohne Supabase sind Raum-Knöpfe und Code-Feld aus, ein Hinweis erklärt warum"`: Text „Supabase ist hier nicht eingerichtet, nur die Demo ohne Raum.“
- [ ] **Schritt 2:** `npx vitest run __tests__/ui/buehne.test.tsx` → FAIL (Modul fehlt)
- [ ] **Schritt 3: `Buehne` bauen.** Aufbau nach Mock (`.b-held`, `.b-band`): `section` mit `relative overflow-hidden` und
  radialem Verlauf (`bg-[radial-gradient(ellipse_at_80%_40%,#2a2620_0,var(--color-grund)_60%)]`), darin `header`
  (Logo: kleiner Ring + „Musik-Bingo“ in `font-schild`), Ring als `div aria-hidden` mit `conic-gradient` und `mask`
  (Werte aus dem Mock, Farben über `var(--color-…)`), Zeiger nur ab `sm`. Text linksbündig, `h1` mit zweiter Zeile
  in `text-akzent`, zwei Wege im Raster `sm:grid-cols-2`, Namensfeld (Label „Dein Name“) unter den Wegen, sobald
  „Online spielen“ gewählt ist. Danach `section` „Mitspielen“ auf `bg-flaeche`, Code-Feld mit `aria-label="Raum-Code"`
  im Anzeigetafel-Stil wie heute. Handy: Werte aus `@container (max-width: 700px)` des Mocks als Breakpoint `max-sm`/`sm`.
- [ ] **Schritt 4:** derselbe Befehl → PASS
- [ ] **Schritt 5:** `npm run check`, dann `git commit -m "Add stage view for the start page"`

### Aufgabe 3: Ansicht `PlaylistAuswahl`

**Dateien:** Neu `app/ui/playlist-auswahl.tsx`, Test `__tests__/ui/playlist-auswahl.test.tsx`

**Schnittstellen:**
- Nutzt: `Playlist` aus Aufgabe 1
- Liefert: `export default function PlaylistAuswahl(props: { playlists: Playlist[]; geladen: boolean; hinweis?: React.ReactNode; onWaehlen: (p: Playlist) => void; onDemo: () => void; onAbmelden: () => void })`

- [ ] **Schritt 1: Tests schreiben:**
  - `"zeigt Titel und je Playlist eine Kachel mit Name und Anzahl"`: `heading` „Playlist wählen“, Knopf mit Namen `/Partyhits/` enthält „98 Songs“.
  - `"Kachel mit Cover zeigt das Bild, ohne Cover den ersten Buchstaben"`: `img` mit `src` des Covers und `alt=""`; ohne Cover kein `img`, Text „P“.
  - `"Klick auf eine Kachel ruft onWaehlen mit der Playlist"`
  - `"geladen ohne Playlists: Hinweis statt leerem Raster"`: Text „Du hast noch keine eigene Playlist mit Songs. Leg in Spotify eine an und lade die Seite neu.“; mit `geladen={false}` kein Hinweis.
  - `"Demo starten und Abmelden rufen ihre Handler"`
- [ ] **Schritt 2:** `npx vitest run __tests__/ui/playlist-auswahl.test.tsx` → FAIL
- [ ] **Schritt 3: `PlaylistAuswahl` bauen.** Nach Mock (`.b-pl-main`): linksbündig, `max-w-7xl`, Titel `font-schild`,
  Raster `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, Kachel als `button` (quadratisches Cover `aspect-square
  rounded-md object-cover`, Name `font-semibold line-clamp-2`, Anzahl `text-licht/70`). Platzhalter: Fläche in
  `bg-flaeche` mit erstem Buchstaben in `font-schild`. Fuß mit Trennlinie: „Demo starten“ und „Abmelden“ (beide `neben`).
- [ ] **Schritt 4:** derselbe Befehl → PASS
- [ ] **Schritt 5:** `npm run check`, dann `git commit -m "Add playlist grid with covers"`

### Aufgabe 4: Ansichten in Startseite einbauen

**Dateien:** Ändern `app/ui/start.tsx`, `app/page.tsx`, Tests `__tests__/ui/start.test.tsx`, `__tests__/page.test.tsx`,
`e2e/hilfen/raum.ts`, `e2e/raum.spec.ts`, `e2e/spiel.spec.ts`, `e2e/wiederkommen.spec.ts`, `e2e/zwei-runden.spec.ts`

**Schnittstellen:**
- Nutzt: `Buehne` (Aufgabe 2), `PlaylistAuswahl` (Aufgabe 3)

- [ ] **Schritt 1: Tests anpassen:** „Lokal spielen“ → „Am Tisch spielen“ (Unit und e2e), Überschrift „Deine Playlists“
  → „Playlist wählen“, „Partyhits (98 Songs)“ → Knopf `/Partyhits/` mit „98 Songs“. `page.test.tsx`: `h1` heißt jetzt
  „Dreh das Rad. Erkenn den Song.“ (ohne Supabase zeigt die Seite Bühne und darunter den Ablauf).
- [ ] **Schritt 2:** `npm test` → FAIL bei den geänderten Erwartungen
- [ ] **Schritt 3: Umbauen.** `raumWahl` wird `<Buehne supabase={supabase} onTisch={() => eroeffnen()} onOnline={eroeffnen}
  onBeitreten={(c) => router.push(`/raum/${c}`)} />`, `djEingabe`/`codeEingabe` entfallen in `start.tsx`. Ohne Supabase:
  Bühne volle Breite, darunter der Ablauf zentriert. Im Raum: die bisherige Hülle `flex flex-1 flex-col items-center
  justify-center gap-8 p-8 text-center` mit `h1` „Musik-Bingo“ aus `page.tsx` steht jetzt in `start.tsx`, damit Tisch und
  Vorbereiten genau so aussehen wie heute. `page.tsx`: `<main className="flex flex-1 flex-col"><Start /></main>`.
  Playlists über `<PlaylistAuswahl>`, `geladen` wird wahr, sobald `eigenePlaylists` geantwortet hat.
- [ ] **Schritt 4:** `npm test` → PASS
- [ ] **Schritt 5: Im Browser prüfen.** `npm run dev`, Screenshots bei 1440 und 390 px von Bühne und Playlist-Auswahl
  (mit Spotify-Anmeldung lokal), neben den Mock legen. `npm run e2e` (braucht Supabase, vorher prüfen, ob es pausiert)
  → alle grün, besonders `design.spec.ts`.
- [ ] **Schritt 6:** `npm run check`, dann `git commit -m "Use stage and playlist grid on the start page"`

## Abschluss

- Agent `plan-pruefer` gegen diesen Plan, `/code-review`, PR mit Vorschau. Die Vorschau zeigt nur die Bühne ohne
  Supabase und die Demo, die Playlists nur lokal oder in Production.
