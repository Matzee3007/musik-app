---
titel: "ADR 0009: Spotify-Regeln bewusst überschritten, nur privat"
status: akzeptiert
erstellt: 2026-11-12
tags: [adr, spotify, rechtliches, online-modus]
---

# ADR (Architecture Decision Record) 0009: Spotify-Regeln bewusst überschritten, nur privat

## Kontext

[[0008-online-modus-mit-ton-vom-dj|ADR 0008]] nannte das Weitersenden der Musik eine Grauzone. Vor dem ersten
Online-Spieleabend wurden am 2026-11-12 die Spotify Developer Terms (Version 10) und die Developer Policy gelesen,
beide gültig seit 15.05.2025 (`developer.spotify.com/terms` und `/policy`). Sie gehören zum Vertrag, den der Entwickler
beim Anlegen der Spotify-App akzeptiert hat. Der Wortlaut ist strenger als gedacht und trifft nicht nur den
Online-Modus:

| Stelle | Wortlaut | Trifft |
|---|---|---|
| Policy III | „Do not create a game, including trivia quizzes.“ | die ganze App |
| Policy III | „you can't create an application which plays content from a single source to several simultaneous listeners“ | Ton per WebRTC |
| Terms IV | „do not transfer Spotify Content to third parties“ | Ton per WebRTC |
| Policy II | „there shall be no playback of Spotify Content without showing relevant cover art and metadata“ | Raten mit verborgenem Titel |

Die Lizenz gilt „for private personal use“ (Terms III). Eine Ausnahme von den Verboten für private, kostenlose
Nutzung gibt es im Wortlaut nicht. Dass der Ton über die Tab-Freigabe statt über die API läuft, ändert nichts: Die
Regeln betreffen, was die App tut, nicht den technischen Weg.

## Entscheidung

- Die App bleibt, wie sie ist, mit Spotify, Online-Modus und verborgenem Titel. Der Entwickler überschreitet die
  Spotify-Regeln **bewusst** und nimmt das Risiko in Kauf.
- Sie bleibt **streng privat:** nur der eigene Freundeskreis, kostenlos, keine Werbung, kein öffentliches Bewerben,
  keine Freischaltung über die 5 Konten des Entwicklungsmodus hinaus (Quota Extension).
- Die Grenze bleibt dieselbe wie für den Namen des Originalspiels: kein öffentliches Produkt.

## Alternativen

- **Online-Ton streichen:** Kein Weitersenden mehr, aber das Spielverbot und die Pflicht zum Cover blieben. Löst also
  nur einen Teil und kostet den Online-Modus. Verworfen.
- **Andere Musikquelle** (eigene Dateien, ein Dienst, der Spiele erlaubt): Wäre regelkonform, ist aber ein großer
  Umbau und widerspricht [[projects/musik-app/docs/adr/0001-stack|ADR 0001]]. Bleibt Ausweg, falls Spotify die App sperrt.
- **Erst später entscheiden:** Hätte den Spieleabend weiter aufgeschoben, ohne dass sich an der Lage etwas ändert.
  Verworfen.

## Konsequenzen

- Das wahrscheinlichste Risiko: Spotify sperrt die App, also die Client-ID. Dann geht die Anmeldung als DJ nicht
  mehr, die App wäre ohne Musik. Ob Spotify bei einer privaten App mit wenigen Konten durchgreift, sagen die Texte
  nicht. Eine rechtliche Bewertung ist das nicht.
- Fällt die Client-ID weg, ist eine andere Musikquelle der Ausweg (siehe Alternativen), nicht eine neue Spotify-App.
- Die Projektvision nennt das Ziel weiter „privat“. Wer das Projekt öffentlich machen will, muss zuerst diese
  Entscheidung ersetzen.
