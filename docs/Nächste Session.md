---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-20
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-20. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 2 - Spotify]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #16)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit der Spotify-Client-ID liegt nur lokal und ist von Git ignoriert.

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` und der Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. Zum Ausprobieren der App: `npm run dev` und **http://127.0.0.1:3000** öffnen (nicht `localhost`, siehe
   [[Spotify Web API]]).

## Womit es weitergeht

**Phase 2 – Spotify ist abgeschlossen** (PRs #13 bis #16, [[Lernjournal Phase 2 - Spotify|Journal]]). Die nächste
Session beginnt mit **Phase 3 – Mehrspieler**: Raum mit Code, jeder Spieler mit Karte und Notizfläche auf dem eigenen
Handy, Live-Abgleich über Supabase Realtime, Deployment auf Vercel.

1. **Claude fragt zuerst, ob etwas anderes ansteht.** Vorschläge:
   - **Restpunkt aus Phase 2:** Fehler bei Spotify-Aufrufen mitten im Spiel abfangen. Im Log stand einmal
     `unhandledRejection: TypeError: Failed to fetch` beim Erneuern des Tokens für das SDK (vermutlich nach dem
     Ruhezustand des Laptops). Zu klären: Was zeigt die App, wenn Spotify kurz nicht erreichbar ist? Am besten mit
     `/grill-with-docs` kurz klären, dann mit `tdd` umsetzen.
   - **Restpunkt aus Phase 1:** `feldAbhaken` mit ungültigem Index (z. B. `-1`) in einer aufgelösten Runde wirft einen
     `TypeError`, weil `karte[index]` dann `undefined` ist (`lib/spiel.ts`, rund Zeile 69). Gefunden am 2026-10-20 vom
     Agent `plan-pruefer` im Ecosystem. Mit `tdd`: erst ein Test, dann den Index prüfen und das Spiel unverändert lassen.
   - Punkte fürs Ecosystem (u. a. der Datenschutz-Hook) stehen in der
     [[docs/Nächste Session|Übergabe des Ecosystems]].
2. [[projects/musik-app/docs/Tools für später|Tools für später]] und die
   [[docs/Tools für später|Tools für später des Ecosystems]] auf Werkzeuge für Phase 3 prüfen. Vorgemerkt sind dort
   z. B. `wizard` (Schlüssel für Supabase und Vercel geführt eintragen) und `receiving-code-review`.
3. Phase 3 mit `/grill-with-docs` schärfen, bevor geplant wird. Offen ist z. B.: Wo liegen Songs und Jahre künftig
   (bisher im Browser, laut Plan Supabase), wie entsteht und endet ein Raum, was sieht der DJ auf dem Handy, wenn er
   mitspielt, Stechen und „Bingo-Erkennung abschalten“ (aus Phase 1 auf Phase 3 verschoben), welche Redirect-URI
   kommt für Vercel dazu.
4. **Vorbereitung, die nur du machen kannst:** Konten bei Supabase und Vercel (falls noch nicht vorhanden). Claude
   erklärt die Schritte, wenn es so weit ist. Schlüssel kommen in `.env.local` bzw. in die Einstellungen von Vercel,
   nie ins Repo.
5. Danach den Plan für Phase 3 mit `plan-schreiben`, wie in Phase 2 in mehrere Pläne mit je einem PR geteilt.

## Passende Skills

- `grill-with-docs`: Restpunkt Fehlerbehandlung und Phase 3 klären, bevor geplant wird
- `plan-schreiben`: Pläne für Phase 3
- `tdd`: Spiellogik für Räume und Mehrspieler testgetrieben
