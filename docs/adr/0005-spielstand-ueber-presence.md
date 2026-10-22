---
titel: "ADR 0005: Spielstand über Presence statt Broadcast"
status: akzeptiert
erstellt: 2026-10-22
tags: [adr, architektur, supabase, realtime, mehrspieler]
---

# ADR (Architecture Decision Record) 0005: Spielstand über Presence statt Broadcast

## Kontext

[[0004-mehrspieler-ohne-tabellen|ADR 0004]] sieht vor, dass der Tisch „neue Runde“ und „Auflösung“ per Broadcast
schickt. Broadcast speichert nichts: Ein Handy, das gerade gesperrt ist, neu lädt oder mitten im Spiel beitritt,
verpasst die Nachricht und weiß nicht, welche Runde läuft und ob sie aufgelöst ist. Presence dagegen hält zu jedem
Gerät im Kanal einen Eintrag, den alle sehen, solange das Gerät verbunden ist. Ein weiteres `track()` ersetzt den
eigenen Eintrag, und nach einem Wiederbeitritt meldet der Raum-Kanal den zuletzt angemeldeten Eintrag neu an.

## Entscheidung

Der Spielstand steht im Presence-Eintrag jedes Geräts:

- **Tisch:** `TischStand` mit der Kennung des Spiels, der Runde ohne Song (Nummer, Kategorie-Id, aufgelöst) und den
  Namen mit Bingo.
- **Spieler:** `SpielerStand` mit der Kennung des Spiels, der Zahl abgehakter Felder und Bingo ja/nein.

Jede Änderung meldet das Gerät mit einem neuen `anmelden()`. Broadcast bleibt nur für „Raum geschlossen“. Die übrigen
Punkte aus ADR 0004 gelten weiter: keine Tabellen, der Tisch gibt den Takt vor, jedes Handy hält seine Karte selbst.

## Alternativen

- **Broadcast wie in ADR 0004, dazu „Stand anfragen“:** Ein Handy fragt beim Beitritt und nach jedem Wiederbeitritt
  den Tisch nach dem Stand, der Tisch antwortet. Mehr Nachrichtenarten, und jeder Weg, auf dem ein Handy etwas
  verpassen kann, braucht eine eigene Behandlung.
- **Tabellen in Postgres:** wie in ADR 0004 abgelehnt, kommt mit dem Scoreboard in Phase 4.

## Konsequenzen

- Wer beitritt, neu lädt oder vom Sperrbildschirm zurückkommt, sieht sofort den aktuellen Stand, ohne eigenen Code
  dafür.
- Jede Änderung ist ein `track()`, einige pro Runde, weit unter dem Limit von Supabase.
- Geht ein Gerät, ist auch sein Stand weg: Die Spielerleiste zeigt den Namen grau ohne Zahl, und der Tisch muss die
  Namen mit Bingo selbst festhalten, damit sie bleiben.
- Lädt der Tisch neu, ist sein Stand leer, die Handys warten auf das nächste Spiel (Weitermachen kommt in Phase 4).
