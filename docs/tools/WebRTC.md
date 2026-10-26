---
titel: WebRTC
status: aktiv
erstellt: 2026-10-26
tags: [tools, webrtc, online-modus, ton]
---

# WebRTC

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan: [[2026-10-26-ton-vom-dj]],
Entscheidung: [[0008-online-modus-mit-ton-vom-dj|ADR 0008]]. Begriffe im
[[projects/musik-app/docs/Glossar|Glossar]]: Online-Modus, DJ, Spieler.

## Was ist das?

WebRTC (Web Real-Time Communication) ist eine Schnittstelle, die jeder Browser mitbringt. Mit ihr schicken sich zwei
Browser Ton, Bild oder Daten **direkt**, ohne Server dazwischen. Videocalls im Browser laufen so. Es ist kein Paket,
nichts muss installiert werden.

## Wofür nutzen wir es?

Im Online-Modus teilt der DJ den Ton seines Tabs, in dem der Spotify-Player spielt. Die App schickt die Tonspur an
jeden Spieler, eine Verbindung je Spieler (Mesh). Code: `lib/raum/ton.ts`, Knopf beim DJ `app/ui/ton-teilen.tsx`,
Empfang mit Lautstärkeregler beim Spieler `app/ui/ton-empfang.tsx`.

## Wichtige Begriffe

- **`RTCPeerConnection`:** eine Verbindung zwischen zwei Browsern.
- **Signaling:** der Austausch der Verbindungsdaten, bevor die Verbindung steht. WebRTC legt nicht fest, wie. Bei uns
  läuft er als Raum-Nachricht `ton` über den Supabase-Kanal des Raums.
- **SDP (Session Description Protocol):** Text, der beschreibt, was eine Seite senden und empfangen kann. Der DJ
  schickt ein **Angebot** (offer), der Spieler eine **Antwort** (answer).
- **ICE-Kandidat (Interactive Connectivity Establishment):** eine mögliche Netzadresse, unter der ein Browser
  erreichbar ist. Beide Seiten tauschen Kandidaten aus, bis ein Weg klappt.
- **STUN:** ein Server, der einem Browser sagt, unter welcher öffentlichen Adresse er hinter dem Router erscheint.
  Kostenlos, wir nutzen `stun:stun.l.google.com:19302`.
- **TURN:** ein Server, der den Ton weiterleitet, wenn keine direkte Verbindung klappt (Firmen-WLAN, strenges NAT).
  Kostet meist etwas, haben wir nicht.
- **`getDisplayMedia`:** fragt den Nutzer, welchen Bildschirm, welches Fenster oder welchen Tab er teilen will.
  „Tab-Audio teilen“ liefert den Ton des Tabs, auch den des Spotify-Players trotz Kopierschutz (geprüft 2026-10-26).
  `preferCurrentTab: true` schlägt gleich den eigenen Tab vor.

## Ablauf der Nachrichten

```text
DJ   → alle:    bereit                       (DJ teilt jetzt Ton)
Spieler → alle: hallo  (versuch)             (beim Beitritt, nach Wiederbeitritt, auf bereit)
DJ   → Spieler: angebot (versuch, SDP)
Spieler → DJ:   antwort (versuch, SDP)
beide:          kandidat (versuch, Adresse)  (mehrere, in beide Richtungen)
```

Jede Seite verarbeitet die Nachrichten der Reihe nach und nimmt nur die zum aktuellen `versuch` an.

## Wie haben wir es eingerichtet?

Nichts einzurichten, WebRTC ist im Browser eingebaut. In den Vitest-Tests gibt es kein WebRTC (jsdom), deshalb nimmt
`tonSenden`/`tonEmpfangen` die Verbindung als Parameter, die Tests geben `nachgebauteVerbindung()` aus
`__tests__/hilfen/verbindung.ts` hinein. Playwright kann den Dialog von `getDisplayMedia` nicht bestätigen, der Ton
wird deshalb von Hand an echten Geräten geprüft.

## Typischer Ablauf zum Prüfen

1. Lokal `npm run dev`, DJ in Chrome unter `http://127.0.0.1:3000`, Online-Raum, Spotify, Spiel starten, „Ton teilen“.
2. Spieler im Inkognito-Fenster unter `/raum/<CODE>`.
3. Über das Internet: Spieler am Handy (WLAN aus) über die Vorschau des PRs. Die Vorschau hat kein Spotify, nutzt aber
   dasselbe Supabase, der DJ bleibt lokal.

## Fehler

- **Verbindung `failed`, „Tonspur angekommen“ zweimal (Durchstich):** Zwei Sender liefen, beide antworteten auf
  dasselbe `hallo`. Lösung: `von` und `an` in jeder Nachricht, der Spieler nimmt nur ein Angebot.
- **Kandidat vor der Beschreibung (Durchstich):** `addIceCandidate` scheitert, wenn die Beschreibung der Gegenseite
  noch nicht eingetragen ist, der Kandidat ging leise verloren. Lösung: Nachrichten der Reihe nach verarbeiten.
- **`play() request was interrupted by a new load request`:** Eine zweite Tonspur ersetzte die erste, während sie
  startete. Lösung wie oben, und `play()` immer mit Fehlerbehandlung.
- **Neuer Spieler bekommt keinen Ton, erst nach „Teilen beenden“ und neu teilen (2026-10-26):** React startet im
  Entwicklungsmodus jeden Effekt zweimal, der Spieler sagte zweimal „hallo“. Der DJ ersetzte die erste Verbindung,
  der Spieler antwortete aber auf das erste Angebot. Lösung: `versuch` in jedem Signal, beide Seiten nehmen nur
  Nachrichten zum aktuellen Versuch an.
- **Spieler hört nichts nach dem Neuladen:** Browser spielen ohne Klick auf der Seite nichts ab. Die App zeigt dann
  „Ton einschalten“.
