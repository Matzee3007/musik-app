---
titel: "Plan: Abspielen"
status: aktiv
erstellt: 2026-10-19
tags: [plan, spotify, web-playback-sdk, phase-2]
---

# Plan: Abspielen

**Ziel:** Am Tisch läuft zu jeder Runde der Song über Spotify, als Ausschnitt (Standard 30 Sekunden) oder ganz, mit
animierter Musikspur. Die Auflösung zeigt das Cover, und der DJ kann dort das Jahr korrigieren. Damit ist Phase 2
fertig.

**Vorgehen:** Das Web Playback SDK macht den Browser zu einem Spotify-Gerät. Seine Anbindung steckt hinter einer
kleinen Schnittstelle `Abspieler`, damit Tisch und Spiel mit einem nachgebauten Abspieler testbar bleiben. Den Song
startet die Web API (`PUT /me/player/play` auf das Gerät des Browsers). Ausschnitt, Musikspur und „Jahr korrigieren“
sind Erweiterungen der vorhandenen Ansichten, die Demo bleibt ohne Musik.

**Technik:** TypeScript, Next.js 16, Spotify Web Playback SDK (`https://sdk.scdn.co/spotify-player.js`, eigene
schmale Typen statt `@types/spotify-web-playback-sdk`), Vitest mit jsdom und `vi.useFakeTimers()`. Keine neuen Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 2 (Ausschnitt,
Musikspur, Korrigieren, Fertig-Kriterium); baut auf [[2026-10-19-spotify-anmeldung|Plan A]] und
[[2026-10-19-vorbereiten|Plan B]] auf.

## Entscheidungen der Session (2026-10-19)

- **Der Song startet, wenn das Rad steht**, nicht schon beim Klick auf „Rad drehen“. So zählen die 4 Sekunden Drehen
  nicht zum Ausschnitt. Den Ton erlaubt der Browser trotzdem, weil `activateElement()` schon beim Klick auf
  „Spiel starten“ läuft.
- **Kein Premium oder Player-Fehler:** Meldung über der Songliste, das Spiel geht trotzdem, nur ohne Musik.
- **Nachtrag aus Plan B:** „Zurück“ beendet ein laufendes Vorbereiten (Aufgabe 7).
- SDK am 2026-10-19 nachgelesen: Ereignisse `ready` (`device_id`), `account_error` (kein Premium),
  `initialization_error`, `authentication_error`; `activateElement()` muss aus einem Klick kommen.

## Annahmen (bitte prüfen)

- **Ausschnitt-Auswahl** über dem Tisch als Auswahlfeld „Ausschnitt: 15 / 30 / 45 / 60 Sekunden / ganzer Song“,
  Standard 30. Sie gilt ab dem nächsten Song und wird nicht gespeichert, ein neues Spiel beginnt wieder mit 30.
- **Am Ende des Ausschnitts** pausiert die Musik, die Musikspur steht still, der Tisch zeigt „Nochmal“ (Ausschnitt
  von vorn) und „Weiterhören“ (Song läuft ab der Stelle weiter, ohne neues Ende). „Lösung anzeigen“ hält die Musik
  nicht an, „Nächste Runde“ startet den nächsten Song, Bingo hält an.
- **Musikspur:** 5 Balken, die in der Farbe der Kategorie auf und ab springen, darunter ein Fortschrittsbalken über die
  Länge des Ausschnitts. Beim ganzen Song und nach „Weiterhören“ nur die Balken.
- **Cover:** das größte Bild des Albums (`album.images[0]`), in der Auflösung neben Titel und Interpret.
- **Jahr korrigieren:** Knopf in der Auflösung, öffnet ein Zahlenfeld mit „Speichern“, gültig wie in der Songliste
  (`gueltigesJahr`). Die Auflösung zeigt sofort das neue Jahr, gespeichert wird wie in der Songliste.
- **Name des Geräts** in Spotify: „Musik-App Tisch“.

## Feste Vorgaben

- Spiellogik in `lib/` bleibt rein: `jahrKorrigieren` ist eine reine Funktion, die Ausschnitt-Werte sind Daten.
- Das SDK wird nur in `lib/spotify/player.ts` angefasst, alles andere kennt nur `Abspieler`.
- Netzwerk-Funktionen bekommen `abruf: Abruf = fetch`, Ansichten bekommen `verbinden` bzw. `abspieler` als Prop, damit
  Tests nachgebaute einsetzen. Zeit im Test mit `vi.useFakeTimers()`.
- Die Demo bleibt ohne Musik und unverändert („Song läuft“).
- Vor jedem Commit `npm run check` mit Exit-Code 0, Commit-Nachricht auf Englisch im Imperativ.

## Prüf-Schwerpunkte

1. Konto ohne Premium (`account_error`) → Meldung „Musik nicht verfügbar: Spotify Premium nötig.“, das Spiel startet
   trotzdem (Aufgabe 7).
2. Jahr in der Auflösung korrigiert, später „Von vorn“ → der Song kommt mit dem korrigierten Jahr wieder (Aufgabe 6).
3. Ausschnitt-Länge während eines Songs geändert → der laufende Song behält seine Länge, der nächste nimmt die neue
   (Aufgabe 5).
4. „Nächste Runde“, bevor der Ausschnitt zu Ende ist → der alte Zeitgeber hält den neuen Song nicht an (Aufgabe 5).
5. „Zurück“ während des Vorbereitens → danach keine Anfrage mehr an MusicBrainz (Aufgabe 7).

## Dateien

| Datei | Zuständig für |
|---|---|
| `lib/ausschnitt.ts` | Typ `Ausschnitt`, `AUSSCHNITTE`, `STANDARD_AUSSCHNITT`, `ausschnittMs`, `ausschnittName` |
| `lib/song.ts`, `lib/spotify/playlist-songs.ts`, `lib/vorbereiten.ts` | Cover vom Album bis in den Song fürs Spiel |
| `lib/spiel.ts` | `jahrKorrigieren` |
| `lib/spotify/abspielen.ts` | `trackAbspielen` (Web API) |
| `lib/spotify/player.ts` | Typ `Abspieler`, `sdkLaden`, `playerVerbinden`, Klasse `PlayerFehler` |
| `app/ui/musikspur.tsx`, `app/globals.css` | Musikspur mit Animation |
| `app/ui/spiel-ansicht.tsx`, `app/ui/tisch.tsx` | Musik je Runde, Ausschnitt, Nochmal, Weiterhören, Cover, Jahr korrigieren |
| `app/ui/vorbereiten-ansicht.tsx`, `app/ui/songliste.tsx` | Player verbinden, aktivieren beim Spielstart, Abbruch bei „Zurück“ |
| `docs/tools/Spotify Web API.md` | Abschnitt Web Playback SDK |

## Aufgaben

### Aufgabe 1: Ausschnitt als Daten

**Dateien:** Neu `lib/ausschnitt.ts`, Test `__tests__/lib/ausschnitt.test.ts`

**Schnittstellen:**
- Liefert: `type Ausschnitt = 15 | 30 | 45 | 60 | "ganz"`, `AUSSCHNITTE: readonly Ausschnitt[]` (in dieser
  Reihenfolge), `STANDARD_AUSSCHNITT: Ausschnitt` (30), `ausschnittMs(a: Ausschnitt): number | null` (`null` bei
  „ganz“), `ausschnittName(a: Ausschnitt): string` („30 Sekunden“, „ganzer Song“).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("Ausschnitte von 15 Sekunden bis ganz, Standard 30", () => {
  expect(AUSSCHNITTE).toEqual([15, 30, 45, 60, "ganz"]);
  expect(STANDARD_AUSSCHNITT).toBe(30);
});
test("Länge in Millisekunden und Name", () => {
  expect(ausschnittMs(30)).toBe(30_000);
  expect(ausschnittMs("ganz")).toBeNull();
  expect(ausschnittName(15)).toBe("15 Sekunden");
  expect(ausschnittName("ganz")).toBe("ganzer Song");
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/ausschnitt.test.ts`)
- [ ] **Schritt 3: `lib/ausschnitt.ts` schreiben**
- [ ] **Schritt 4: Test laufen lassen, er muss bestehen**
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add snippet lengths"`

### Aufgabe 2: Cover bis in den Song fürs Spiel

**Dateien:** Ändern `lib/song.ts`, `lib/spotify/playlist-songs.ts`, `lib/vorbereiten.ts`, Tests
`__tests__/lib/spotify/playlist-songs.test.ts`, `__tests__/lib/vorbereiten.test.ts`

**Schnittstellen:**
- Liefert: `Song` bekommt `cover?: string` (die Songs der Demo haben keins), `PlaylistSong` bekommt
  `cover: string | null` (aus `album.images[0].url`), `spielSongs` übernimmt das Cover (`null` wird weggelassen).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
// playlist-songs.test.ts: track("t1", { album: { release_date: "2011", images: [{ url: "gross.jpg" }, { url: "klein.jpg" }] } })
expect(songs[0].cover).toBe("gross.jpg");
// ohne images: cover null
// vorbereiten.test.ts
expect(spielSongs([{ ...song("t1"), cover: "gross.jpg" }], {})[0].cover).toBe("gross.jpg");
expect(spielSongs([song("t1")], {})[0]).not.toHaveProperty("cover");
```

Die vorhandenen Erwartungen mit ganzen `PlaylistSong`-Objekten bekommen `cover: null`.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
  (`npx vitest run __tests__/lib/spotify/playlist-songs.test.ts __tests__/lib/vorbereiten.test.ts`)
- [ ] **Schritt 3: Cover durchreichen**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**, dann `npm test` (Songliste und Ansichten nutzen
  `PlaylistSong`)
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Pass album cover to game songs"`

### Aufgabe 3: Jahr im laufenden Spiel korrigieren

**Dateien:** Ändern `lib/spiel.ts`, Test `__tests__/lib/spiel.test.ts`

**Schnittstellen:**
- Liefert: `jahrKorrigieren(spiel: Spiel, songId: string, jahr: number): Spiel` ändert das Jahr des Songs in der
  laufenden Runde und im Stapel, alles andere bleibt gleich.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("jahrKorrigieren ändert das Jahr in der Runde und lässt den Rest gleich", () => {
  const spiel = loesungAnzeigen(rundeStarten(spielStarten([bohemian, andererSong], () => 0), () => 0));
  const neu = jahrKorrigieren(spiel, spiel.runde!.song.id, 1974);
  expect(neu.runde!.song.jahr).toBe(1974);
  expect(neu.karte).toBe(spiel.karte);
  expect(spiel.runde!.song.jahr).not.toBe(1974); // Eingabe unverändert
});
test("jahrKorrigieren ändert auch den Song im Stapel", () => {
  const spiel = spielStarten([bohemian, andererSong], () => 0);
  const id = spiel.stapel[1].id;
  expect(jahrKorrigieren(spiel, id, 1950).stapel[1].jahr).toBe(1950);
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/spiel.test.ts`)
- [ ] **Schritt 3: `jahrKorrigieren` schreiben**
- [ ] **Schritt 4: Test laufen lassen, er muss bestehen**
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add correcting the year during a game"`

### Aufgabe 4: Song auf dem Gerät starten und SDK anbinden

**Dateien:** Neu `lib/spotify/abspielen.ts`, `lib/spotify/player.ts`, Tests `__tests__/lib/spotify/abspielen.test.ts`,
`__tests__/lib/spotify/player.test.ts`

**Schnittstellen:**
- Nutzt: `Abruf`, `jsonOderFehler`-Muster mit `SpotifyFehler` (Plan A).
- Liefert in `abspielen.ts`: `trackAbspielen(p: { deviceId: string; trackId: string; accessToken: string }, abruf?: Abruf): Promise<void>`
  (`PUT https://api.spotify.com/v1/me/player/play?device_id=<id>`, Body `{ uris: ["spotify:track:<id>"], position_ms: 0 }`,
  nicht `ok` → `SpotifyFehler`).
- Liefert in `player.ts`: `type Abspieler = { aktivieren(): Promise<void>; abspielen(trackId: string): Promise<void>; pausieren(): Promise<void>; fortsetzen(): Promise<void>; vonVorn(): Promise<void>; trennen(): void }`,
  `class PlayerFehler extends Error` (Meldung für den DJ), `sdkLaden(): Promise<void>` (fügt das Skript genau einmal
  ein, erfüllt sich bei `onSpotifyWebPlaybackSDKReady`),
  `playerVerbinden(p: { tokenHolen: () => Promise<string>; abruf?: Abruf }): Promise<Abspieler>` (erstellt
  `Spotify.Player` „Musik-App Tisch“, wartet auf `ready`; `account_error` → `PlayerFehler("Spotify Premium nötig.")`,
  `initialization_error` → `PlayerFehler("Dieser Browser kann Spotify nicht abspielen.")`, `authentication_error` →
  `PlayerFehler("Spotify-Anmeldung abgelaufen.")`). `vonVorn` ist `seek(0)` und `resume()`.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("trackAbspielen startet den Song auf dem Gerät des Tisches", async () => {
  const abruf = vi.fn<Abruf>(async () => new Response(null, { status: 204 }));
  await trackAbspielen({ deviceId: "d1", trackId: "t1", accessToken: "a1" }, abruf);
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://api.spotify.com/v1/me/player/play?device_id=d1");
  expect(init?.method).toBe("PUT");
  expect(init?.headers).toEqual({ Authorization: "Bearer a1", "Content-Type": "application/json" });
  expect(JSON.parse(init?.body as string)).toEqual({ uris: ["spotify:track:t1"], position_ms: 0 });
});
test("ohne Premium antwortet Spotify 403, das wird ein SpotifyFehler", async () => {
  await expect(trackAbspielen({ deviceId: "d1", trackId: "t1", accessToken: "a1" },
    vi.fn<Abruf>(async () => antwort({ error: { status: 403 } }, 403)))).rejects.toMatchObject({ status: 403 });
});
// player.test.ts
test("sdkLaden fügt das Skript nur einmal ein und wartet auf das SDK", async () => {
  const erstes = sdkLaden();
  const zweites = sdkLaden();
  expect(document.querySelectorAll('script[src="https://sdk.scdn.co/spotify-player.js"]')).toHaveLength(1);
  window.onSpotifyWebPlaybackSDKReady!();
  await expect(Promise.all([erstes, zweites])).resolves.toBeDefined();
});
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
  (`npx vitest run __tests__/lib/spotify/abspielen.test.ts __tests__/lib/spotify/player.test.ts`)
- [ ] **Schritt 3: `abspielen.ts` und `player.ts` schreiben.** Eigene schmale Typen für `window.Spotify` und
  `window.onSpotifyWebPlaybackSDKReady` (`declare global`), nur was `player.ts` benutzt. `playerVerbinden` selbst
  braucht das echte SDK und wird in Aufgabe 8 echt geprüft.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add Spotify player connection"`

### Aufgabe 5: Musik je Runde mit Ausschnitt und Musikspur

**Dateien:** Neu `app/ui/musikspur.tsx`, Ändern `app/globals.css`, `app/ui/tisch.tsx`, `app/ui/spiel-ansicht.tsx`,
Test `__tests__/ui/spiel-musik.test.tsx`

**Schnittstellen:**
- Nutzt: `Abspieler` (Aufgabe 4), `Ausschnitt`, `AUSSCHNITTE`, `STANDARD_AUSSCHNITT`, `ausschnittMs`,
  `ausschnittName` (Aufgabe 1).
- Liefert: `Musikspur({ farbe, laeuft, dauerMs }: { farbe: string; laeuft: boolean; dauerMs: number | null })`
  (`role="img"`, Name „Musikspur läuft“ bzw. „Musikspur steht“), `SpielAnsicht` bekommt `abspieler?: Abspieler`,
  `Tisch` bekommt `onRadSteht?: () => void` und `musik?: { laeuft: boolean; vorbei: boolean; dauerMs: number | null; onNochmal: () => void; onWeiterhoeren: () => void }`.

Verhalten: Mit `abspieler` zeigt `SpielAnsicht` über dem Tisch das Auswahlfeld „Ausschnitt“. Steht das Rad, startet
`abspieler.abspielen(song.id)` und ein Zeitgeber über `ausschnittMs` der beim Start gewählten Länge. Läuft er ab:
`pausieren()`, die Musikspur steht, „Nochmal“ (`vonVorn()`, neuer Zeitgeber) und „Weiterhören“ (`fortsetzen()`, kein
Zeitgeber). Ein neuer Song löscht den alten Zeitgeber, Bingo pausiert. Ohne `abspieler` zeigt der Tisch wie bisher
„Song läuft“.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben** (nachgebauter `abspieler` aus `vi.fn`, `vi.useFakeTimers()`,
  Rad mit `fireEvent.transitionEnd` anhalten wie in `spiel-ansicht.test.tsx`)

```ts
test("steht das Rad, läuft der Song, nach 30 Sekunden pausiert er mit Nochmal und Weiterhören", async () => {
  starten(abspieler);                 // SpielAnsicht mit sofort und abspieler, Rad drehen, Rad steht
  expect(abspieler.abspielen).toHaveBeenCalledWith(bohemian.id);
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  await act(() => vi.advanceTimersByTimeAsync(30_000));
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("img", { name: "Musikspur steht" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Weiterhören" }));
  expect(abspieler.fortsetzen).toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
});
test("Nochmal spielt den Ausschnitt von vorn mit neuem Ende", …);           // vonVorn, nach 30 s erneut pausieren
test("eine neue Länge gilt erst ab dem nächsten Song", …);                  // während Song 1 auf 15 stellen: Pause erst nach 30 s; Song 2: nach 15 s
test("die nächste Runde vor Ende des Ausschnitts hält den neuen Song nicht an", …); // nach 20 s Lösung, nächste Runde, nach weiteren 15 s keine Pause
test("ganzer Song: keine Pause", …);
test("ohne Abspieler bleibt alles wie in der Demo", …);                     // „Song läuft“, kein Auswahlfeld
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen** (`npx vitest run __tests__/ui/spiel-musik.test.tsx`)
- [ ] **Schritt 3: `Musikspur`, Animation in `globals.css` (Balken mit `@keyframes`, angehalten über
  `animation-play-state: paused`, Fortschritt als `transition` der Breite über `dauerMs`), Erweiterungen von `Tisch`
  und `SpielAnsicht`**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**, dann `npm test` (alte Tests der Spiel-Ansicht)
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Play each round with snippet and music track"`

### Aufgabe 6: Cover und Jahr korrigieren in der Auflösung

**Dateien:** Ändern `app/ui/tisch.tsx`, `app/ui/spiel-ansicht.tsx`, Test `__tests__/ui/spiel-musik.test.tsx`

**Schnittstellen:**
- Nutzt: `jahrKorrigieren` (Aufgabe 3), `gueltigesJahr` (Plan B), `Song.cover` (Aufgabe 2).
- Liefert: `SpielAnsicht` bekommt `onJahrKorrigiert?: (songId: string, jahr: number) => void`, `Tisch` bekommt
  `onJahrKorrigieren?: (jahr: number) => void`. Nur wenn es gesetzt ist, zeigt die Auflösung „Jahr korrigieren“.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("die Auflösung zeigt das Cover", …);   // img mit alt „Cover von Bohemian Rhapsody“, src = song.cover
test("Jahr korrigieren zeigt sofort das neue Jahr und meldet es", () => {
  // Auflösung, Klick „Jahr korrigieren“, Feld „Jahr“ = 1974, „Speichern“
  expect(onJahrKorrigiert).toHaveBeenCalledWith(bohemian.id, 1974);
  expect(within(tisch()).getByText("1974")).toBeDefined();
});
test("ungültiges Jahr wird nicht gespeichert", …);   // „75“ → onJahrKorrigiert nicht aufgerufen
test("nach Von vorn kommt der Song mit dem korrigierten Jahr wieder", …); // ein Song, korrigieren, Von vorn, Runde, Lösung → 1974
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Cover und „Jahr korrigieren“ im `Tisch`, in `SpielAnsicht` `jahrKorrigieren` auf das Spiel und auf
  die eigene Songliste für „Von vorn“ anwenden** (`songs` als Startwert eines eigenen `useState`)
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Show cover and correct the year in the reveal"`

### Aufgabe 7: Player beim Spielstart und Abbruch bei „Zurück“

**Dateien:** Ändern `app/ui/vorbereiten-ansicht.tsx`, `lib/vorbereiten.ts`, Tests
`__tests__/ui/vorbereiten-ansicht.test.tsx`, `__tests__/lib/vorbereiten.test.ts`

**Schnittstellen:**
- Nutzt: `playerVerbinden`, `PlayerFehler`, `Abspieler` (Aufgabe 4), `gueltigesToken`, `clientId` (Plan A),
  `korrekturSpeichern` (Plan B).
- Liefert: `vorbereiten` bekommt `abgebrochen?: () => boolean` (vor jedem Song geprüft, dann endet es ohne Fehler),
  `VorbereitenAnsicht` bekommt `verbinden?: () => Promise<Abspieler>` (Standard: `playerVerbinden` mit
  `gueltigesToken`).

Verhalten: Sobald die Songliste erscheint, verbindet die Ansicht den Player. „Spiel starten“ ruft `aktivieren()` im
Klick und zeigt `SpielAnsicht` mit `abspieler` und `onJahrKorrigiert={korrekturSpeichern}`. Scheitert das Verbinden:
„Musik nicht verfügbar: <Meldung>“ über der Songliste, das Spiel startet ohne `abspieler`. Beim Verlassen der Ansicht
wird der Player getrennt und ein laufendes Vorbereiten abgebrochen (ein `useRef`, der im Aufräumen eines eigenen
Effekts auf „verlassen“ springt; StrictMode setzt ihn beim zweiten Einhängen zurück).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("vorbereiten hört auf, sobald abgebrochen meldet", async () => { … });   // nach Song 1 abgebrochen → Song 2 nicht gefragt
test("Spiel starten aktiviert den Player und spielt mit Musik", …);           // verbinden liefert Abspieler, aktivieren im Klick
test("ohne Premium: Meldung, das Spiel startet trotzdem ohne Musik", …);    // verbinden lehnt mit PlayerFehler("Spotify Premium nötig.") ab
test("Zurück während des Vorbereitens: keine weitere Anfrage", …);          // unmount nach erster Antwort, dann keine Anfrage mehr
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Abbruch in `vorbereiten`, Player in `VorbereitenAnsicht`**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**, dann `npm test`
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Connect player at game start and stop preparing on back"`

### Aufgabe 8: Echt prüfen und Phase 2 abschließen

**Dateien:** Ändern `docs/tools/Spotify Web API.md`, `docs/tools/Tools Übersicht.md`, `docs/Projektvision.md`

- [ ] **Schritt 1: Tool-Notiz** um „Web Playback SDK“ ergänzen (Skript, Gerät, `activateElement`, Ereignisse,
  `PUT /me/player/play`), in der Übersicht von „Geplant“ nach „Im Einsatz“.
- [ ] **Schritt 2: Echt prüfen.** `npm run dev`, anmelden, vorbereitete Playlist, „Spiel starten“. Erwartet: In der
  Spotify-App erscheint das Gerät „Musik-App Tisch“; steht das Rad, läuft der Song, die Musikspur springt in der Farbe
  der Kategorie, nach 30 Sekunden Pause mit „Nochmal“ und „Weiterhören“; Ausschnitt auf „ganzer Song“ stellen,
  nächste Runde läuft durch; Auflösung mit Cover, ein Jahr korrigieren und in der Songliste wiederfinden; ein Spiel
  bis Bingo (Fertig-Kriterium der Phase).
- [ ] **Schritt 3: Prüfen und committen:** `npm run check`, `npm run build`, `git commit -m "Document Web Playback SDK"`
- [ ] **Schritt 4: Plan und PR:** `status: abgeschlossen`, PR öffnen, `gh pr checks <nr>` grün, mergen.
- [ ] **Schritt 5: Phase 2 abschließen** (Regel „Phasenwechsel“ der globalen `CLAUDE.md`): Roadmap abhaken, Skill
  `journal` für Phase 2, Skill `naechste-session` mit Phase 3, beide PRs mergen.
