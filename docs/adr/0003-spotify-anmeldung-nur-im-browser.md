---
titel: "ADR 0003: Spotify-Anmeldung mit PKCE nur im Browser"
status: akzeptiert
erstellt: 2026-10-19
tags: [adr, architektur, spotify, oauth]
---

# ADR (Architecture Decision Record) 0003: Spotify-Anmeldung mit PKCE nur im Browser

## Kontext

In Phase 2 meldet sich der DJ bei Spotify an (OAuth). Spotify erlaubt dafür den Authorization Code Flow mit PKCE
(Proof Key for Code Exchange), der ohne Client-Secret auskommt. Der alte Implicit Grant ist abgeschaltet. Das Web
Playback SDK spielt im Browser und braucht das Access-Token dort, egal wo es getauscht wurde. Next.js hätte einen
Server-Teil, der den Tausch übernehmen könnte ([[projects/musik-app/docs/adr/0001-stack|ADR 0001]]).

## Entscheidung

Die ganze Anmeldung läuft im Browser: Die App erzeugt `code_verifier` und `code_challenge`, leitet zu Spotify weiter,
tauscht den zurückgegebenen Code selbst gegen Access- und Refresh-Token und hält beide im Browser. In `.env.local`
steht nur die öffentliche Client-ID, es gibt kein Client-Secret.

## Alternativen

- **Tausch über eine Route des Next.js-Servers mit Client-Secret:** schützt das Refresh-Token besser (z. B. als
  `httpOnly`-Cookie), braucht aber eigenen Server-Code für Tausch und Erneuern, und das Access-Token muss trotzdem in
  den Browser. Für eine private App mit einem DJ lohnt das nicht.
- **Fertige Bibliothek (z. B. Auth.js):** weniger eigener Code, aber das Lernziel „Spotify über OAuth einbinden“
  bliebe hinter der Bibliothek verborgen.

## Konsequenzen

- Kein Geheimnis im Projekt, das versehentlich ins Repo geraten kann. Die Client-ID darf öffentlich sein.
- Wer Zugriff auf den Browser des Laptops hat, hat auch das Token. Für einen privaten Spieleabend ist das in Ordnung.
- Die Redirect-URI ist `http://127.0.0.1:3000/...`, Spotify erlaubt kein `localhost`. Ab Phase 3 kommt die
  Vercel-Adresse als zweite Redirect-URI dazu.
- Der Server-Teil von Next.js bleibt trotzdem nötig, für MusicBrainz (eigener User-Agent, 1 Anfrage pro Sekunde).
