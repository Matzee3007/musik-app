---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-14
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-14. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 4 - Spotify-Regeln und Ton nur an Sichtbare]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #89)
- **Offene PRs:** keine
- **Nicht committet:** `.codex/` (nicht von Claude, stammt vermutlich vom Codex-Import am 2026-11-05). `.env.local` mit
  Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit „Ton nur an Sichtbare“ (PR #88), Deployment `success`.
- **Supabase:** lief am 2026-11-14 (Gesundheitscheck `200`).

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
   [[projects/musik-app/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 4 – Eigene Ideen** läuft weiter. Claude fragt zuerst, was als Nächstes ansteht.

1. **Spieleabend auswerten:** Der Online-Spieleabend war am Sessionende vorbereitet, sein Ergebnis noch nicht
   berichtet. Claude fragt danach: Bekam jeder Ton (sonst Netz notieren, evtl. TURN, siehe [[WebRTC]])? Riss bei
   jemandem der Ton immer wieder ab (Hinweis aus [[0010-offener-raum-ton-nur-an-sichtbare|ADR 0010]])? Passten Tisch
   und Karte auf die Bildschirme? Fehler zuerst mit `fehler-diagnose` eingrenzen. Steht der Abend noch aus: vorher
   Supabase prüfen ([[projects/musik-app/docs/tools/Supabase|Supabase]], „Pausiert das kostenlose Projekt?“) und
   einen kurzen Probelauf mit zwei Geräten machen.
2. **Anstehende Entscheidungen** (im Journal „ungefragt“), bitte bestätigen oder umdrehen:
   - Nachgeholte `hallo` per `WeakSet` markieren statt die Warteschlange umzubauen.
   - ADR 0004 und 0008 nur mit Verweis auf 0009/0010, Status bleibt `akzeptiert`.
   - PR #88 nach Umsetzen der abgestimmten Funde ohne zweites Review gemergt.
   - Aus der vorigen Übergabe noch offen: Dependabot-PRs einzeln mergen, bei `CONFLICTING` `@dependabot rebase`;
     `minimatch` (Dependabot-Hinweis Nr. 1, nur Entwicklungs-Abhängigkeit) liegen lassen.
3. **Teil 2 des Online-Modus mit `plan-schreiben` planen:** Notizen in der Auflösung. Jeder schickt seine Notizfläche
   mit, die Auflösung zeigt alle Antworten, der DJ sieht vorher, wer schon etwas notiert hat. Vorher
   `docs/Tools für später.md` auf vorgemerkte Werkzeuge für Phase 4 prüfen.
4. **Offene Review-Funde**, je klein:
   - PR #88: Nr. 4 Scheitert der erste Abgleich des DJ-Kanals, bleibt die Liste der Sichtbaren leer bis zur nächsten
     Presence-Änderung; Nr. 5 wartende `hallo` werden nie aufgeräumt.
   - PR #85: Nr. 7 (Rahmen von Bühne und „Raum offen“ kopiert statt geteilt). PR #74: Nr. 5, 8, 9.
   - PR #65: Nr. 3, 5, 8, 9. PR #66: Nr. 9. Details in [[Lernjournal Phase 4 - Raum offen und Dependabot]] und
     früheren Journalen.
5. **`.github/dependabot.yml` nachziehen** (ein PR mit `/code-review`): `npm-klein` mit `exclude-patterns` für `next`
   und `react`, `cooldown` mit `default-days: 7`.
6. **Aus [[Engineering for Vibe Coders - Auswertung]], ungeprüft:** Lädt ein Client nach einer Unterbrechung von
   Supabase Realtime den ganzen Stand neu (Artikel 84, 132)? Wird bei HTTP 429 von Spotify `Retry-After` beachtet
   (Artikel 38)?
7. **Restpunkte**, wenn Zeit ist: `app/ui/vorbereiten-ansicht.tsx` (`tokenHolen`) ohne Netz, Karte im Querformat oder
   auf dem Tablet, `e2e/raum.spec.ts` beobachten, Funde aus PR #24 und PR #20, `noUncheckedIndexedAccess`.

## Passende Skills

- `fehler-diagnose`: wenn am Spieleabend etwas nicht klang oder nicht passte
- `plan-schreiben`: Teil 2 des Online-Modus planen
- `tdd`: beim Abarbeiten der Review-Funde
