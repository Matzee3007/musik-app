---
titel: Spotify Web API
status: aktiv
erstellt: 2026-10-19
tags: [tools, spotify, oauth, pkce]
---

# Spotify Web API

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Anmeldung:
[[0003-spotify-anmeldung-nur-im-browser|ADR 0003]], Plan: [[2026-10-19-spotify-anmeldung]].

## Was ist das?

Die Schnittstelle, über die eine eigene App auf ein Spotify-Konto zugreift: Playlists lesen, Songs abspielen,
Wiedergabe steuern. Die App meldet sich dafür im Namen des Nutzers an (OAuth) und bekommt ein Token, das sie bei jeder
Anfrage mitschickt. Das Abspielen im Browser übernimmt das Web Playback SDK (ab Plan C).

## Wofür nutzen wir es?

- Anmeldung des DJs, nur er braucht ein Spotify-Konto (Premium)
- seine eigenen und kollaborativen Playlists anzeigen
- ab Plan B Songs einer Playlist laden (mit ISRC für MusicBrainz), ab Plan C abspielen

## Wichtige Begriffe

- **Client-ID:** öffentliche Kennung unserer App bei Spotify, steht in `.env.local` als
  `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`. Ein Client-Secret brauchen wir nicht (PKCE).
- **Redirect-URI:** Adresse, zu der Spotify nach der Anmeldung zurückleitet, bei uns `http://127.0.0.1:3000/callback`
  (lokal) und `https://musik-bingo.vercel.app/callback` (Production auf [[projects/musik-app/docs/tools/Vercel|Vercel]]).
  Die App schickt `window.location.origin` + `/callback`. Sie muss Zeichen für Zeichen mit einer im Dashboard
  eingetragenen übereinstimmen. `localhost` erlaubt Spotify nicht.
- **Scope:** ein Recht, das die App erbittet, z. B. `playlist-read-private`. Die Liste steht in `lib/spotify/pkce.ts`.
- **Access-Token:** gilt 1 Stunde, geht bei jeder Anfrage im Header `Authorization: Bearer …` mit.
- **Refresh-Token:** holt ein neues Access-Token, ohne dass der DJ sich neu anmeldet.
- **PKCE:** Anmeldung ohne Client-Secret. Die App erzeugt einen geheimen `code_verifier`, schickt zuerst nur dessen
  Fingerabdruck (`code_challenge`) und beim Tausch den Verifier selbst.
- **Development Mode:** Jede neue App startet so. Höchstens 5 freigeschaltete Konten, der Besitzer braucht Premium.

## Wie haben wir es eingerichtet?

Einmalig im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), mit dem Spotify-Konto des DJs:

1. „Create app“: Name und Beschreibung frei wählen.
2. Redirect URI: `http://127.0.0.1:3000/callback` eintragen und mit „Add“ übernehmen.
3. Bei „Which API/SDKs are you planning to use?“ **Web API** und **Web Playback SDK** anhaken.
4. Speichern, dann in den Einstellungen der App die **Client ID** kopieren.
5. Im Projekt `.env.example` nach `.env.local` kopieren und die Client-ID eintragen:
   `NEXT_PUBLIC_SPOTIFY_CLIENT_ID=<id>`. `.env.local` ist in der `.gitignore`.
6. Dev-Server neu starten, Next.js liest `.env.local` nur beim Start.
7. Für Production (2026-10-21): unter „Redirect URIs“ zusätzlich `https://musik-bingo.vercel.app/callback`, „Save“.
   Die Client-ID steht bei Vercel als Umgebungsvariable, nur für Production.

Code: `lib/spotify/` (Anmeldung, Token, Playlists), Startseite `app/ui/start.tsx`, Rückkehr `app/callback/page.tsx`.

## Typischer Ablauf

1. `npm run dev`, `http://127.0.0.1:3000` öffnen (nicht `localhost`).
2. „Mit Spotify anmelden“ → Spotify fragt nach den Rechten → zurück auf `/callback` → Startseite mit Playlists.
3. Das Token bleibt im Browser gespeichert, nach einer Stunde erneuert die App es selbst.

Unter `https://musik-bingo.vercel.app` genauso, nur ohne `npm run dev`. `localStorage` gilt je Adresse: Token und
vorbereitete Playlists von `127.0.0.1` fehlen dort, der DJ meldet sich einmal neu an und bereitet neu vor.

## Alle bisher benutzten Befehle

```bash
cp .env.example .env.local    # Vorlage für die Client-ID kopieren, dann ausfüllen
npm run dev                   # startet auf http://127.0.0.1:3000
```

## Fehler, die uns passiert sind

- **`localhost:3000` antwortet trotz `next dev -H 127.0.0.1`.** Ursache: macOS löst `localhost` auch zu `127.0.0.1`
  auf. Folge: Unter `localhost` geöffnet, schickt die App `http://localhost:3000/callback` als Redirect-URI, Spotify
  meldet „Invalid redirect URI“. Lösung: immer `http://127.0.0.1:3000` öffnen.
- **`redirect_uri: Not matching configuration`** (2026-10-21, erste Anmeldung unter `musik-bingo.vercel.app`).
  Ursache: Die im Dashboard eingetragene Redirect-URI wich von `https://musik-bingo.vercel.app/callback` ab. Lösung:
  genau diese Adresse eintragen, „Save“.
- **Vorbereiten bleibt bei „Songs werden geladen …“ stehen** (2026-10-21, gefolgte Playlist mit 52 Songs). In der
  Konsole `GET …/playlists/<id>/items… 403 (Forbidden)`, Antwort nur `{"error":{"status":403,"message":"Forbidden"}}`.
  Ursache: Die Playlist gehörte nicht dem DJ, Spotify schickte in der Playlist-Liste trotzdem `items` mit, also zeigte
  die App sie an. Die Ansicht zeigte außerdem nur Fehler von MusicBrainz. Lösung: Filter nach `owner.id` (aus
  `GET /v1/me`) oder `collaborative`, Spotify-Fehler beim Laden als Meldung (Plan A, Aufgabe 4).

## Web Playback SDK

Macht den Browser des Tisches zu einem Spotify-Gerät „Musik-App Tisch“ (Code: `lib/spotify/player.ts`, Plan:
[[2026-10-19-abspielen]]). Nur mit Spotify Premium.

- **Laden:** Skript `https://sdk.scdn.co/spotify-player.js`, fertig ist es, wenn es
  `window.onSpotifyWebPlaybackSDKReady` aufruft. Die App lädt es genau einmal (`sdkLaden`).
- **Verbinden:** `new Spotify.Player({ name, getOAuthToken })`, dann `connect()`. Das Ereignis `ready` liefert die
  `device_id`. Fehler kommen als Ereignisse: `account_error` (kein Premium), `initialization_error` (Browser kann es
  nicht), `authentication_error` (Token ungültig). Die App zeigt dann „Musik nicht verfügbar: …“ und spielt ohne Musik.
- **Ton freischalten:** `activateElement()` muss aus einem Klick kommen, sonst blockiert der Browser den Ton. Die App
  ruft es beim Klick auf „Spiel starten“ auf.
- **Song starten:** nicht über das SDK, sondern über die Web API: `PUT /me/player/play?device_id=…` mit
  `{ "uris": ["spotify:track:<id>"], "position_ms": 0 }`, Antwort `204` ohne Inhalt. Scope `user-modify-playback-state`.
- **Steuern:** `pause()`, `resume()`, `seek(0)`; „Nochmal“ ist `seek(0)` und danach `resume()`.
- **Trennen:** `disconnect()` beim Verlassen der Ansicht, sonst bleibt das Gerät in Spotify stehen.

## Stand der API (Oktober 2026)

- Playlist-Songs über `/playlists/{id}/items` statt `/tracks`, nur für eigene oder kollaborative Playlists, sonst 403.
  Bei fremden fehlt das Feld `items` meist, bei gefolgten nicht. Die App erkennt eigene deshalb an `owner.id` gleich
  der ID aus `GET /v1/me`, geteilte an `collaborative: true`.
- `external_ids` (ISRC) wurde im Februar 2026 gestrichen und im März wieder eingeführt.
- Suche höchstens 10 Treffer, keine Audio-Analyse für neue Apps.
- Quellen: [Migration Guide Februar 2026](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide),
  [Changelog März 2026](https://developer.spotify.com/documentation/web-api/references/changes/march-2026)
