---
titel: "ADR 0004: Mehrspieler über Broadcast und Presence, ohne Tabellen"
status: akzeptiert
erstellt: 2026-10-20
tags: [adr, architektur, supabase, realtime, mehrspieler]
---

# ADR (Architecture Decision Record) 0004: Mehrspieler über Broadcast und Presence, ohne Tabellen

## Kontext

In Phase 3 spielt jeder Spieler auf dem eigenen Handy, der Laptop bleibt der Tisch. Die Geräte müssen live wissen,
wer im Raum ist, wann eine Runde beginnt und aufgelöst wird und wer Bingo hat. Spieler haben kein Konto. Supabase
Realtime bietet dafür Broadcast (Nachrichten an alle im Kanal, nichts wird gespeichert), Presence (wer gerade im Kanal
ist) und Postgres Changes (Änderungen an Tabellen live an alle). Songs und Erscheinungsjahre bleiben in Phase 3 im
`localStorage` des Tisches, weil nur er sie braucht.

## Entscheidung

Ein Raum ist ein Realtime-Kanal mit dem Raum-Code. Der Tisch gibt den Takt vor und schickt per Broadcast „neue Runde“
(mit Kategorie) und „Auflösung“. Jedes Handy hält seine Karte selbst, wendet die reinen Funktionen aus `lib/spiel.ts`
an und speichert die Karte im eigenen `localStorage`, damit sie ein Neuladen übersteht. Die Handys melden dem Tisch
nur die Zahl der abgehakten Felder und „Bingo“. Presence liefert die Liste der Spieler. Es gibt keine Tabellen.

> Geändert durch [[0005-spielstand-ueber-presence|ADR 0005]]: Runde, Auflösung, Zahl und Bingo laufen über Presence,
> Broadcast nur noch für „Raum geschlossen“.

## Alternativen

- **Tabellen in Postgres für Räume, Spieler und Karten (mit Postgres Changes):** robuster, wenn ein Gerät ausfällt,
  und schon die Grundlage für das Scoreboard. Braucht aber Schema, Migrationen und RLS-Regeln für Spieler ohne Konto,
  also viel neuen Stoff auf einmal, ohne dass ein Spieleabend davon jetzt etwas merkt.
- **Eigener WebSocket-Server statt Supabase:** Vercel betreibt keine dauerhaften Verbindungen, es bräuchte einen
  zweiten Dienst. Supabase ist im Stack ohnehin gesetzt ([[projects/musik-app/docs/adr/0001-stack|ADR 0001]]).

## Konsequenzen

- Kein Datenbankschema in Phase 3, nur ein Supabase-Projekt mit öffentlichem Schlüssel (anon key) für Realtime.
- Lädt der Tisch neu, ist die laufende Runde weg. Der Tisch muss deshalb Raum-Code und Spielstand selbst im
  `localStorage` halten.
- Wer den Raum-Code kennt, kann mithören und mitspielen. Für einen privaten Spieleabend ist das in Ordnung.
- Tabellen kommen mit dem Scoreboard und „Tisch ganz am Handy“ in Phase 4. Dann wird diese Entscheidung ersetzt.
