---
titel: "ADR 0001: Stack"
status: akzeptiert
erstellt: 2026-10-18
tags: [adr, architektur, stack]
---

# ADR (Architecture Decision Record) 0001: Stack

## Kontext

Die Musik-App ist ein Partyspiel im Browser: Der Laptop als „Tisch“ spielt Musik über Spotify und zeigt das Rad,
die Mitspieler nutzen ihre Handys für Bingo-Karte und Antworten. Technisch braucht sie:

- eine Weboberfläche für Laptop und Handy, mit Animation (Rad) und Live-Updates zwischen den Geräten
- Spotify: OAuth-Anmeldung des DJs, Web API (eigene Playlists lesen), Web Playback SDK (läuft nur im Browser)
- eine Datenbank für Songs mit korrigierten Jahren, Spielräume und später das Scoreboard
- eine zweite Datenquelle für das Original-Erscheinungsjahr

Randbedingungen: Lernziel ist TypeScript, der Entwickler kennt aus sport-fantasy Python, FastAPI, Supabase und
GitHub Actions. Kosten möglichst null (Hobbyprojekt für wenige Freunde). Spotify erlaubt im Development Mode
höchstens 5 freigeschaltete Konten, der Besitzer hat Premium.

## Entscheidung

| Aufgabe | Werkzeug | Hauptgrund |
|---|---|---|
| Sprache | TypeScript | Lernziel. Fast alles läuft im Browser, das Web Playback SDK ist eine JavaScript-Bibliothek |
| Framework | Next.js (React), Version 16.x | Oberfläche und Server-Teil (OAuth-Rückruf, MusicBrainz-Abfragen) in einem Projekt, größte Community und Doku |
| Laufzeit und Pakete | Node.js 24 LTS, npm | Node 24 ist aktuelle LTS-Version, npm kommt mit Node mit |
| Daten und Echtzeit | Supabase (Postgres, Realtime) | Realtime-Kanäle für die Räume, Postgres und RLS kennt der Entwickler schon |
| Hosting | Vercel | passt zu Next.js (gleicher Hersteller), kostenloser Hobby-Plan |
| Tests | Vitest, später Playwright | Vitest ist schnell und versteht TypeScript ohne Zusatz, Playwright testet im echten Browser |
| Linter und Format | ESLint, Prettier | Standard bei Next.js, viel Doku |
| Original-Jahr | MusicBrainz | frei, kein Schlüssel, Lookup per ISRC, Feld `first-release-date` |

## Alternativen

- **Python weiter (FastAPI wie in sport-fantasy):** bekannte Bausteine, aber das Spiel lebt im Browser, dort wäre
  trotzdem JavaScript nötig. Verfehlt das Lernziel.
- **SvelteKit statt Next.js:** schlanker und leichter zu lesen, aber kleinere Community und weniger Beispiele für
  Spotify-Einbindung.
- **Vite mit React ohne Server-Teil:** einfacher, aber OAuth-Rückruf und MusicBrainz-Abfragen (User-Agent, 1 Anfrage
  pro Sekunde) brauchen einen Server.
- **PartyKit oder Cloudflare Durable Objects statt Supabase:** speziell für Echtzeit-Räume, aber neu und ohne
  Datenbank fürs Scoreboard.
- **Firebase statt Supabase:** ähnlich bequem, aber NoSQL und für den Entwickler komplett neu.
- **Netlify statt Vercel:** gleichwertig, Next.js läuft auf Vercel aber ohne Anpassungen.
- **Jest statt Vitest:** verbreitet, aber langsamer und braucht für TypeScript mehr Einrichtung.
- **Biome statt ESLint und Prettier:** ein Werkzeug für beides und schneller, aber Next.js richtet ESLint ein.
- **pnpm statt npm:** schneller und sparsamer, aber ein Werkzeug mehr zu lernen.
- **Discogs statt MusicBrainz:** gute Daten, braucht aber einen API-Schlüssel. Bleibt Ausweichquelle.
- **Node 26:** wird erst am 2026-10-28 LTS.

## Konsequenzen

- Node.js ist auf dem Mac noch nicht installiert, das kommt in Phase 0 (Homebrew).
- Spotify bestimmt die Architektur: Nur der DJ meldet sich an, Mitspieler brauchen kein Konto. Endet das Premium-Abo
  des Entwicklers, funktioniert die App nicht mehr. Spotify hat die API 2024 bis 2026 mehrfach eingeschränkt, das
  kann wieder passieren.
- Supabase und Vercel kommen erst in Phase 3. Bis dahin läuft alles lokal mit `npm run dev`.
- Der ruff-Hook aus sport-fantasy ist auf Python zugeschnitten, für TypeScript entsteht ein eigener, z. B. mit
  Prettier. Der Hook `env-schutz.sh` passt auch hier, sobald `.env` echte Geheimnisse enthält (Spotify ab Phase 2).
  Ein Stack-Paket im Ecosystem (`plugins/`) gibt es noch nicht.
- Für TypeScript und Next.js gibt es noch kein Rezept in `STACKS.md` des Ecosystems. Es entsteht mit diesem Projekt.
