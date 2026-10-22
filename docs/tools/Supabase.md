---
titel: Supabase
status: aktiv
erstellt: 2026-10-22
tags: [tools, supabase, realtime, presence, broadcast]
---

# Supabase

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan: [[2026-10-21-raum-beitritt]],
Entscheidung: [[0004-mehrspieler-ohne-tabellen|ADR 0004]]. Begriffe im
[[projects/musik-app/docs/Glossar|Glossar]]: Raum, Raum-Code, Tisch.

## Was ist das?

Ein Dienst, der eine Postgres-Datenbank samt Schnittstellen bereitstellt, dazu **Realtime**: Live-Kanäle, über die
Browser sich gegenseitig in Sekundenbruchteilen Nachrichten schicken. Der kostenlose Tarif reicht für uns.

## Wofür nutzen wir es?

Nur für Realtime, ohne Tabellen. Jeder Raum ist ein Kanal `raum:<Code>`, auf dem Tisch und Handys sich treffen.

## Wichtige Begriffe

- **Projekt:** eine eigene Supabase-Umgebung mit Adresse `https://<ref>.supabase.co`. `<ref>` ist die Kennung des
  Projekts und steckt auch in den Adressen des Dashboards.
- **Publishable key** (`sb_publishable_…`): öffentlicher Schlüssel, darf im Browser stehen. Ihn nutzt die App.
- **Secret key** (`sb_secret_…`): voller Zugriff, nur für Server. Brauchen wir nicht.
- **anon key:** der alte öffentliche Schlüssel, den Supabase durch den publishable key ablöst. Nicht mehr verwenden.
- **Kanal (Channel):** ein benannter Treffpunkt in Realtime. Öffentliche Kanäle kann jeder betreten, der den Namen
  kennt, private verlangen Regeln in der Datenbank.
- **Presence:** Jedes Gerät meldet sich im Kanal an (`track`), alle sehen, wer gerade verbunden ist. Verliert ein
  Gerät die Verbindung, verschwindet sein Eintrag.
- **Broadcast:** eine Nachricht an alle im Kanal, wird nicht gespeichert, z. B. „Raum geschlossen“.

## Wie haben wir es eingerichtet?

Mit dem Assistenten `scripts/supabase-einrichten.sh` (2026-10-22). Für eine Neueinrichtung einfach wieder ausführen,
in einem eigenen Terminal-Fenster im Projektordner:

```bash
bash scripts/supabase-einrichten.sh
```

Er führt durch vier Stufen:

1. Projekt `musik-bingo` anlegen, Region Frankfurt. Das Datenbank-Passwort braucht die App nicht.
2. Projekt-URL und publishable key (Knopf „Connect“ im Projekt) nach `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Vorlage in `.env.example`.
3. Realtime → Settings (`https://supabase.com/dashboard/project/<ref>/realtime/settings`): **„Allow public access“**
   an, sonst lassen sich keine öffentlichen Kanäle betreten.
4. Bei [[projects/musik-app/docs/tools/Vercel|Vercel]] beide Variablen für **Production und Preview**. Anders als die
   Spotify-Client-ID auch für Preview, weil Räume in Vorschauen ebenso gehen.

Im Code: `lib/supabase.ts` mit `supabaseKonfiguriert()` (sind beide Variablen gesetzt?) und `supabaseClient()` (ein
Client für die ganze App).

## Typischer Ablauf

1. Der Tisch öffnet den Kanal `raum:ABCD` und meldet sich per Presence als Tisch an.
2. Ein Handy öffnet denselben Kanal, sieht per Presence den Tisch und meldet sich mit Namen an.
3. Der Tisch sieht die Presence-Änderung und zeigt den Namen in der Spielerleiste.
4. „Raum schließen“ schickt per Broadcast `geschlossen`, alle Handys zeigen „Raum geschlossen“.

## Alle bisher benutzten Befehle

```bash
npm install -E @supabase/supabase-js@2.117.2   # Bibliothek, genaue Version
bash scripts/supabase-einrichten.sh            # Einrichtung (eigenes Terminal)
```

## Fehler, die uns passiert sind

Noch keine.
