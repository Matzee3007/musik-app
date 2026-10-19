---
titel: MusicBrainz
status: aktiv
erstellt: 2026-10-19
tags: [tools, musicbrainz, erscheinungsjahr, isrc]
---

# MusicBrainz

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan: [[2026-10-19-vorbereiten]],
Begriff im [[projects/musik-app/docs/Glossar|Glossar]]: Erscheinungsjahr.

## Was ist das?

Eine freie Musik-Datenbank, gepflegt von Freiwilligen, mit offener Schnittstelle ohne Schlüssel. Sie kennt zu jeder
Aufnahme (Recording) das Datum der ersten Veröffentlichung.

## Wofür nutzen wir es?

Für das **Erscheinungsjahr** eines Songs. Spotify liefert nur das Jahr des Albums, auf dem der Song liegt, bei
Remastern und Best-ofs also oft Jahrzehnte zu spät. MusicBrainz ordnet einen Remaster dagegen derselben Aufnahme zu
wie das Original.

## Wichtige Begriffe

- **ISRC** (International Standard Recording Code): weltweit eindeutige Nummer einer Aufnahme, z. B. `GBUM71029604`.
  Spotify liefert ihn je Song unter `external_ids.isrc`.
- **Recording:** eine Aufnahme in MusicBrainz. Ein ISRC zeigt meist auf eine, manchmal auf mehrere.
- **`first-release-date`:** erste Veröffentlichung der Aufnahme, als `1975`, `1975-11` oder `1975-11-21`, manchmal leer.
- **User-Agent:** Absenderkennung jeder Anfrage. MusicBrainz verlangt `Name/Version ( Kontakt )`, bei uns
  `musik-app/0.1 ( https://github.com/Matzee3007/musik-app )`. Keine persönlichen Daten hinein.

## Wie haben wir es eingerichtet?

Nichts einzurichten, kein Konto, kein Schlüssel. Der Code:

- `lib/musicbrainz.ts`: `GET https://musicbrainz.org/ws/2/isrc/<isrc>?fmt=json`, frühestes Jahr aller Aufnahmen
- `app/api/erscheinungsjahr/route.ts`: Server-Route, nur sie fragt MusicBrainz (eigener User-Agent), prüft den ISRC
- `lib/vorbereiten.ts`: fragt Song für Song mit 1,1 Sekunden Pause, speichert jedes Jahr sofort im Browser

## Typischer Ablauf

1. DJ klickt eine Playlist an, die App lädt die Songs von Spotify.
2. Für jeden noch unbekannten Song: Browser → `/api/erscheinungsjahr?isrc=…` → Server → MusicBrainz.
3. Ergebnis je Spotify-Track-ID im `localStorage`, beim nächsten Öffnen keine Anfrage mehr.

## Alle bisher benutzten Befehle

```bash
# Eine Abfrage von Hand, mit dem curl von macOS (das aus Anaconda scheitert am Zertifikat)
/usr/bin/curl -A "musik-app/0.1 ( https://github.com/Matzee3007/musik-app )" \
  "https://musicbrainz.org/ws/2/isrc/GBUM71029604?fmt=json"
```

## Grenzen

- **1 Anfrage pro Sekunde**, sonst 503. Eine Playlist mit 100 Songs braucht beim ersten Vorbereiten knapp 2 Minuten.
- **503 „server is currently busy“** kommt bei etwa jeder fünften Anfrage, auch ohne eigenes Zutun. Grund ist ein
  gemeinsamer Topf aller Nutzer (`x-ratelimit-limit: 1900`), der alle 2 Sekunden neu gefüllt wird
  (`x-ratelimit-reset`) und kurz davor leer ist (`x-ratelimit-remaining` einstellig). Die App versucht es bis zu
  fünfmal mit 1 Sekunde Pause, erst dann zeigt sie „Nochmal versuchen“.
- Unbekannter ISRC: 404, der Song gilt als „nicht gefunden“ und behält das Spotify-Jahr, bis der DJ korrigiert.

## Fehler, die uns passiert sind

- **`curl: (77) error adding trust anchors from file: /opt/anaconda3/ssl/cacert.pem`.** Ursache: Die Shell nimmt das
  `curl` aus Anaconda mit einem Zertifikatspfad, den es nicht lesen kann. Lösung: `/usr/bin/curl` von macOS.
- **Erste Abfrage 503**, der zweite Versuch nach 3 Sekunden ging. Deshalb die Wiederholungen im Code.
- **Jede Playlist brach mit „MusicBrainz ist gerade überlastet.“ ab** (2026-10-19, erster echter Test). Ursache: Die App
  wartete nach einem 503 genau 2 Sekunden, also genau einen Takt des Topfs, und traf so immer wieder dessen leere
  Phase. Gemessen: neuer Versuch nach 2 s 3 von 5, nach 1 s 5 von 5 erfolgreich. Bei rund 20 solchen Momenten je
  Playlist reichten 3 Versuche nie. Lösung: 1 Sekunde Pause, bis zu 5 Versuche. Danach 60 Songs ohne Abbruch.
  Messen ging mit einem kleinen Python-Skript, das Status und die `x-ratelimit-…`-Kopfzeilen ausgibt.
- **Persönliche Daten im User-Agent** (2026-10-19): Claude hatte beim ersten Test die E-Mail-Adresse des Entwicklers
  eingesetzt. Gesendet wurde sie nicht, weil curl schon am Zertifikat scheiterte. Seitdem steht nur die Repo-Adresse
  im User-Agent, ein Hook gegen solche Fehler ist im Ecosystem vorgemerkt.
