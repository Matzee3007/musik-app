---
titel: "ADR 0006: Spielstand über Broadcast mit Nachfragen"
status: akzeptiert
erstellt: 2026-10-22
tags: [adr, architektur, supabase, realtime, mehrspieler]
---

# ADR (Architecture Decision Record) 0006: Spielstand über Broadcast mit Nachfragen

Ersetzt [[0005-spielstand-ueber-presence|ADR 0005]].

## Kontext

Nach ADR 0005 steht der Spielstand im Presence-Eintrag jedes Geräts, jede Änderung ist ein `track()`. Supabase erlaubt
je Gerät aber nur **5 Presence-Änderungen in 30 Sekunden** und schließt beim sechsten den Kanal
(`Client presence rate limit exceeded`, danach `phx_close`). Gemessen per WebSocket-Mitschnitt beim Test mit echten
Handys am 2026-10-22, Quelle:
[Supabase: ClientPresenceRateLimitReached](https://supabase.com/docs/guides/troubleshooting/realtime-client-presence-rate-limit-reached).
Der Tisch meldet Spielstart, Runde und Auflösung und fliegt so spätestens in Runde 2 aus dem Raum. Die Handys sehen
danach keinen Tisch und keine freien Felder mehr.

## Entscheidung

Der Spielstand läuft per Broadcast, Presence zeigt nur, wer da ist:

- **Presence:** ein `track()` je Gerät beim Beitritt, dazu eins je Wiederbeitritt. Kein Stand im Eintrag.
- **Nachrichten** (Broadcast-Ereignis `nachricht`):
  - `geschlossen`: Tisch → alle, der Raum ist zu.
  - `anfrage`: ein Gerät → alle, beim Erscheinen der Spielansicht und nach jedem Wiederbeitritt.
  - `tisch` mit `TischStand | null`: Tisch → alle, bei jeder Änderung und als Antwort auf `anfrage`.
  - `spieler` mit Name und `SpielerStand`: Handy → alle, bei jeder Änderung und als Antwort auf `anfrage`.
- Nachrichten in falscher Form (etwa von einer älteren Fassung der App) werden verworfen.

## Alternativen

- **Presence gedrosselt:** Änderungen sammeln und höchstens alle 6 Sekunden melden. Bis zu 6 Sekunden Verzögerung,
  und Handys, die schnell abhaken und zurücknehmen, stoßen selbst ans Limit.
- **Broadcast plus gedrosselte Presence:** Broadcast für schnelle Änderungen, Presence als Gedächtnis. Zwei Wege für
  einen Stand, die sich widersprechen können.
- **Tabellen in Postgres:** wie in [[0004-mehrspieler-ohne-tabellen|ADR 0004]] abgelehnt, kommt mit dem Scoreboard in
  Phase 4.

## Konsequenzen

- Broadcast speichert nichts: Wer eine Nachricht verpasst (neu geladen, gesperrt, später beigetreten), holt den Stand
  über `anfrage` nach. Jede Ansicht muss deshalb beim Erscheinen und bei jedem Wiederbeitritt nachfragen.
- Das Broadcast-Limit des Projekts liegt bei 100 Nachrichten je Sekunde. Ein Spieleabend braucht wenige je Runde.
- Die Unit-Tests mit dem Nachbau des Kanals kennen kein Limit. Deshalb prüft ein Playwright-Test gegen das echte
  Supabase mehrere Runden hintereinander (`e2e/zwei-runden.spec.ts`).
- Geht ein Gerät, kennt der Tisch dessen letzten Stand weiter; die Spielerleiste zeigt Zahlen nur bei verbundenen
  Spielern.
