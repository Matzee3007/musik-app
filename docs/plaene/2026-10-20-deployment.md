---
titel: "Plan: Deployment auf Vercel"
status: aktiv
erstellt: 2026-10-20
tags: [plan, vercel, deployment, phase-3]
---

# Plan: Deployment auf Vercel

**Ziel:** Die heutige App läuft unter `https://musik-bingo.vercel.app`, mit Spotify-Anmeldung und Musik. Jeder PR
bekommt eine Vorschau-Adresse, die nur die Demo anbietet.

**Vorgehen:** Vercel holt den Code über die Git-Verbindung von GitHub: Ein Merge in `main` erneuert die feste Adresse
(Production), jeder PR bekommt ein eigenes Vorschau-Deployment (Preview). Die Spotify-Client-ID steht nur in der
Umgebung „Production“ von Vercel. Vorschauen haben deshalb keine und zeigen nur die Demo. Am Code ändert sich nur der
Hinweis auf der Startseite und die Node-Version in `package.json`.

**Technik:** Vercel (Git-Verbindung, keine Vercel-CLI nötig), Next.js 16, Node 24. Keine neuen Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 3 (Deployment,
Plan A); [[0003-spotify-anmeldung-nur-im-browser|ADR 0003]] (zweite Redirect-URI).

## Feste Vorgaben

- Adresse `https://musik-bingo.vercel.app`, Name ohne „hitster“. Ist der Name vergeben, hängt Vercel etwas an; dann
  gilt die angezeigte Adresse überall, wo hier `musik-bingo.vercel.app` steht.
- Redirect-URI bei Spotify genau `https://musik-bingo.vercel.app/callback`, ohne Schrägstrich am Ende. Die alte
  `http://127.0.0.1:3000/callback` bleibt eingetragen.
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` in Vercel nur für die Umgebung **Production**, nicht für Preview und Development.
- Kein Client-Secret und kein anderer Schlüssel in Vercel oder im Repo (ADR 0003, `REVIEW.md`).
- Node 24 wie lokal und in der CI (`.github/workflows/ci.yml`).
- Schritte im Browser (Vercel, Spotify Dashboard) macht der Entwickler, Claude erklärt sie vorher.

## Prüf-Schwerpunkte

1. **Erster Start auf Vercel:** Token und vorbereitete Playlists liegen im `localStorage` von `127.0.0.1` und fehlen
   unter der neuen Adresse. Erwartet: Startseite mit „Mit Spotify anmelden“, nach Anmeldung und einmaligem
   Vorbereiten läuft alles wie lokal (Aufgabe 3).
2. **Redirect-URI nicht genau gleich** (z. B. mit `/` am Ende): Spotify zeigt „INVALID_CLIENT: Invalid redirect URI“.
   Erwartet: Anmeldung klappt mit genau der Adresse aus den Vorgaben (Aufgabe 3).
3. **MusicBrainz-Route als Vercel Function:** Vorbereiten einer Playlist mit mindestens 20 Songs läuft durch, einzelne
   503-Antworten fängt das Wiederholen in `lib/vorbereiten.ts` ab. Erwartet: „N Songs bereit“ wie lokal (Aufgabe 3).
4. **Vorschau-Adresse eines PRs:** Spotify-Knopf ausgegraut mit Hinweis, Demo spielbar (Aufgabe 1, Aufgabe 2).
   Vercel schützt Vorschauen standardmäßig mit einer Vercel-Anmeldung (Deployment Protection); das bleibt so.
5. **Musik über HTTPS:** Das Web Playback SDK braucht eine sichere Verbindung. Erwartet: Song läuft am Laptop unter
   der Vercel-Adresse wie unter `127.0.0.1` (Aufgabe 3).

### Aufgabe 1: Startseite ohne Client-ID

Der Hinweis „trage NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local ein“ stimmt lokal, auf einer Vorschau-Adresse ist er
irreführend. Neuer Text, der für beide Fälle passt.

**Dateien:**
- Ändern: `app/ui/start.tsx` (Hinweis unter dem Knopf „Mit Spotify anmelden“)
- Test: `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: `clientId()` aus `lib/spotify/konfig.ts` (liefert `undefined`, wenn die Variable fehlt)
- Liefert: nichts Neues

- [x] **Schritt 1: Fehlschlagenden Test schreiben**

Den vorhandenen Test „ohne Client-ID ist Anmelden aus und ein Hinweis erklärt warum“ anpassen (er setzt die Variable
schon mit `vi.stubEnv` leer). Prüfungen: Knopf „Mit Spotify anmelden“ ist `disabled`, Text
„Spotify ist hier nicht eingerichtet, nur die Demo. Lokal: NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local eintragen.“
ist sichtbar, Knopf „Demo starten“ ist aktiv.

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**

`npx vitest run __tests__/ui/start.test.tsx`
Erwartet: FAIL, der neue Text fehlt.

- [x] **Schritt 3: Hinweis in `app/ui/start.tsx` ersetzen**

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui/start.test.tsx`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/start.tsx __tests__/ui/start.test.tsx
git commit -m "Explain missing Spotify client ID on preview deployments"
```

### Aufgabe 2: Vercel-Projekt anlegen

**Dateien:**
- Ändern: `package.json` (`"engines": { "node": "24.x" }`, Vercel liest daraus die Node-Version)
- Neu: `docs/tools/Vercel.md` (Tool-Notiz: was Vercel ist, Production und Preview, Umgebungsvariablen, Deployment
  Protection, Fehler mit Ursache und Lösung)
- Ändern: `docs/tools/Tools Übersicht.md` (Eintrag Vercel)

**Schnittstellen:**
- Nutzt: Aufgabe 1 (Hinweis für Vorschauen)
- Liefert: Production-Adresse `https://musik-bingo.vercel.app` für Aufgabe 3 und für Plan B (QR-Code)

- [x] **Schritt 1: `engines` in `package.json` eintragen, `npm run check` grün, committen**

```bash
git commit -am "Pin Node 24 for Vercel"
```

- [x] **Schritt 2: Branch pushen und PR öffnen**, damit Vercel gleich nach dem Verbinden ein Vorschau-Deployment baut.

- [x] **Schritt 3 (Entwickler, im Browser): Projekt importieren**

vercel.com → „Add New… → Project“ → GitHub-Repo `musik-app` importieren (Vercel um Zugriff auf genau dieses Repo
bitten lassen) → Projektname `musik-bingo`, Framework „Next.js“ (erkennt Vercel selbst), Build-Befehl und Ordner
unverändert → unter „Environment Variables“ `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` mit der Client-ID aus `.env.local`,
**nur Production** angehakt → „Deploy“.

- [x] **Schritt 4: Production prüfen**

`curl -s -o /dev/null -w "%{http_code}\n" https://musik-bingo.vercel.app`
Erwartet: `200`. Im Browser: Startseite mit aktivem Knopf „Mit Spotify anmelden“. Auf dem Handy: Demo bis zur ersten
Auflösung spielbar.

- [x] **Schritt 5: Vorschau prüfen**

`gh pr checks <nr>` zeigt den Vercel-Check, der PR einen Kommentar mit der Vorschau-Adresse. Erwartet: Dort ist
„Mit Spotify anmelden“ ausgegraut mit dem Hinweis aus Aufgabe 1, die Demo läuft.

- [x] **Schritt 6: Tool-Notiz und Übersicht schreiben, committen**

Aus dem Review von PR #22 in die Notiz: Eine geänderte Umgebungsvariable gilt erst nach „Redeploy“ (`NEXT_PUBLIC_*`
steckt fest im gebauten Code). Die Vercel-Anmeldung (Deployment Protection) schützt Vorschauen und die Nebenadressen
von Production (`musik-bingo-<hash>-….vercel.app`), nicht `musik-bingo.vercel.app`.

Dazu `.github/workflows/ci.yml`: `node-version: 24` durch `node-version-file: package.json` ersetzen, damit die
Node-Version nur noch in `engines` steht.

```bash
git add docs/tools/Vercel.md "docs/tools/Tools Übersicht.md"
git commit -m "Add Vercel tool note"
```

### Aufgabe 3: Spotify unter der Vercel-Adresse

**Dateien:**
- Ändern: `docs/tools/Spotify Web API.md` (beide Redirect-URIs, Hinweis „`localStorage` je Adresse“)
- Ändern: `CLAUDE.md` (unter „Befehle“ die Production-Adresse und dass ein Merge in `main` sie erneuert)

**Schnittstellen:**
- Nutzt: Production-Adresse aus Aufgabe 2
- Liefert: Anmeldung und Musik unter der Production-Adresse, Grundlage für Plan B

- [x] **Schritt 1 (Entwickler, im Browser): Redirect-URI eintragen**

developer.spotify.com → Dashboard → App → „Edit Settings“ → „Redirect URIs“ → `https://musik-bingo.vercel.app/callback`
hinzufügen, „Save“.

- [x] **Schritt 2: Anmeldung, Vorbereiten und Musik prüfen (Prüf-Schwerpunkte 1, 2, 3, 5)**

Immer über `https://musik-bingo.vercel.app`, nicht über eine Nebenadresse aus „Visit“ oder der Deployment-Liste: Dort
hat die App auch die Client-ID, Spotify lehnt die Redirect-URI aber ab (Review PR #22). MusicBrainz begrenzt je
IP-Adresse, und Vercel-Funktionen teilen sich IPs. Kommen beim Vorbereiten deutlich mehr „beschäftigt“ als lokal oder
fehlen Jahre, Plan A um eine Aufgabe erweitern, statt weiterzumachen.

Am Laptop `https://musik-bingo.vercel.app` öffnen → anmelden → eine Playlist mit mindestens 20 Songs vorbereiten →
Spiel starten → eine Runde mit Musik bis zur Auflösung. Erwartet: keine Fehlermeldung, Song läuft, Erscheinungsjahre
wie lokal.

- [x] **Schritt 3: Doku ergänzen und committen**

```bash
git add "docs/tools/Spotify Web API.md" CLAUDE.md docs/plaene/2026-10-20-deployment.md
git commit -m "Document production address and Spotify redirect URI"
```

**Fertig, wenn:** `https://musik-bingo.vercel.app` liefert die App, der DJ meldet sich dort an, bereitet eine Playlist
vor und hört in einer Runde Musik. Die Vorschau des PRs bietet nur die Demo an. `npm run check` und `gh pr checks`
grün, `plan-pruefer` hat den Branch gegen diesen Plan geprüft.

### Aufgabe 4: Fremde Playlists und Spotify-Fehler beim Laden

Nachgetragen am 2026-10-21 beim Test von Aufgabe 3, Schritt 2: Eine gefolgte Playlist (nicht vom DJ erstellt) mit
52 Songs blieb unter `https://musik-bingo.vercel.app` bei „Songs werden geladen …“ stehen. In der Konsole:
`GET https://api.spotify.com/v1/playlists/<id>/items?… 403 (Forbidden)` und `Uncaught (in promise) SpotifyFehler:
Spotify antwortet mit 403`. Zwei Ursachen:

1. `eigenePlaylists` erkennt fremde Playlists am fehlenden Feld `items`. Spotify schickt es bei dieser gefolgten
   Playlist trotzdem mit, die Songs gibt es aber nicht heraus (seit Februar 2026 nur für eigene oder kollaborative).
2. `VorbereitenAnsicht` zeigt nur `MusicBrainzBeschaeftigt` an und wirft jeden anderen Fehler weiter. Die Ansicht
   bleibt dann ohne Meldung stehen, ebenso bei 401 oder 429.

**Dateien:**
- Ändern: `lib/spotify/playlists.ts` (Filter nach Besitzer), `app/ui/vorbereiten-ansicht.tsx` (Spotify-Fehler zeigen)
- Test: `__tests__/lib/spotify/playlists.test.ts`, `__tests__/ui/vorbereiten-ansicht.test.tsx`
- Ändern: `docs/tools/Spotify Web API.md` (Abschnitt „Stand der API“, Fehler mit Ursache und Lösung)

**Schnittstellen:**
- `eigenePlaylists(accessToken, abruf)` bleibt gleich, fragt zusätzlich `GET /v1/me` nach der Spotify-ID des DJs und
  behält nur Playlists mit `owner.id` gleich dieser ID oder `collaborative: true`.
- `VorbereitenAnsicht` zeigt bei einem `SpotifyFehler` beim Laden eine Meldung, bei 403 „Spotify gibt die Songs dieser
  Playlist nicht heraus. Kopiere sie in eine eigene Playlist.“

- [x] **Schritt 1: Roter Test für den Filter, dann grün**

Testfall: `/me` liefert `id: "dj"`, die Liste enthält eine eigene, eine kollaborative fremde und eine gefolgte fremde
Playlist, alle mit `items`. Erwartet: nur die ersten beiden.
`npx vitest run __tests__/lib/spotify/playlists.test.ts`

- [x] **Schritt 2: Roter Test für die Meldung, dann grün**

Testfall: `playlistSongs` scheitert mit `SpotifyFehler(403, …)`. Erwartet: Meldung statt „Songs werden geladen …“.
`npx vitest run __tests__/ui/vorbereiten-ansicht.test.tsx`

- [x] **Schritt 3: Prüfen, Doku ergänzen, committen**

```bash
npm run check
git commit -am "Hide followed playlists and show Spotify errors while loading"
```

Danach auf der Vorschau bzw. nach dem Merge unter `musik-bingo.vercel.app`: Die gefolgte Playlist fehlt in der Liste.

Aus dem Review von PR #24, umgesetzt: Auch jeder andere Fehler beim Laden zeigt eine Meldung, ohne Netz „Keine
Verbindung. Prüfe das Internet und versuch es nochmal.“ (fetch meldet das als `TypeError`). Bei 403 fehlt
„Nochmal versuchen“, weil ein neuer Versuch nicht hilft. Offen, in der Übergabe: eine kollaborative Playlist, der der
DJ nur folgt, könnte trotz Filter 403 liefern (dann kommt wenigstens die Meldung); bei 401 nutzt „Nochmal versuchen“
dasselbe alte Token; scheitert `/v1/me`, bleibt die Playlist-Liste leer wie bisher bei `/me/playlists`.

**Fertig, wenn:** Fremde gefolgte Playlists erscheinen nicht mehr, ein Spotify-Fehler beim Laden zeigt eine Meldung
statt stehen zu bleiben, beide Tests grün.
