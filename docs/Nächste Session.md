---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-08
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-08. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 4 - Startseite Bühne]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #79)
- **Offene PRs:** keine aus der Session. Dependabot hat nach dem Merge von #75 vier neue geöffnet, noch ungeprüft:
  #76 `next`-Gruppe, #77 `npm-klein` (5 Updates), #78 jsdom 30 → 31, #80 TypeScript 5.9 → 6.0.3.
- **Nicht committet:** `.codex/` (nicht von dieser Session, stammt vermutlich vom Codex-Import am 2026-11-05). `.env.local`
  mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit der neuen Startseite „Bühne“ und dem Playlist-Raster (PR #74,
  [[2026-11-08-startseite-buehne|Plan]]).

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

3. Die vier Dependabot-PRs prüfen und mergen, nach dem Ablauf in
   [[projects/musik-app/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]] (CI grün, `npm run e2e` lokal):

   ```bash
   gh pr checks <nr>     # CI-Ergebnis
   gh pr checkout <nr>   # Branch lokal holen, dann npm ci und npm run e2e
   ```

   Bei #80 (TypeScript 6) zusätzlich auf neue Warnungen von `npm run typecheck` achten: TS 6 warnt vor allem, was in
   TS 7 wegfällt.

## Womit es weitergeht

**Phase 4 – Eigene Ideen** läuft weiter. Claude fragt zuerst, was als Nächstes ansteht. Vorschläge:

1. **Neue Startseite mit echter Spotify-Anmeldung ansehen** (lokal `npm run dev` oder Production): Wirken die echten
   Cover im Raster? Bei Bedarf nachbessern. Bewusst offen aus dem Review von #74: Nr. 5 (`lg:pl-72` hängt an der Breite
   der Raum-Schublade), Nr. 8 (Handler für „Demo starten“ doppelt), Nr. 9 (Cover in voller Größe, 640 px).
2. **Online-Spieleabend mit Freunden** als echter Test:
   - Vorher Supabase prüfen (pausiert nach 7 Tagen ohne Datenbank-Aktivität): Befehl in
     [[projects/musik-app/docs/tools/Supabase|Supabase]], Abschnitt „Pausiert das kostenlose Projekt?“.
   - DJ in Chrome oder Edge am Laptop: „Online spielen“, Playlist, „Ton teilen“, im Dialog „Dieser Tab“ mit
     „Tab-Audio teilen“. Spieler treten mit dem Raum-Code auf `musik-bingo.vercel.app` bei.
   - Beobachten: Bekommt jeder Ton (sonst braucht jemand hinter strengem NAT TURN, siehe [[WebRTC]])? Passen Tisch
     und Karte bei den Spielern auf den Bildschirm?
3. **Teil 2 des Online-Modus mit `plan-schreiben` planen:** Notizen in der Auflösung. Jeder schickt seine Notizfläche
   mit, die Auflösung zeigt alle Antworten, der DJ sieht vorher, wer schon etwas notiert hat.
4. **Offene Review-Funde**, je klein:
   - PR #65: Nr. 3 Name des DJs ist frei, solange er kurz weg ist; Nr. 5 „Jahr unsicher“ fehlt bei den Spielern
     (`jahrUnsicher` im Stand mitschicken); Nr. 8 leere Handler beim Zuschauer-`Tisch`; Nr. 9 doppelter Zweig in
     `anwesendeLesen`.
   - PR #66: Nr. 9 Scheitert das Annehmen eines Angebots, bleibt der Spieler bis zum nächsten Versuch stumm.
5. **`.github/dependabot.yml` weiter nachziehen** (Anregung aus tages-dashboard, 2026-11-04, ein PR mit `/code-review`):
   - `npm-klein` mit `exclude-patterns` für die Familien `next` und `react`, weil React trotz eigener Gruppe im
     Sammel-PR landete (#57, #62).
   - `cooldown` mit `default-days: 7` gegen ganz frische, womöglich manipulierte Versionen.
   - Erledigt am 2026-11-08: TypeScript ab 7 ignoriert (#75), ESLint 10 gemergt (#68).
6. **Restpunkte**, wenn Zeit ist: `app/ui/vorbereiten-ansicht.tsx` (`tokenHolen`) ohne Netz, Karte im Querformat oder
   auf dem Tablet, `e2e/raum.spec.ts` beobachten, Funde aus PR #24 und PR #20, `noUncheckedIndexedAccess`,
   `minimatch`-Warnung (bewusst gelassen, verschwindet mit einem ESLint-Update). Weitere Roadmap-Punkte in der
   Projektvision.

Vor dem Start eines neuen Plans `docs/Tools für später.md` auf vorgemerkte Werkzeuge für Phase 4 prüfen.

## Passende Skills

- `fehler-diagnose`: wenn ein Dependabot-PR rot wird oder am Spieleabend etwas nicht klingt
- `plan-schreiben`: Teil 2 des Online-Modus planen
- `tdd`: beim Abarbeiten der Review-Funde
