---
titel: "Plan: Spotify-Anmeldung und Playlists"
status: aktiv
erstellt: 2026-10-19
tags: [plan, spotify, oauth, phase-2]
---

# Plan: Spotify-Anmeldung und Playlists

**Ziel:** Der DJ meldet sich am Tisch mit Spotify an, bleibt angemeldet, sieht seine eigenen und kollaborativen
Playlists und kann sich abmelden. Alternativ startet er die Demo.

**Vorgehen:** Die Anmeldung (OAuth mit PKCE) besteht aus kleinen Funktionen in `lib/spotify/`, die `fetch` als
Parameter bekommen (wie `zufall` in Phase 1), damit Tests nachgebaute Spotify-Antworten einsetzen. Der Browser-Speicher
liegt in einer eigenen Datei. Die Oberfläche bekommt eine Startseite und eine Rückruf-Seite `/callback`.

**Technik:** TypeScript, Next.js 16 (App Router, `cacheComponents` an), Web Crypto (`crypto.subtle`), `localStorage`
und `sessionStorage`, Vitest mit jsdom. Keine neuen Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 2 (Anmeldung,
Ablauf am Tisch, Demo); [[0003-spotify-anmeldung-nur-im-browser|ADR 0003]]; Begriffe im
[[projects/musik-app/docs/Glossar|Glossar]].

## Entscheidungen der Session (2026-10-19)

- Phase 2 in drei Pläne geteilt, je ein PR: **A Anmeldung und Playlists** (dieser Plan), **B Vorbereiten und
  Erscheinungsjahr**, **C Abspielen**. B und C werden geschrieben, wenn der Vorgänger gemergt ist.
- Der Dev-Server läuft nur auf `127.0.0.1` (`next dev -H 127.0.0.1`). Spotify verlangt diese Adresse, und der Browser
  trennt den Speicher nach Adresse. `localhost:3000` antwortet dann gar nicht, statt still ein anderes Token zu haben.
- Die Rückruf-Seite liest den Code im Browser (`window.location.search`), nicht als `searchParams` einer
  Server-Seite: Mit `cacheComponents` bräuchte das eine eigene Suspense-Grenze.
- Fremde Playlists erkennt die App daran, dass Spotify bei ihnen das Feld `items` weglässt (Stand Februar 2026). Ein
  Abgleich mit `GET /me` ist nicht nötig.

## Annahmen (bitte prüfen)

- **Alle Scopes schon jetzt anfragen**, auch die für Plan C: `playlist-read-private playlist-read-collaborative
  streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state`. Sonst müsstest du
  dich in Plan C neu anmelden. Scopes sind die Rechte, die die App bei Spotify erbittet.
- Die Redirect-URI ergibt sich aus der Adresse der Seite: `${window.location.origin}/callback`, lokal also
  `http://127.0.0.1:3000/callback`. In Phase 3 passt sie ohne Änderung für Vercel.
- In Plan A ist die Playlist-Liste nur eine Anzeige mit Name und Anzahl Songs. Anklicken und Vorbereiten kommen in
  Plan B.
- Speicher-Schlüssel: `musik-app:spotify-token` (`localStorage`, bleibt) und `musik-app:anmeldung` (`sessionStorage`,
  nur bis zur Rückkehr von Spotify).

## Feste Vorgaben

- Spotify-Code liegt in `lib/spotify/` und importiert nichts aus React oder Next.js. Die Spiellogik in `lib/`
  importiert nichts aus `lib/spotify/` (Architekturprinzip 2).
- Kein Client-Secret, in `.env.local` steht nur `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` (ADR 0003). `.env.local` nie committen.
- Netzwerk-Funktionen bekommen `abruf: Abruf = fetch` als letzten Parameter, Zeitpunkte `jetzt: number = Date.now()`.
- Namen auf Deutsch nach dem Glossar (DJ, Tisch, Demo), Spotify-Begriffe bleiben englisch (Token, Playlist, Scope).
- Import über `@/lib/spotify/<datei>`, Tests in `__tests__/lib/spotify/<datei>.test.ts` und `__tests__/ui/`.
- Tests räumen nach sich auf: `afterEach` mit `localStorage.clear()`, `sessionStorage.clear()`,
  `vi.unstubAllGlobals()`, `vi.unstubAllEnvs()` und bei Oberflächen-Tests `cleanup()`.
- Vor jedem Commit `npm run check` mit Exit-Code 0, Commit-Nachricht auf Englisch im Imperativ.

## Prüf-Schwerpunkte

1. Zugriff in den Spotify-Kontoeinstellungen entzogen → Erneuern scheitert mit 400 → abgemeldet, die Startseite zeigt
   wieder „Mit Spotify anmelden“ statt eines Fehlers (Aufgabe 3, Aufgabe 6).
2. React führt Effekte im Dev-Modus doppelt aus (StrictMode) → der Code wird trotzdem nur einmal getauscht, ein
   zweiter Tausch würde mit `invalid_grant` scheitern (Aufgabe 5).
3. DJ klickt bei Spotify „Abbrechen“ → `/callback?error=access_denied` → Meldung „Anmeldung abgebrochen“, kein Tausch
   (Aufgabe 3, Aufgabe 5).
4. Mehr als 50 Playlists → alle erscheinen, nicht nur die erste Seite (Aufgabe 4).
5. `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` fehlt → Hinweis auf `.env.local` statt einer Spotify-Fehlerseite (Aufgabe 6).

## Dateien

| Datei | Zuständig für |
|---|---|
| `lib/spotify/abruf.ts` | Typ `Abruf`, Klasse `SpotifyFehler`, `jsonOderFehler` |
| `lib/spotify/pkce.ts` | `zufallsText`, `codeChallenge`, `anmeldeUrl`, Konstante `SCOPES` |
| `lib/spotify/token.ts` | Typ `Token`, `codeTauschen`, `tokenErneuern`, `istAbgelaufen` |
| `lib/spotify/sitzung.ts` | Browser-Speicher: `anmeldungStarten`, `anmeldungAbschliessen`, `gueltigesToken`, `abmelden`, Klasse `AnmeldeFehler` |
| `lib/spotify/playlists.ts` | Typ `Playlist`, `eigenePlaylists` |
| `lib/spotify/konfig.ts` | `clientId()` |
| `app/ui/rueckruf.tsx` | Rückkehr von Spotify verarbeiten, Fehler anzeigen |
| `app/callback/page.tsx` | Seite `/callback`, leitet nach Erfolg auf `/` |
| `app/ui/start.tsx` | Startseite: Anmelden, Demo, Playlists, Abmelden |
| `app/page.tsx` | zeigt `Start` statt direkt `SpielAnsicht` |
| `package.json`, `.env.example` | `dev` auf `127.0.0.1`, Vorlage für `.env.local` |
| `docs/tools/Spotify Web API.md` | Tool-Notiz mit Einrichtung im Developer Dashboard |

## Aufgaben

### Aufgabe 1: PKCE-Bausteine

**Dateien:** Neu `lib/spotify/pkce.ts`, Test `__tests__/lib/spotify/pkce.test.ts`

**Schnittstellen:**
- Liefert: `SCOPES: string` (die Scopes aus „Annahmen“, mit Leerzeichen getrennt),
  `zufallsText(laenge: number): string` (Zeichen aus `A–Z a–z 0–9 - . _ ~`, über `crypto.getRandomValues`),
  `codeChallenge(verifier: string): Promise<string>` (SHA-256, Base64url ohne `=`),
  `anmeldeUrl(p: { clientId: string; redirectUri: string; challenge: string; state: string }): string`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("codeChallenge ergibt den Testwert aus RFC 7636", async () => {
  expect(await codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
    .toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});
test("zufallsText hat die Länge und nur erlaubte Zeichen", () => {
  const text = zufallsText(64);
  expect(text).toMatch(/^[A-Za-z0-9\-._~]{64}$/);
  expect(zufallsText(64)).not.toBe(text);
});
test("anmeldeUrl führt zu Spotify mit PKCE und allen Scopes", () => {
  const url = new URL(anmeldeUrl({ clientId: "abc", redirectUri: "http://127.0.0.1:3000/callback", challenge: "xyz", state: "s1" }));
  expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    client_id: "abc", response_type: "code", redirect_uri: "http://127.0.0.1:3000/callback",
    code_challenge_method: "S256", code_challenge: "xyz", state: "s1", scope: SCOPES,
  });
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**
  `npx vitest run __tests__/lib/spotify/pkce.test.ts`, erwartet: FAIL, `@/lib/spotify/pkce` lässt sich nicht auflösen.
- [x] **Schritt 3: `SCOPES`, `zufallsText`, `codeChallenge`, `anmeldeUrl` schreiben.** `zufallsText` bildet jedes
  Zufallsbyte mit `% 66` auf das Alphabet ab. `anmeldeUrl` baut die Parameter mit `URLSearchParams`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen** (gleicher Befehl, PASS).
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add PKCE helpers for Spotify login"`

### Aufgabe 2: Token tauschen und erneuern

**Dateien:** Neu `lib/spotify/abruf.ts`, `lib/spotify/token.ts`, `__tests__/hilfen/antwort.ts`, Test
`__tests__/lib/spotify/token.test.ts`

**Schnittstellen:**
- Liefert in `__tests__/hilfen/antwort.ts` (Testhilfe für alle Spotify-Tests):
  `antwort(body: object, status = 200): Response` (JSON-Antwort wie von Spotify).
- Liefert in `abruf.ts`: `type Abruf = (url: string, init?: RequestInit) => Promise<Response>`,
  `class SpotifyFehler extends Error { status: number }`,
  `jsonOderFehler<T>(antwort: Response): Promise<T>` (wirft `SpotifyFehler` mit dem Status, wenn `!antwort.ok`).
- Liefert in `token.ts`: `type Token = { accessToken: string; refreshToken: string; ablauf: number }` (`ablauf` in
  Millisekunden seit 1970),
  `codeTauschen(p: { code: string; verifier: string; clientId: string; redirectUri: string }, abruf?: Abruf, jetzt?: number): Promise<Token>`,
  `tokenErneuern(refreshToken: string, clientId: string, abruf?: Abruf, jetzt?: number): Promise<Token>`,
  `istAbgelaufen(token: Token, jetzt?: number): boolean` (60 Sekunden Puffer).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("codeTauschen schickt Code und Verifier und rechnet den Ablauf aus", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }));
  const token = await codeTauschen({ code: "c1", verifier: "v1", clientId: "abc", redirectUri: "http://127.0.0.1:3000/callback" }, abruf, 1_000);
  expect(token).toEqual({ accessToken: "a1", refreshToken: "r1", ablauf: 3_601_000 });
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://accounts.spotify.com/api/token");
  expect(init?.method).toBe("POST");
  expect(Object.fromEntries(new URLSearchParams(init?.body as string))).toEqual({
    grant_type: "authorization_code", code: "c1", redirect_uri: "http://127.0.0.1:3000/callback",
    client_id: "abc", code_verifier: "v1",
  });
});
test("tokenErneuern behält das alte Refresh-Token, wenn Spotify kein neues schickt", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ access_token: "a2", expires_in: 3600 }));
  expect(await tokenErneuern("r1", "abc", abruf, 0)).toEqual({ accessToken: "a2", refreshToken: "r1", ablauf: 3_600_000 });
});
test("tokenErneuern wirft SpotifyFehler 400 bei entzogenem Zugriff", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ error: "invalid_grant" }, 400));
  await expect(tokenErneuern("r1", "abc", abruf, 0)).rejects.toMatchObject({ status: 400 });
});
test("istAbgelaufen gilt schon 60 Sekunden vor dem Ablauf", () => {
  const token: Token = { accessToken: "a", refreshToken: "r", ablauf: 100_000 };
  expect(istAbgelaufen(token, 39_999)).toBe(false);
  expect(istAbgelaufen(token, 40_000)).toBe(true);
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/spotify/token.test.ts`)
- [x] **Schritt 3: `abruf.ts` und `token.ts` schreiben.** POST mit
  `Content-Type: application/x-www-form-urlencoded`, Body als `URLSearchParams(...).toString()`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add Spotify token exchange and refresh"`

### Aufgabe 3: Sitzung im Browser

**Dateien:** Neu `lib/spotify/sitzung.ts`, Test `__tests__/lib/spotify/sitzung.test.ts`

**Schnittstellen:**
- Nutzt: `zufallsText`, `codeChallenge`, `anmeldeUrl` (Aufgabe 1), `Token`, `codeTauschen`, `tokenErneuern`,
  `istAbgelaufen`, `Abruf`, `SpotifyFehler` (Aufgabe 2).
- Liefert: `class AnmeldeFehler extends Error` (Meldung für den DJ auf Deutsch),
  `anmeldungStarten(clientId: string): Promise<string>` (speichert `{ verifier, state }` unter
  `musik-app:anmeldung` im `sessionStorage`, gibt die `anmeldeUrl` zurück, Redirect-URI aus `window.location.origin`),
  `anmeldungAbschliessen(suche: URLSearchParams, clientId: string, abruf?: Abruf, jetzt?: number): Promise<Token>`,
  `gueltigesToken(clientId: string, abruf?: Abruf, jetzt?: number): Promise<Token | null>`,
  `abmelden(): void` (löscht `musik-app:spotify-token`).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("anmeldungStarten merkt sich Verifier und State und gibt die Spotify-Adresse zurück", async () => {
  const url = new URL(await anmeldungStarten("abc"));
  const gemerkt = JSON.parse(sessionStorage.getItem("musik-app:anmeldung")!);
  expect(url.searchParams.get("state")).toBe(gemerkt.state);
  expect(url.searchParams.get("code_challenge")).toBe(await codeChallenge(gemerkt.verifier));
  expect(url.searchParams.get("redirect_uri")).toBe(`${window.location.origin}/callback`);
});
test("anmeldungAbschliessen tauscht den Code einmal und speichert das Token", async () => {
  await anmeldungStarten("abc");
  const { state } = JSON.parse(sessionStorage.getItem("musik-app:anmeldung")!);
  const abruf = vi.fn<Abruf>(async () => antwort({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }));
  await anmeldungAbschliessen(new URLSearchParams({ code: "c1", state }), "abc", abruf, 0);
  expect(JSON.parse(localStorage.getItem("musik-app:spotify-token")!).accessToken).toBe("a1");
  expect(sessionStorage.getItem("musik-app:anmeldung")).toBeNull();
});
test("Abbrechen bei Spotify ergibt „Anmeldung abgebrochen“ ohne Tausch", async () => {
  await anmeldungStarten("abc");
  const abruf = vi.fn<Abruf>();
  await expect(anmeldungAbschliessen(new URLSearchParams({ error: "access_denied" }), "abc", abruf))
    .rejects.toThrow("Anmeldung abgebrochen");
  expect(abruf).not.toHaveBeenCalled();
});
test("fremder oder fehlender State ergibt „Anmeldung ungültig“", async () => {
  await expect(anmeldungAbschliessen(new URLSearchParams({ code: "c1", state: "x" }), "abc", vi.fn<Abruf>()))
    .rejects.toThrow("Anmeldung ungültig");
});
test("gueltigesToken erneuert ein abgelaufenes Token und speichert es", async () => {
  localStorage.setItem("musik-app:spotify-token", JSON.stringify({ accessToken: "alt", refreshToken: "r1", ablauf: 0 }));
  const abruf = vi.fn<Abruf>(async () => antwort({ access_token: "neu", expires_in: 3600 }));
  expect((await gueltigesToken("abc", abruf, 1_000))?.accessToken).toBe("neu");
  expect(JSON.parse(localStorage.getItem("musik-app:spotify-token")!).accessToken).toBe("neu");
});
test("entzogener Zugriff meldet ab statt zu werfen", async () => {
  localStorage.setItem("musik-app:spotify-token", JSON.stringify({ accessToken: "alt", refreshToken: "r1", ablauf: 0 }));
  const abruf = vi.fn<Abruf>(async () => antwort({ error: "invalid_grant" }, 400));
  expect(await gueltigesToken("abc", abruf, 1_000)).toBeNull();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});
test("ohne gespeichertes Token gibt es keins, abmelden löscht es", async () => {
  expect(await gueltigesToken("abc", vi.fn<Abruf>())).toBeNull();
  localStorage.setItem("musik-app:spotify-token", "{}");
  abmelden();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});
```

Bei der Umsetzung ergänzt: „gueltigesToken gibt ein gültiges Token ohne Anfrage zurück“ und „ohne Netz bleibt der DJ
angemeldet und der Fehler kommt durch“ (Rot-Grün durch Ausbauen des Zweigs belegt).

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/spotify/sitzung.test.ts`)
- [x] **Schritt 3: `sitzung.ts` schreiben.** `anmeldungAbschliessen` löscht `musik-app:anmeldung`, bevor es tauscht,
  damit ein zweiter Aufruf mit demselben Code als „ungültig“ endet statt bei Spotify. `gueltigesToken` meldet nur bei
  `SpotifyFehler` mit Status 400 ab, andere Fehler (z. B. kein Netz) wirft es weiter.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add Spotify session in browser storage"`

### Aufgabe 4: Eigene Playlists laden

**Dateien:** Neu `lib/spotify/playlists.ts`, Test `__tests__/lib/spotify/playlists.test.ts`

**Schnittstellen:**
- Nutzt: `Abruf`, `jsonOderFehler` (Aufgabe 2).
- Liefert: `type Playlist = { id: string; name: string; anzahlSongs: number }`,
  `eigenePlaylists(accessToken: string, abruf?: Abruf): Promise<Playlist[]>` (beginnt bei
  `https://api.spotify.com/v1/me/playlists?limit=50`, folgt `next`, bis es `null` ist, Header
  `Authorization: Bearer <accessToken>`).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const seite = (playlists: object[], next: string | null) => antwort({ items: playlists, next });
const eigene = (id: string, total: number) => ({ id, name: `Liste ${id}`, items: { total } });

test("eigenePlaylists folgt allen Seiten und lässt fremde Playlists weg", async () => {
  const abruf = vi.fn<Abruf>()
    .mockResolvedValueOnce(seite([eigene("p1", 120), { id: "fremd", name: "Hitster" }], "https://api.spotify.com/v1/me/playlists?offset=50&limit=50"))
    .mockResolvedValueOnce(seite([eigene("p2", 7)], null));
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 120 },
    { id: "p2", name: "Liste p2", anzahlSongs: 7 },
  ]);
  expect(abruf).toHaveBeenCalledTimes(2);
  expect(abruf.mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer a1" });
});
test("abgelaufenes Token ergibt SpotifyFehler 401", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ error: { status: 401 } }, 401));
  await expect(eigenePlaylists("a1", abruf)).rejects.toMatchObject({ status: 401 });
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/lib/spotify/playlists.test.ts`)
- [x] **Schritt 3: `playlists.ts` schreiben.** Eine Playlist gehört dazu, wenn ihr Feld `items` vorhanden ist,
  `anzahlSongs` ist `items.total`.
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add loading own Spotify playlists"`

### Aufgabe 5: Rückruf-Seite

**Dateien:** Neu `lib/spotify/konfig.ts`, `app/ui/rueckruf.tsx`, `app/callback/page.tsx`, Test
`__tests__/ui/rueckruf.test.tsx`

**Schnittstellen:**
- Nutzt: `anmeldungAbschliessen`, `AnmeldeFehler` (Aufgabe 3).
- Liefert: `clientId(): string | undefined` (liest `process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID` bei jedem Aufruf, leer
  gilt als fehlend), Komponente `Rueckruf({ onFertig }: { onFertig: () => void })`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben** (Adresse setzen mit
  `window.history.replaceState({}, "", "/callback?…")`, `fetch` ersetzen mit `vi.stubGlobal`, Client-ID mit
  `vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc")`)

```ts
test("tauscht den Code auch im StrictMode nur einmal und meldet fertig", async () => {
  await anmeldungStarten("abc");
  const { state } = JSON.parse(sessionStorage.getItem("musik-app:anmeldung")!);
  window.history.replaceState({}, "", `/callback?code=c1&state=${state}`);
  const abruf = vi.fn(async () => antwort({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }));
  vi.stubGlobal("fetch", abruf);
  const onFertig = vi.fn();
  render(<StrictMode><Rueckruf onFertig={onFertig} /></StrictMode>);
  await waitFor(() => expect(onFertig).toHaveBeenCalledTimes(1));
  expect(abruf).toHaveBeenCalledTimes(1);
});
test("zeigt „Anmeldung abgebrochen“ und einen Weg zurück", async () => {
  await anmeldungStarten("abc");
  window.history.replaceState({}, "", "/callback?error=access_denied");
  render(<Rueckruf onFertig={vi.fn()} />);
  expect(await screen.findByText(/Anmeldung abgebrochen/)).toBeDefined();
  expect(screen.getByRole("link", { name: "Zur Startseite" }).getAttribute("href")).toBe("/");
});
```

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/ui/rueckruf.test.tsx`)
- [x] **Schritt 3: `konfig.ts`, `Rueckruf` und `app/callback/page.tsx` schreiben.** `Rueckruf` ist eine
  Client-Komponente: Ein `useRef` verhindert den zweiten Start im StrictMode, der Effekt liest
  `new URLSearchParams(window.location.search)`. Während des Tauschs steht „Anmeldung läuft …“ da, bei `AnmeldeFehler`
  dessen Meldung mit dem Link. Die Seite ist eine Client-Komponente und gibt `onFertig={() => router.replace("/")}`
  (`useRouter` aus `next/navigation`).
- [x] **Schritt 4: Test laufen lassen, er muss bestehen**
- [x] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add Spotify callback page"`

### Aufgabe 6: Startseite

**Dateien:** Neu `app/ui/start.tsx`, Ändern `app/page.tsx`, Test `__tests__/ui/start.test.tsx`, Ändern
`__tests__/page.test.tsx`

**Schnittstellen:**
- Nutzt: `clientId` (Aufgabe 5), `anmeldungStarten`, `gueltigesToken`, `abmelden` (Aufgabe 3), `eigenePlaylists`,
  `Playlist` (Aufgabe 4), `SpielAnsicht` und `SONGLISTE` aus Phase 1.
- Liefert: Komponente `Start()` ohne Props. `app/page.tsx` zeigt Überschrift „Musik-App“ und `<Start />`.

Verhalten: Beim ersten Rendern zeigt `Start` nichts Speicherabhängiges (sonst Hydration-Fehler wie in Phase 1), erst
ein Effekt liest das Token.
- Abgemeldet: Knöpfe „Mit Spotify anmelden“ und „Demo starten“. „Mit Spotify anmelden“ ruft `anmeldungStarten` und
  geht mit `window.location.assign` zu Spotify.
- Ohne Client-ID: „Mit Spotify anmelden“ ist deaktiviert, darunter „Spotify-Client-ID fehlt: trage
  NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local ein.“
- Angemeldet: Überschrift „Deine Playlists“, je Playlist ein Listeneintrag „<Name> (<Anzahl> Songs)“, Knöpfe
  „Abmelden“ und „Demo starten“. Wirft das Laden `SpotifyFehler` 401, meldet `Start` ab.
- „Demo starten“ zeigt `<SpielAnsicht songs={SONGLISTE} />`.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("abgemeldet: Anmelden und Demo, die Demo startet das Spiel aus Phase 1", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  render(<Start />);
  expect(await screen.findByRole("button", { name: "Mit Spotify anmelden" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  expect(screen.getByRole("button", { name: "Spiel starten" })).toBeDefined();
});
test("ohne Client-ID ist Anmelden aus und ein Hinweis erklärt warum", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "");
  render(<Start />);
  expect((await screen.findByRole<HTMLButtonElement>("button", { name: "Mit Spotify anmelden" })).disabled).toBe(true);
  expect(screen.getByText(/NEXT_PUBLIC_SPOTIFY_CLIENT_ID in \.env\.local/)).toBeDefined();
});
test("angemeldet: Playlists mit Anzahl, Abmelden führt zurück zum Anmelden", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  localStorage.setItem("musik-app:spotify-token", JSON.stringify({ accessToken: "a1", refreshToken: "r1", ablauf: Date.now() + 3_600_000 }));
  vi.stubGlobal("fetch", vi.fn(async () => antwort({ items: [{ id: "p1", name: "Partyhits", items: { total: 98 } }], next: null })));
  render(<Start />);
  expect(await screen.findByText("Partyhits (98 Songs)")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
  expect(await screen.findByRole("button", { name: "Mit Spotify anmelden" })).toBeDefined();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});
test("entzogener Zugriff zeigt wieder „Mit Spotify anmelden“", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  localStorage.setItem("musik-app:spotify-token", JSON.stringify({ accessToken: "alt", refreshToken: "r1", ablauf: 0 }));
  vi.stubGlobal("fetch", vi.fn(async () => antwort({ error: "invalid_grant" }, 400)));
  render(<Start />);
  expect(await screen.findByRole("button", { name: "Mit Spotify anmelden" })).toBeDefined();
});
```

`__tests__/page.test.tsx` prüft danach Überschrift „Musik-App“ und den Knopf „Demo starten“ (statt „Spiel starten“).

- [ ] **Schritt 2: Test laufen lassen, er muss fehlschlagen** (`npx vitest run __tests__/ui/start.test.tsx __tests__/page.test.tsx`)
- [ ] **Schritt 3: `Start` schreiben und in `app/page.tsx` einsetzen**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen** (gleicher Befehl, dann `npm test` für alles)
- [ ] **Schritt 5: Prüfen und committen:** `npm run check`, `git commit -m "Add start page with Spotify login and demo"`

### Aufgabe 7: Einrichtung und echte Anmeldung

**Dateien:** Ändern `package.json` (Skript `dev`), Neu `.env.example`, `docs/tools/Spotify Web API.md`, Ändern
`docs/tools/Tools Übersicht.md`, `CLAUDE.md` (Befehl `npm run dev` mit neuer Adresse)

**Voraussetzung, nur du:** App im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) angelegt,
Redirect-URI `http://127.0.0.1:3000/callback`, APIs „Web API“ und „Web Playback SDK“ angehakt, Client-ID in
`.env.local` als `NEXT_PUBLIC_SPOTIFY_CLIENT_ID=<id>`.

- [ ] **Schritt 1: Skript `dev` auf `next dev -H 127.0.0.1` ändern**, `.env.example` mit
  `NEXT_PUBLIC_SPOTIFY_CLIENT_ID=` anlegen, in `CLAUDE.md` die Adresse bei `npm run dev` auf
  `http://127.0.0.1:3000` ändern.
- [ ] **Schritt 2: Tool-Notiz `Spotify Web API.md`** nach dem Aufbau aus `Tools Übersicht.md` (Was, wofür, Begriffe
  Client-ID, Redirect-URI, Scope, Token, Einrichtung im Dashboard, Development Mode mit 5 Konten, Fehler) und Zeile in
  „Im Einsatz“.
- [ ] **Schritt 3: Echt prüfen.** `npm run dev`, `http://127.0.0.1:3000` öffnen, anmelden, Rechte bestätigen.
  Erwartet: zurück auf der Startseite, „Deine Playlists“ mit deinen eigenen Playlists und Anzahl Songs. Seite neu
  laden: weiter angemeldet. „Abmelden“: wieder „Mit Spotify anmelden“. Einmal bei Spotify „Abbrechen“: Meldung
  „Anmeldung abgebrochen“. Auffälligkeiten als Fehler in die Tool-Notiz.
- [ ] **Schritt 4: Prüfen und committen:** `npm run check`, `npm run build`,
  `git commit -m "Run dev server on 127.0.0.1 and document Spotify setup"`
- [ ] **Schritt 5: Plan abschließen:** `status: abgeschlossen`, PR öffnen, `gh pr checks <nr>` grün, mergen.
