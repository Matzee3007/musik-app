---
titel: "ADR 0008: Online-Modus mit Ton vom DJ"
status: akzeptiert
erstellt: 2026-10-26
tags: [adr, architektur, online-modus, webrtc, spotify]
---

# ADR (Architecture Decision Record) 0008: Online-Modus mit Ton vom DJ

## Kontext

Der lokale Modus ist an einem Spieleabend erprobt: Der Laptop ist der Tisch, spielt die Musik und zeigt Rad und
Auflösung, die Spieler haben ihre Karte auf dem Handy. Gewünscht ist zusätzlich ein **Online-Modus**: Jeder sitzt an
seinem eigenen PC, an einem anderen Ort, und spielt im Browser mit.

Räume laufen schon über das Internet (Supabase Realtime, [[0006-spielstand-ueber-broadcast|ADR 0006]]). Online fehlen
zwei Dinge, die bisher im Zimmer passieren: die Musik hören und den Tisch sehen.

Die Musik ist die schwierige Hälfte. Das Web Playback SDK spielt nur im Browser eines Premium-Kontos, eine private
Spotify-App erlaubt höchstens 5 freigeschaltete Konten, und `preview_url` liefert die API nicht mehr zuverlässig. Bei
Deezer fehlte die Hörprobe schon für den ersten getesteten Song („Bohemian Rhapsody“, ISRC `GBUM71029604`,
`preview: ''`).

Ein Durchstich am 2026-10-26 (Branch `spike/ton-streamen`, Seite `/durchstich`) hat geprüft, ob der DJ den Ton
seines Spotify-Tabs an andere Browser schicken kann:

- Chrome liefert den Ton eines Spotify-Tabs über `getDisplayMedia` („Tab-Audio teilen“) trotz Kopierschutz (DRM).
- WebRTC mit Signaling über einen Supabase-Broadcast-Kanal verbindet zwei Browser, auch vom WLAN zu einem Handy im
  Mobilfunknetz, nur mit einem öffentlichen STUN-Server, ohne TURN.
- Der Ton kommt beim Empfänger etwa 1 Sekunde später an als beim DJ.

## Entscheidung

- Es gibt zwei Modi, gewählt auf der Startseite: **lokal** (wie bisher) und **online**.
- **Im Online-Modus streamt der DJ den Ton:** Er spielt den Song wie bisher mit Spotify, teilt einmal den Tab mit
  Ton, und die App schickt die Tonspur per WebRTC an jeden Spieler. Signaling über den Kanal des Raums, STUN von
  Google, kein TURN-Server.
- **Nur der DJ meldet sich bei Spotify an** (Prinzip 1 bleibt).
- **Der DJ spielt online mit:** Er hat Karte und Notizfläche wie alle, dazu die Knöpfe des Tisches. Einen Tisch als
  eigenes Gerät gibt es online nicht.
- **Jeder Spieler sieht Rad, Kategorie und Auflösung in der eigenen Ansicht**, neben seiner Karte.
- **Spieler prüfen weiter selbst** ([[0002-spieler-pruefen-selbst|ADR 0002]]). Online sehen in der Auflösung alle die
  Notizflächen der anderen, damit niemand seine Antwort nachträglich ändert.
- **Die Auflösung startet der DJ** mit „Lösung anzeigen“ und sieht vorher, wer schon etwas notiert hat. Eine
  automatische Auflösung, sobald alle geantwortet haben, ist als spätere Erweiterung vorgemerkt.

## Alternativen

- **Discord oder Bildschirm teilen:** Kein Code nötig, aber jeder braucht Discord, und die Spieler sähen den Tisch nur
  im Stream. Der Online-Modus soll ohne fremde App gehen. Verworfen.
- **Jeder mit eigenem Spotify-Konto:** sauber, aber höchstens 5 Konten, jeder braucht Premium, und Prinzip 1 fiele
  weg. Verworfen.
- **30-Sekunden-Hörproben (Deezer):** ohne Konto, aber nur 30 Sekunden und nicht für jeden Song (siehe Kontext).
  Verworfen, solange das Streamen trägt.
- **Discord-Activity oder Bot:** sehr viel Aufwand, und Spotify verbietet das Weitersenden ebenso. Verworfen.

## Konsequenzen

- Spotify verbietet in seinen Nutzungsbedingungen, Musik weiterzusenden. Für eine private Runde unter Freunden ist
  das dieselbe Grauzone wie Bildschirm teilen in Discord. Der Online-Modus bleibt deshalb privat, kein öffentliches
  Produkt (wie schon für den Namen „Hitster“).
- Der DJ braucht Chrome oder Edge am Laptop oder PC. Safari bietet beim Teilen keinen Tab-Ton an. Spieler brauchen
  nur einen Browser mit WebRTC.
- Der DJ hört jeden Song etwa 1 Sekunde früher als die anderen. Für das Spiel ohne Zeitlimit ist das egal.
- Jede Verbindung geht direkt vom DJ zu einem Spieler (Mesh). Für einen Freundeskreis reicht das, bei vielen Spielern
  wächst die Last beim DJ.
- Die Verbindungsdaten laufen über den Kanal des Raums, jeder im Raum sieht die Netzadressen (ICE-Kandidaten) aller
  Verbindungen, auch die nicht für ihn bestimmten. Unter Freunden in Ordnung.
- Manche Netze (Firmen-WLAN, strenges NAT) lassen keine direkte Verbindung zu. Dann bräuchte es einen TURN-Server,
  der meist etwas kostet. Erst lösen, wenn es vorkommt.
- Der Online-Modus braucht eine Spieleransicht für den PC (Rad, Kategorie, Auflösung und Karte zugleich) und Platz für
  die Notizflächen aller in der Auflösung.
