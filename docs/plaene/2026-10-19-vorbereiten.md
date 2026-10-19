---
titel: "Plan: Vorbereiten und Erscheinungsjahr"
status: aktiv
erstellt: 2026-10-19
tags: [plan, spotify, musicbrainz, phase-2]
---

# Plan: Vorbereiten und Erscheinungsjahr

**Ziel:** Der DJ klickt eine Playlist an, die App lädt ihre Songs, ermittelt einmalig das Erscheinungsjahr jedes Songs
über MusicBrainz, zeigt eine Songliste zum Prüfen und Korrigieren und startet damit ein Spiel, noch ohne Musik.

**Vorgehen:** Die Regeln fürs Erscheinungsjahr sind reine Funktionen (TDD). Die MusicBrainz-Abfrage läuft über eine
Route des Next.js-Servers, weil MusicBrainz einen eigenen User-Agent verlangt. Der Browser fragt Song für Song mit
Pause an und speichert jedes Ergebnis sofort unter der Spotify-Track-ID, so setzt ein abgebrochenes Vorbereiten
später fort. Die Oberfläche bekommt eine Vorbereiten-Ansicht mit Fortschritt und eine Songliste.

**Technik:** TypeScript, Next.js 16 (Route Handler), `localStorage`, Vitest mit jsdom. Keine neuen Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 2 (Vorbereiten,
Korrigieren, Speichern bis Phase 3); Begriffe im [[projects/musik-app/docs/Glossar|Glossar]] (Vorbereiten,
Erscheinungsjahr); baut auf [[2026-10-19-spotify-anmeldung|Plan A]] auf.

## Entscheidungen der Session (2026-10-19)

- Gespeichert werden nur die Jahre je Track-ID (`musicbrainz` und `korrigiert`), nicht die Playlist. Die Songs lädt
  die App bei jedem Öffnen frisch von Spotify (wenige Anfragen). „Schon vorbereitet“ heißt: Für jeden Song gibt es
  einen gespeicherten Eintrag, dann fragt sie MusicBrainz nicht.
- „Jahr korrigieren“ in der Auflösung kommt mit Plan C (Abspielen), hier nur die Songliste.
- MusicBrainz am 2026-10-19 geprüft: Der ISRC des Remasters von 2011 (`GBUM71029604`) liefert die Aufnahme mit
  `first-release-date` `1975-11-21`. Die erste Anfrage kam mit 503 „server is currently busy“ zurück.
- Spotify: Songs über `/playlists/{id}/items?limit=50&market=from_token`, der Song steht unter `item`, Jahr aus
  `album.release_date`. `is_playable` gibt es nur mit `market`.

## Annahmen (bitte prüfen)

- **Kontakt im User-Agent:** MusicBrainz verlangt eine Kontaktangabe. Vorschlag:
  `musik-app/0.1 ( https://github.com/Matzee3007/musik-app )`. Willst du lieber eine E-Mail-Adresse dort, sag welche.
- **Jahr aus MusicBrainz:** das früheste Jahr aus `first-release-date` aller Aufnahmen zum ISRC. Kein Datum oder ISRC
  unbekannt (404): kein Jahr, der Song gilt als „nicht gefunden“.
- **MusicBrainz überlastet (503):** bis zu 3 Versuche mit 2 Sekunden Pause, dann bricht das Vorbereiten mit einer
  Meldung ab. Was schon ermittelt ist, bleibt gespeichert, „Nochmal versuchen“ setzt dort fort.
- **Tempo:** 1,1 Sekunden Pause zwischen zwei Anfragen an MusicBrainz (erlaubt ist 1 pro Sekunde).
- **Übersprungen:** lokale Dateien, Podcast-Folgen und Songs mit `is_playable: false`. Fehlt `is_playable`, gilt der
  Song als spielbar.
- **Interpret:** alle Interpreten mit Komma, z. B. „Queen, David Bowie“.
- **Markierung:** Ein korrigierter Song ist nicht mehr markiert, der DJ hat ihn geprüft. Markierte Songs stehen in der
  Songliste oben.
- **Korrektur:** nur ganze Jahre von 1900 bis zum aktuellen Jahr, ein leeres Feld nimmt die Korrektur zurück.

## Feste Vorgaben

- Spiellogik in `lib/` importiert nichts aus `lib/spotify/` (Architekturprinzip 2). `lib/erscheinungsjahr.ts` und
  `lib/musicbrainz.ts` kennen Spotify nicht, nur `lib/vorbereiten.ts` verbindet beides.
- Netzwerk-Funktionen bekommen `abruf: Abruf = fetch` als letzten Parameter, Pausen `warten = (ms) => …`, damit Tests
  ohne echte Wartezeit laufen.
- MusicBrainz wird nur vom Server gefragt, nie direkt aus dem Browser.
- Namen nach dem Glossar (Vorbereiten, Erscheinungsjahr, Songliste, Demo). Tests räumen auf wie in Plan A, dazu
  `vi.clearAllMocks()`, weil Testhilfen wie `ohnePause` von mehreren Tests geteilt werden.
- Vor jedem Commit `npm run check` mit Exit-Code 0, Commit-Nachricht auf Englisch im Imperativ.

## Prüf-Schwerpunkte

1. MusicBrainz antwortet 503 → erneuter Versuch, nach dem dritten Fehlschlag Meldung mit „Nochmal versuchen“, die
   schon ermittelten Jahre bleiben gespeichert (Aufgabe 5, Aufgabe 7).
2. Dieselbe Playlist ein zweites Mal öffnen → keine einzige Anfrage an MusicBrainz (Aufgabe 5).
3. Song ohne ISRC → keine Anfrage, Spotify-Jahr, markiert „nicht gefunden“ (Aufgabe 5, Aufgabe 1).
4. Korrektur „abc“, „75“ oder ein Jahr in der Zukunft → nichts gespeichert, leeres Feld nimmt die Korrektur zurück
   (Aufgabe 1, Aufgabe 6).
5. Playlist ohne spielbare Songs → Meldung „Keine spielbaren Songs“, kein „Spiel starten“ (Aufgabe 6).

## Dateien

| Datei | Zuständig für |
|---|---|
| `lib/erscheinungsjahr.ts` | Typ `Jahre`, `jahrFuerSpiel`, `markierung`, `gueltigesJahr` |
| `lib/musicbrainz.ts` | `USER_AGENT`, Klasse `MusicBrainzBeschaeftigt`, `jahrAusMusicBrainz`, `erscheinungsjahrLaden` |
| `app/api/erscheinungsjahr/route.ts` | `GET /api/erscheinungsjahr?isrc=…` → `{ jahr }` |
| `lib/spotify/playlist-songs.ts` | Typ `PlaylistSong`, `playlistSongs` |
| `lib/vorbereiten.ts` | Speicher der Jahre, `jahrUeberServer`, `vorbereiten`, `spielSongs` |
| `app/ui/songliste.tsx` | Songliste mit Markierung, Korrektur und „Spiel starten“ |
| `app/ui/vorbereiten-ansicht.tsx` | Songs laden, Fortschritt, Fehler, dann Songliste und Spiel |
| `app/ui/start.tsx` | Playlists werden anklickbar |
| `app/ui/spiel-ansicht.tsx` | Prop `sofort`: Spiel ohne zweiten Klick auf „Spiel starten“ |
| `docs/tools/MusicBrainz.md` | Tool-Notiz |

## Aufgaben

### Aufgabe 1: Regeln fürs Erscheinungsjahr

**Dateien:** Neu `lib/erscheinungsjahr.ts`, Test `__tests__/lib/erscheinungsjahr.test.ts`

**Schnittstellen:**
- Liefert: `type Jahre = { spotify: number; musicbrainz: number | null; korrigiert: number | null }`,
  `jahrFuerSpiel(j: Jahre): number` (korrigiert, sonst MusicBrainz, sonst Spotify),
  `markierung(j: Jahre): "nicht gefunden" | "später als Spotify" | null`,
  `gueltigesJahr(text: string, bisJahr: number): number | null` (ganze Zahl von 1900 bis `bisJahr`, sonst `null`).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const remaster: Jahre = { spotify: 2011, musicbrainz: 1975, korrigiert: null };
test("das Spiel nimmt die Korrektur, sonst MusicBrainz, sonst Spotify", () => {
  expect(jahrFuerSpiel(remaster)).toBe(1975);
  expect(jahrFuerSpiel({ ...remaster, korrigiert: 1974 })).toBe(1974);
  expect(jahrFuerSpiel({ ...remaster, musicbrainz: null })).toBe(2011);
});
test("markiert nicht gefunden und MusicBrainz später als Spotify, Remaster nicht", () => {
  expect(markierung(remaster)).toBeNull();
  expect(markierung({ ...remaster, musicbrainz: null })).toBe("nicht gefunden");
  expect(markierung({ spotify: 1999, musicbrainz: 2004, korrigiert: null })).toBe("später als Spotify");
  expect(markierung({ spotify: 1999, musicbrainz: null, korrigiert: 1999 })).toBeNull();
});
test("gueltigesJahr nimmt nur ganze Jahre von 1900 bis heute", () => {
  expect(gueltigesJahr("1975", 2026)).toBe(1975);
  expect(gueltigesJahr(" 2026 ", 2026)).toBe(2026);
  for (const text of ["", "abc", "75", "1899", "2027", "1975.5"]) expect(gueltigesJahr(text, 2026)).toBeNull();
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/erscheinungsjahr.test.ts`)
- [x] **Schritt 3: `Jahre`, `jahrFuerSpiel`, `markierung`, `gueltigesJahr` schreiben**
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add release year rules"`

### Aufgabe 2: MusicBrainz fragen

**Dateien:** Neu `lib/musicbrainz.ts`, Test `__tests__/lib/musicbrainz.test.ts`

**Schnittstellen:**
- Nutzt: `Abruf` aus `lib/spotify/abruf.ts` (nur der Typ).
- Liefert: `USER_AGENT` (aus „Annahmen“), `class MusicBrainzBeschaeftigt extends Error`,
  `type IsrcAntwort = { recordings: { "first-release-date"?: string }[] }`,
  `jahrAusMusicBrainz(antwort: IsrcAntwort): number | null`,
  `erscheinungsjahrLaden(isrc: string, abruf?: Abruf): Promise<number | null>` (fragt
  `https://musicbrainz.org/ws/2/isrc/<isrc>?fmt=json` mit Header `User-Agent`, 404 → `null`, 503 →
  `MusicBrainzBeschaeftigt`, anderer Fehler → `Error`).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("jahrAusMusicBrainz nimmt das früheste Jahr und übergeht Aufnahmen ohne Datum", () => {
  expect(jahrAusMusicBrainz({ recordings: [{ "first-release-date": "1975-11-21" }] })).toBe(1975);
  expect(jahrAusMusicBrainz({ recordings: [
    { "first-release-date": "1981" }, { "first-release-date": "" }, {}, { "first-release-date": "1977-06" },
  ] })).toBe(1977);
  expect(jahrAusMusicBrainz({ recordings: [{}] })).toBeNull();
});
test("erscheinungsjahrLaden fragt mit User-Agent und liefert das Jahr", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ isrc: "GBUM71029604", recordings: [{ "first-release-date": "1975-11-21" }] }));
  expect(await erscheinungsjahrLaden("GBUM71029604", abruf)).toBe(1975);
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://musicbrainz.org/ws/2/isrc/GBUM71029604?fmt=json");
  expect(init?.headers).toEqual({ "User-Agent": USER_AGENT, Accept: "application/json" });
});
test("unbekannter ISRC ergibt kein Jahr, überlastetes MusicBrainz einen eigenen Fehler", async () => {
  expect(await erscheinungsjahrLaden("X", vi.fn<Abruf>(async () => antwort({ error: "Not Found" }, 404)))).toBeNull();
  await expect(erscheinungsjahrLaden("X", vi.fn<Abruf>(async () => antwort({ error: "busy" }, 503))))
    .rejects.toBeInstanceOf(MusicBrainzBeschaeftigt);
});
```

Bei der Umsetzung ergänzt: leere Liste `recordings: []` ergibt kein Jahr, ein anderer Fehler (z. B. 500) wird
geworfen statt als „nicht gefunden“ zu gelten.

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/musicbrainz.test.ts`)
- [x] **Schritt 3: `lib/musicbrainz.ts` schreiben.** Jahr = erste vier Zeichen von `first-release-date` als Zahl.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add MusicBrainz release year lookup"`

### Aufgabe 3: Server-Route für das Erscheinungsjahr

**Dateien:** Neu `app/api/erscheinungsjahr/route.ts`, Test `__tests__/api/erscheinungsjahr.test.ts`

**Schnittstellen:**
- Nutzt: `erscheinungsjahrLaden`, `MusicBrainzBeschaeftigt` (Aufgabe 2).
- Liefert: `GET(request: Request): Promise<Response>`. `?isrc=` muss dem ISRC-Muster `^[A-Z]{2}[A-Z0-9]{3}\d{7}$`
  entsprechen, sonst 400. Erfolg: 200 `{ jahr: number | null }`. Überlastet: 503 `{ fehler: "beschäftigt" }`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben** (`fetch` mit `vi.stubGlobal` ersetzen)

```ts
const anfrage = (isrc: string) => new Request(`http://127.0.0.1:3000/api/erscheinungsjahr?isrc=${isrc}`);
test("liefert das Jahr zum ISRC", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => antwort({ recordings: [{ "first-release-date": "1975-11-21" }] })));
  const r = await GET(anfrage("GBUM71029604"));
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ jahr: 1975 });
});
test("lehnt alles ab, was kein ISRC ist, ohne MusicBrainz zu fragen", async () => {
  const abruf = vi.fn();
  vi.stubGlobal("fetch", abruf);
  expect((await GET(anfrage("../../artist"))).status).toBe(400);
  expect(abruf).not.toHaveBeenCalled();
});
test("reicht ein überlastetes MusicBrainz als 503 weiter", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => antwort({ error: "busy" }, 503)));
  expect((await GET(anfrage("GBUM71029604"))).status).toBe(503);
});
```

Bei der Umsetzung: Der 400-Test prüft zusätzlich leeren, kleingeschriebenen und zu kurzen ISRC und eine Anfrage ganz
ohne `isrc`. `npm run build` zeigt die Route als dynamisch (ƒ), wie die Doku zu Cache Components beschreibt.

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/api/erscheinungsjahr.test.ts`)
- [x] **Schritt 3: `route.ts` schreiben.** ISRC aus `new URL(request.url).searchParams`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add release year API route"`

### Aufgabe 4: Songs einer Playlist laden

**Dateien:** Neu `lib/spotify/playlist-songs.ts`, Test `__tests__/lib/spotify/playlist-songs.test.ts`

**Schnittstellen:**
- Nutzt: `Abruf`, `jsonOderFehler` (Plan A).
- Liefert: `type PlaylistSong = { id: string; titel: string; interpret: string; isrc: string | null; spotifyJahr: number }`,
  `playlistSongs(playlistId: string, accessToken: string, abruf?: Abruf): Promise<{ songs: PlaylistSong[]; uebersprungen: number }>`
  (beginnt bei `https://api.spotify.com/v1/playlists/<id>/items?limit=50&market=from_token`, folgt `next`).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const track = (id: string, extra: object = {}) => ({
  is_local: false,
  item: { type: "track", id, name: `Titel ${id}`, artists: [{ name: "Queen" }, { name: "David Bowie" }],
    album: { release_date: "2011-01-01" }, external_ids: { isrc: `ISRC${id}` }, ...extra },
});
test("playlistSongs liefert Titel, Interpreten, ISRC und Spotify-Jahr über alle Seiten", async () => {
  const abruf = vi.fn<Abruf>()
    .mockResolvedValueOnce(antwort({ items: [track("t1")], next: "https://api.spotify.com/v1/playlists/p1/items?offset=50" }))
    .mockResolvedValueOnce(antwort({ items: [track("t2", { album: { release_date: "1975" }, external_ids: {} })], next: null }));
  expect(await playlistSongs("p1", "a1", abruf)).toEqual({ uebersprungen: 0, songs: [
    { id: "t1", titel: "Titel t1", interpret: "Queen, David Bowie", isrc: "ISRCt1", spotifyJahr: 2011 },
    { id: "t2", titel: "Titel t2", interpret: "Queen, David Bowie", isrc: null, spotifyJahr: 1975 },
  ] });
  expect(abruf.mock.calls[0][0]).toBe("https://api.spotify.com/v1/playlists/p1/items?limit=50&market=from_token");
  expect(abruf.mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer a1" });
});
test("überspringt lokale Dateien, Podcast-Folgen und nicht spielbare Songs und zählt sie", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ next: null, items: [
    track("t1"), { ...track("lokal"), is_local: true }, { is_local: false, item: { type: "episode", id: "e1" } },
    track("gesperrt", { is_playable: false }), { is_local: false, item: null },
  ] }));
  const { songs, uebersprungen } = await playlistSongs("p1", "a1", abruf);
  expect(songs.map((s) => s.id)).toEqual(["t1"]);
  expect(uebersprungen).toBe(4);
});
```

Bei der Umsetzung ergänzt: abgelaufenes Token ergibt `SpotifyFehler` 401, `is_playable: true` bleibt dabei.

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/spotify/playlist-songs.test.ts`)
- [x] **Schritt 3: `playlist-songs.ts` schreiben.** Spotify-Jahr = erste vier Zeichen von `album.release_date`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add loading songs of a playlist"`

### Aufgabe 5: Vorbereiten und Jahre speichern

**Dateien:** Neu `lib/vorbereiten.ts`, Test `__tests__/lib/vorbereiten.test.ts`

**Schnittstellen:**
- Nutzt: `Jahre`, `jahrFuerSpiel` (Aufgabe 1), `MusicBrainzBeschaeftigt` (Aufgabe 2), `PlaylistSong` (Aufgabe 4),
  `Abruf`, `Song`.
- Liefert: `type GespeicherteJahre = { musicbrainz: number | null; korrigiert: number | null }`,
  `gespeicherteJahre(): Record<string, GespeicherteJahre>` (Schlüssel `musik-app:jahre` im `localStorage`),
  `korrekturSpeichern(trackId: string, jahr: number | null): void`,
  `jahreVon(song: PlaylistSong, gespeichert: Record<string, GespeicherteJahre>): Jahre`,
  `jahrUeberServer(isrc: string, abruf?: Abruf): Promise<number | null>` (fragt `/api/erscheinungsjahr?isrc=…`,
  503 → `MusicBrainzBeschaeftigt`),
  `vorbereiten(songs: readonly PlaylistSong[], p?: { jahrAbfragen?: (isrc: string) => Promise<number | null>; warten?: (ms: number) => Promise<void>; onFortschritt?: (fertig: number, gesamt: number) => void }): Promise<void>`,
  `spielSongs(songs: readonly PlaylistSong[], gespeichert: Record<string, GespeicherteJahre>): Song[]`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const song = (id: string, isrc: string | null = `ISRC${id}`): PlaylistSong =>
  ({ id, titel: `Titel ${id}`, interpret: "Queen", isrc, spotifyJahr: 2011 });
const ohnePause = vi.fn(async () => {});

test("vorbereiten fragt jeden Song einmal mit Pause und meldet den Fortschritt", async () => {
  const jahrAbfragen = vi.fn(async () => 1975);
  const onFortschritt = vi.fn();
  await vorbereiten([song("t1"), song("t2")], { jahrAbfragen, warten: ohnePause, onFortschritt });
  expect(jahrAbfragen.mock.calls).toEqual([["ISRCt1"], ["ISRCt2"]]);
  expect(ohnePause).toHaveBeenCalledWith(1100);
  expect(onFortschritt.mock.calls).toEqual([[0, 2], [1, 2], [2, 2]]);
  expect(gespeicherteJahre()).toEqual({ t1: { musicbrainz: 1975, korrigiert: null }, t2: { musicbrainz: 1975, korrigiert: null } });
});
test("eine schon vorbereitete Playlist fragt MusicBrainz nicht noch einmal", async () => {
  await vorbereiten([song("t1")], { jahrAbfragen: async () => 1975, warten: ohnePause });
  const jahrAbfragen = vi.fn(async () => 1975);
  await vorbereiten([song("t1")], { jahrAbfragen, warten: ohnePause });
  expect(jahrAbfragen).not.toHaveBeenCalled();
});
test("ohne ISRC keine Anfrage, der Song gilt als nicht gefunden", async () => {
  const jahrAbfragen = vi.fn(async () => 1975);
  await vorbereiten([song("t1", null)], { jahrAbfragen, warten: ohnePause });
  expect(jahrAbfragen).not.toHaveBeenCalled();
  expect(gespeicherteJahre().t1).toEqual({ musicbrainz: null, korrigiert: null });
});
test("überlastetes MusicBrainz: drei Versuche, dann Fehler, Fertiges bleibt gespeichert", async () => {
  const jahrAbfragen = vi.fn(async (isrc: string) => {
    if (isrc === "ISRCt2") throw new MusicBrainzBeschaeftigt();
    return 1975;
  });
  await expect(vorbereiten([song("t1"), song("t2")], { jahrAbfragen, warten: ohnePause }))
    .rejects.toBeInstanceOf(MusicBrainzBeschaeftigt);
  expect(jahrAbfragen.mock.calls.filter(([isrc]) => isrc === "ISRCt2")).toHaveLength(3);
  expect(ohnePause).toHaveBeenCalledWith(2000);
  expect(Object.keys(gespeicherteJahre())).toEqual(["t1"]);
});
test("Korrektur speichern und zurücknehmen, spielSongs nimmt das Jahr fürs Spiel", async () => {
  await vorbereiten([song("t1")], { jahrAbfragen: async () => 1975, warten: ohnePause });
  korrekturSpeichern("t1", 1974);
  expect(spielSongs([song("t1")], gespeicherteJahre())).toEqual([{ id: "t1", titel: "Titel t1", interpret: "Queen", jahr: 1974 }]);
  korrekturSpeichern("t1", null);
  expect(jahreVon(song("t1"), gespeicherteJahre())).toEqual({ spotify: 2011, musicbrainz: 1975, korrigiert: null });
});
test("jahrUeberServer fragt die eigene Route und meldet 503 als beschäftigt", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ jahr: 1975 }));
  expect(await jahrUeberServer("GBUM71029604", abruf)).toBe(1975);
  expect(abruf.mock.calls[0][0]).toBe("/api/erscheinungsjahr?isrc=GBUM71029604");
  await expect(jahrUeberServer("X", vi.fn<Abruf>(async () => antwort({}, 503)))).rejects.toBeInstanceOf(MusicBrainzBeschaeftigt);
});
```

Bei der Umsetzung geschärft und ergänzt: genau eine Pause zwischen zwei Anfragen (keine vor der ersten, keine für
Songs ohne ISRC), der Fortschritt zählt nur offene Songs, ein kurz überlastetes MusicBrainz gelingt beim neuen Versuch,
ein noch nicht vorbereiteter Song spielt mit dem Spotify-Jahr, `jahrUeberServer` wirft bei 500, ohne eigene Abfrage
fragt `vorbereiten` die Route.

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/vorbereiten.test.ts`)
- [x] **Schritt 3: `lib/vorbereiten.ts` schreiben.** Gefragt werden nur Songs ohne gespeicherten Eintrag, jedes
  Ergebnis wird sofort gespeichert. Pause 1100 ms vor jeder Anfrage außer der ersten, bei `MusicBrainzBeschaeftigt`
  2000 ms und neuer Versuch, nach dem dritten Fehlschlag weiterwerfen.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add preparing a playlist with stored years"`

### Aufgabe 6: Songliste

**Dateien:** Neu `app/ui/songliste.tsx`, Ändern `app/ui/spiel-ansicht.tsx`, Tests `__tests__/ui/songliste.test.tsx`,
`__tests__/ui/spiel-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `markierung`, `jahrFuerSpiel`, `gueltigesJahr` (Aufgabe 1), `gespeicherteJahre`, `korrekturSpeichern`,
  `jahreVon`, `spielSongs` (Aufgabe 5), `PlaylistSong` (Aufgabe 4).
- Liefert: Komponente `Songliste({ songs, uebersprungen, onSpielStarten }: { songs: readonly PlaylistSong[]; uebersprungen: number; onSpielStarten: (songs: Song[]) => void })`;
  `SpielAnsicht` bekommt die optionale Prop `sofort?: boolean` (startet das Spiel ohne eigenen Knopf).

Verhalten: Überschrift „<Anzahl> Songs bereit, <Anzahl> übersprungen“ (bei genau einem: „1 Song bereit“), darunter eine Tabelle mit Titel, Interpret,
Spotify, MusicBrainz („–“ ohne Jahr), Jahr (Eingabefeld mit der Korrektur, Platzhalter `jahrFuerSpiel`) und Hinweis
(`markierung`). Markierte Zeilen zuerst. Eine Korrektur wird beim Verlassen des Feldes gespeichert, wenn
`gueltigesJahr` sie annimmt; ein leeres Feld nimmt sie zurück. Ohne Songs: „Keine spielbaren Songs“ statt
„Spiel starten“.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
// gespeichert vorher: t1 → MusicBrainz 1975, t2 → nicht gefunden
test("markierte Songs stehen oben und sind gekennzeichnet", () => {
  render(<Songliste songs={[song("t1"), song("t2")]} uebersprungen={1} onSpielStarten={vi.fn()} />);
  expect(screen.getByText("2 Songs bereit, 1 übersprungen")).toBeDefined();
  const zeilen = screen.getAllByRole("row").slice(1);
  expect(within(zeilen[0]).getByText("Titel t2")).toBeDefined();
  expect(within(zeilen[0]).getByText("nicht gefunden")).toBeDefined();
});
test("eine gültige Korrektur wird gespeichert und hebt die Markierung auf, Unsinn nicht", () => {
  render(<Songliste songs={[song("t2")]} uebersprungen={0} onSpielStarten={vi.fn()} />);
  const feld = screen.getByRole("spinbutton", { name: "Jahr für Titel t2" });
  fireEvent.change(feld, { target: { value: "75" } });
  fireEvent.blur(feld);
  expect(gespeicherteJahre().t2.korrigiert).toBeNull();
  fireEvent.change(feld, { target: { value: "1999" } });
  fireEvent.blur(feld);
  expect(gespeicherteJahre().t2.korrigiert).toBe(1999);
  expect(screen.queryByText("nicht gefunden")).toBeNull();
});
test("Spiel starten übergibt die Songs mit dem Jahr fürs Spiel", () => {
  const onSpielStarten = vi.fn();
  render(<Songliste songs={[song("t1")]} uebersprungen={0} onSpielStarten={onSpielStarten} />);
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(onSpielStarten).toHaveBeenCalledWith([{ id: "t1", titel: "Titel t1", interpret: "Queen", jahr: 1975 }]);
});
test("ohne spielbare Songs kein Spiel", () => {
  render(<Songliste songs={[]} uebersprungen={3} onSpielStarten={vi.fn()} />);
  expect(screen.getByText("Keine spielbaren Songs")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Spiel starten" })).toBeNull();
});
```

In `__tests__/ui/spiel-ansicht.test.tsx`: `render(<SpielAnsicht songs={FUENF_SONGS} sofort />)` zeigt sofort „Rad drehen“
und keinen Knopf „Spiel starten“.

Bei der Umsetzung ergänzt: Nach abgelehntem Unsinn zeigt das Feld wieder den gespeicherten Wert (Rot-Grün durch
Ausbauen belegt), ein leeres Feld nimmt die Korrektur zurück und die Markierung kommt wieder. „Spiel starten“ übergibt
die Songs in der Reihenfolge der Playlist. Die Einzahl „1 Song bereit“ verlangt erst der Test in Aufgabe 7.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
  (`npx vitest run __tests__/ui/songliste.test.tsx __tests__/ui/spiel-ansicht.test.tsx`)
- [x] **Schritt 3: `Songliste` schreiben, `SpielAnsicht` um `sofort` ergänzen.** `sofort` startet über den
  Startwert von `useState` (`() => sofort ? spielStarten(songs, zufall) : null`). Das ist sicher, weil `SpielAnsicht`
  mit `sofort` nur nach einem Klick erscheint, nie beim ersten Rendern auf dem Server.
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add song list with year corrections"`

### Aufgabe 7: Vorbereiten-Ansicht und anklickbare Playlists

**Dateien:** Neu `app/ui/vorbereiten-ansicht.tsx`, Ändern `app/ui/start.tsx`, Tests
`__tests__/ui/vorbereiten-ansicht.test.tsx`, `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: `playlistSongs` (Aufgabe 4), `vorbereiten`, `jahrUeberServer` (Aufgabe 5), `Songliste` (Aufgabe 6),
  `SpielAnsicht` mit `sofort`, `Playlist` (Plan A).
- Liefert: Komponente `VorbereitenAnsicht({ playlist, accessToken, onZurueck, warten }: { playlist: Playlist; accessToken: string; onZurueck: () => void; warten?: (ms: number) => Promise<void> })`.
  In `Start` wird jede Playlist ein Knopf „<Name> (<Anzahl> Songs)“, ein Klick zeigt `VorbereitenAnsicht`.

Verhalten: Überschrift = Playlist-Name, Knopf „Zurück“. Erst „Songs werden geladen …“, dann während des Vorbereitens
ein `<progress>` mit der Beschriftung „Erscheinungsjahre: <fertig> von <gesamt>“, dann `Songliste`. Bei
`MusicBrainzBeschaeftigt`: „MusicBrainz ist gerade überlastet.“ und Knopf „Nochmal versuchen“. „Spiel starten“ zeigt
`<SpielAnsicht songs={…} sofort />`.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben** (`fetch` mit `vi.stubGlobal` nach URL verzweigen: Spotify-Adresse
  → Songs, `/api/erscheinungsjahr` → Jahr oder 503; `warten={async () => {}}`)

```ts
test("lädt, bereitet vor und zeigt die Songliste, danach startet das Spiel", async () => {
  // Spotify liefert t1 mit ISRC, die Route antwortet { jahr: 1975 }
  render(<VorbereitenAnsicht playlist={partyhits} accessToken="a1" onZurueck={vi.fn()} warten={async () => {}} />);
  expect(await screen.findByText("1 Song bereit, 0 übersprungen")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});
test("überlastetes MusicBrainz zeigt die Meldung, Nochmal versuchen setzt fort", async () => {
  // Route antwortet erst dreimal 503, danach { jahr: 1975 }
  render(<VorbereitenAnsicht playlist={partyhits} accessToken="a1" onZurueck={vi.fn()} warten={async () => {}} />);
  expect(await screen.findByText("MusicBrainz ist gerade überlastet.")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Nochmal versuchen" }));
  expect(await screen.findByText("1 Song bereit, 0 übersprungen")).toBeDefined();
});
```

In `__tests__/ui/start.test.tsx`: Klick auf „Partyhits (98 Songs)“ zeigt die Überschrift „Partyhits“, „Zurück“ führt
zur Playlist-Liste zurück.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
  (`npx vitest run __tests__/ui/vorbereiten-ansicht.test.tsx __tests__/ui/start.test.tsx`)
- [ ] **Schritt 3: `VorbereitenAnsicht` schreiben, Playlists in `Start` anklickbar machen**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen** (dann `npm test` für alles)
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add preparing view and clickable playlists"`

### Aufgabe 8: Echt prüfen und abschließen

**Dateien:** Neu `docs/tools/MusicBrainz.md`, Ändern `docs/tools/Tools Übersicht.md`

- [ ] **Schritt 1: Tool-Notiz `MusicBrainz.md`** (Aufbau wie `Spotify Web API.md`: ISRC-Abfrage, `first-release-date`,
  User-Agent, 1 Anfrage pro Sekunde, 503) und Zeile in „Im Einsatz“ statt „Geplant“.
- [ ] **Schritt 2: Echt prüfen.** `npm run dev`, `http://127.0.0.1:3000`, anmelden, eine eigene Playlist anklicken.
  Erwartet: Fortschritt zählt hoch (etwa 1 Song pro Sekunde), dann die Songliste mit „… Songs bereit, …
  übersprungen“. Mindestens einen bekannten Remaster prüfen (MusicBrainz-Jahr älter als Spotify-Jahr, nicht
  markiert). Einen markierten Song korrigieren, „Zurück“ und dieselbe Playlist wieder öffnen: keine Wartezeit, die
  Korrektur ist noch da. „Spiel starten“: Spiel mit deinen Songs, die Auflösung zeigt das richtige Jahr.
- [ ] **Schritt 3: Prüfen und committen:** `npm run check`, `npm run build`,
  `git commit -m "Document MusicBrainz"`
- [ ] **Schritt 4: Plan abschließen:** `status: abgeschlossen`, PR öffnen, `gh pr checks <nr>` grün, mergen.
