---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-09
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-09. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 4 - Raum offen und Dependabot]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #86)
- **Offene PRs:** keine
- **Nicht committet:** `.codex/` (nicht von Claude, stammt vermutlich vom Codex-Import am 2026-11-05). `.env.local` mit
  Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit Bühne, Schritt „Raum offen“ (PR #85,
  [[2026-11-09-raum-offen-buehne|Plan]]) und Playlist-Raster.

## Vor dem Start

1. Claude Code im Projektordner starten:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. `main` aktualisieren:

   ```bash
   git switch main
   git pull
   ```

   `git switch main` wechselt auf den Hauptzweig, `git pull` holt den Stand von GitHub.

3. Neue Dependabot-PRs prüfen (`gh pr list --author 'app/dependabot'`), Ablauf in
   [[projects/musik-app/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]]: einzeln mergen, bei
   `CONFLICTING` per `@dependabot rebase` neu aufbauen lassen.

## Womit es weitergeht

**Phase 4 – Eigene Ideen** läuft weiter. Claude fragt zuerst, was als Nächstes ansteht. Vorschläge:

1. **„Raum offen“ mit echter Spotify-Anmeldung abnehmen** (Production, mit gemerktem Raum): Passt der Übergang Raum →
   Spotify → Playlist → Tisch? Bei Bedarf nachbessern. Bewusst offen aus dem Review von #85: Nr. 7 (Rahmen von Bühne und
   „Raum offen“ kopiert statt geteilt). Restrisiko: „Demo starten“ baut die Schublade neu auf (einmal Presence neu).
   Offen aus dem Review von #74: Nr. 5 (`lg:pl-72` hängt an der Breite der Raum-Schublade), Nr. 8 (Handler für „Demo
   starten“ doppelt), Nr. 9 (Cover in voller Größe, 640 px).
2. **Online-Spieleabend mit Freunden** als echter Test:
   - Vorher Supabase prüfen (pausiert nach 7 Tagen ohne Datenbank-Aktivität): Befehl in
     [[projects/musik-app/docs/tools/Supabase|Supabase]], Abschnitt „Pausiert das kostenlose Projekt?“.
   - Vorher auch klären: Wer kann mit nur dem Raum-Code einem Raum-Kanal (Supabase Realtime) beitreten und mithören?
     Ist das gewollt, als ADR festhalten (aus [[Build with AI - Auswertung]], Artikel 13).
   - Vorher klären: Erlauben die Spotify Developer Terms, den Ton aus dem Web Playback SDK per WebRTC weiterzugeben?
     Als ADR festhalten (aus [[Engineering for Vibe Coders - Auswertung]], Artikel 51).
   - DJ in Chrome oder Edge am Laptop: „Online spielen“, Playlist, „Ton teilen“, im Dialog „Dieser Tab“ mit
     „Tab-Audio teilen“. Spieler treten mit dem Raum-Code auf `musik-bingo.vercel.app` bei.
   - Beobachten: Bekommt jeder Ton (sonst braucht jemand hinter strengem NAT TURN, siehe [[WebRTC]])? Passen Tisch
     und Karte bei den Spielern auf den Bildschirm?
3. **Teil 2 des Online-Modus mit `plan-schreiben` planen:** Notizen in der Auflösung. Jeder schickt seine Notizfläche
   mit, die Auflösung zeigt alle Antworten, der DJ sieht vorher, wer schon etwas notiert hat.
4. **Anstehende Entscheidungen aus dem Journal** (Wer: „ungefragt“), bitte bestätigen oder umdrehen:
   - Dependabot-PRs einzeln mergen, bei `CONFLICTING` `@dependabot rebase`.
   - 10 moderate Meldungen von `npm audit` (`minimatch` über `@typescript-eslint`) bleiben liegen.
5. **Offene Review-Funde**, je klein:
   - PR #65: Nr. 3 Name des DJs ist frei, solange er kurz weg ist; Nr. 5 „Jahr unsicher“ fehlt bei den Spielern
     (`jahrUnsicher` im Stand mitschicken); Nr. 8 leere Handler beim Zuschauer-`Tisch`; Nr. 9 doppelter Zweig in
     `anwesendeLesen`.
   - PR #66: Nr. 9 Scheitert das Annehmen eines Angebots, bleibt der Spieler bis zum nächsten Versuch stumm.
6. **`.github/dependabot.yml` weiter nachziehen** (ein PR mit `/code-review`):
   - `npm-klein` mit `exclude-patterns` für die Familien `next` und `react` (React landete trotz eigener Gruppe im
     Sammel-PR, #57, #62).
   - `cooldown` mit `default-days: 7` gegen ganz frische, womöglich manipulierte Versionen.
7. **Aus [[Engineering for Vibe Coders - Auswertung]], ungeprüft:**
   - Lädt ein Client nach einer Unterbrechung von Supabase Realtime den ganzen Stand des Raums neu (Artikel 84, 132)?
   - Was passiert bei HTTP 429 von Spotify: wird `Retry-After` beachtet, sehen die Spieler eine Meldung (Artikel 38)?
8. **Restpunkte**, wenn Zeit ist: `app/ui/vorbereiten-ansicht.tsx` (`tokenHolen`) ohne Netz, Karte im Querformat oder
   auf dem Tablet, `e2e/raum.spec.ts` beobachten (wackelte am 2026-11-09 einmal), Funde aus PR #24 und PR #20,
   `noUncheckedIndexedAccess`. Weitere Roadmap-Punkte in der Projektvision.

Vor dem Start eines neuen Plans `docs/Tools für später.md` auf vorgemerkte Werkzeuge für Phase 4 prüfen.

## Passende Skills

- `plan-schreiben`: Teil 2 des Online-Modus planen
- `tdd`: beim Abarbeiten der Review-Funde
- `fehler-diagnose`: wenn am Spieleabend etwas nicht klingt oder ein Dependabot-PR rot wird
