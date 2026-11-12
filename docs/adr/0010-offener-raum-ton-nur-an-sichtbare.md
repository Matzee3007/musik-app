---
titel: "ADR 0010: Offener Raum, Ton nur an sichtbare Spieler"
status: akzeptiert
erstellt: 2026-11-12
tags: [adr, supabase, realtime, online-modus, webrtc, sicherheit]
---

# ADR (Architecture Decision Record) 0010: Offener Raum, Ton nur an sichtbare Spieler

## Kontext

[[0004-mehrspieler-ohne-tabellen|ADR 0004]] hat festgehalten: „Wer den Raum-Code kennt, kann mithören und
mitspielen.“ Gemeint waren damals die Nachrichten des Spiels. Mit [[0008-online-modus-mit-ton-vom-dj|ADR 0008]] geht
über den Raum auch die Musik. Vor dem ersten Online-Spieleabend (2026-11-12) wurde deshalb geprüft, wer heute an den
Ton kommt:

- Der Kanal `raum:ABCD` ist ein **öffentlicher** Kanal von Supabase Realtime. Beitreten kann jeder mit dem
  publishable key, und der steckt im JavaScript der Seite.
- Der DJ schickte die Tonspur an jedes Gerät, das `hallo` sagt, auch an eines, das nie in der Spielerleiste
  auftaucht.
- Ein Raum-Code hat 4 Buchstaben aus 23, also 23⁴ = 279.841 Codes. Ein Skript könnte sie durchprobieren, solange ein
  Raum offen ist.

## Entscheidung

- Der Raum bleibt **öffentlich**. Das Risiko ist für einen Abend unter Freunden klein.
- **Der DJ schickt Ton nur an Geräte, die als Spieler in Presence stehen**, also mit Namen in der Spielerleiste.
  Kommt ein `hallo` vor der Presence an, wartet es, bis das Gerät sichtbar wird (`lib/raum/ton.ts`, `tonSenden`).
- Wer mithören will, muss sich also als Spieler zeigen. Heimliches Mithören fällt auf, verhindert ist es nicht.

## Alternativen

- **Nur akzeptieren, ohne Code:** Ein Lauscher bliebe unsichtbar. Der Schritt „nur an Sichtbare“ ist klein.
  Verworfen.
- **Privater Kanal:** Supabase-Anmeldung (etwa anonym) und RLS-Regeln (Row Level Security) für den Kanal. Sperrt
  Fremde wirklich aus, braucht aber Anmeldung und Datenbank-Regeln. Später, falls Tabellen ohnehin kommen.
- **Längerer Raum-Code:** Macht Durchprobieren schwerer, aber das Abtippen am Handy lästiger, und ein bekannter Code
  bliebe offen. Verworfen.

## Konsequenzen

- Ein Gerät kann sich in Presence trotzdem mit beliebigem Namen und Schlüssel eintragen. Die Prüfung macht Mithören
  sichtbar, nicht unmöglich.
- Wer aus Presence verschwindet (etwa ein gesperrtes Handy), behält eine schon bestehende Tonverbindung. Getrennt wird
  sie erst, wenn WebRTC sie als abgebrochen meldet. So reißt der Ton bei kurzen Aussetzern nicht ab.
- Wird der Raum privat (siehe Alternativen), ersetzt das diese Entscheidung.
