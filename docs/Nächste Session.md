---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-26
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-26 (zweite Session). Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes
Journal: [[Lernjournal Phase 4 - Restpunkte und Dependabot]] (Abschnitt „Zweite Session: Online-Modus“).

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #67)
- **Offene PRs:** zwei von Dependabot, weiter bewusst vertagt: #59 TypeScript 5.9 → 7.0 (CI rot), #60 ESLint 9 → 10
  (CI grün). Keine offenen PRs aus der Session.
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit dem **Online-Modus** samt Ton vom DJ (PR #64 bis #66,
  [[0008-online-modus-mit-ton-vom-dj|ADR 0008]]).

## Vor dem Start

1. Claude Code im Projektordner starten, damit Projekt-`CLAUDE.md`, Prettier-Hook und Playwright-Agents geladen
   werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. Prüfen, dass `main` aktuell ist:

   ```bash
   git switch main
   git pull
   ```

   `git switch main` wechselt auf den Hauptzweig, `git pull` holt den Stand von GitHub.

3. Neue PRs von Dependabot ansehen (er öffnet jede Woche welche):

   ```bash
   gh pr list --author 'app/dependabot'
   ```

   Ablauf vor dem Merge: [[projects/musik-app/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 4 – Eigene Ideen** läuft weiter. Der Online-Modus ist spielbar (Teil 1 und 3 fertig). Claude fragt zuerst, was
als Nächstes ansteht. Vorschläge:

1. **Online-Spieleabend mit Freunden** als echter Test:
   - Vorher Supabase prüfen (pausiert nach 7 Tagen ohne Datenbank-Aktivität): Befehl in
     [[projects/musik-app/docs/tools/Supabase|Supabase]], Abschnitt „Pausiert das kostenlose Projekt?“.
   - DJ in Chrome oder Edge am Laptop: „Online spielen“, Playlist, „Ton teilen“, im Dialog „Dieser Tab“ mit
     „Tab-Audio teilen“. Spieler treten mit dem Raum-Code auf `musik-bingo.vercel.app` bei.
   - Beobachten: Bekommt jeder Ton (sonst braucht jemand hinter strengem NAT TURN, siehe [[WebRTC]])? Passen Tisch
     und Karte bei den Spielern auf den Bildschirm (am Laptop ca. 1100 px hoch, der DJ muss für „Nächste Runde“
     scrollen)?
2. **Teil 2 des Online-Modus mit `plan-schreiben` planen:** Notizen in der Auflösung. Jeder schickt seine Notizfläche
   mit, die Auflösung zeigt alle Antworten, der DJ sieht vorher, wer schon etwas notiert hat. Optional danach:
   automatische Auflösung, sobald alle geantwortet haben.
3. **Offene Review-Funde**, je klein:
   - PR #65: Nr. 3 Name des DJs ist frei, solange er kurz weg ist; Nr. 5 „Jahr unsicher“ fehlt bei den Spielern
     (`jahrUnsicher` im Stand mitschicken); Nr. 8 leere Handler beim Zuschauer-`Tisch`; Nr. 9 doppelter Zweig in
     `anwesendeLesen`.
   - PR #66: Nr. 9 Scheitert das Annehmen eines Angebots, bleibt der Spieler bis zum nächsten Versuch stumm. Nr. 4 und
     8 (Reihenfolge der Kandidaten, Angebote nacheinander) nur bei Auffälligkeiten.
   - Karte der Demo ohne Raum wirkt am Laptop vermutlich auseinandergezogen wie vorher die des DJs (im Online-Modus mit
     `items-start` behoben).
4. **Große Updates von Dependabot**, je eine eigene kleine Aufgabe: #59 TypeScript 7.0 (CI rot, mit `fehler-diagnose`
   eingrenzen), #60 ESLint 10 (CI grün, trotzdem Änderungen lesen und `npm run e2e`).
5. **Restpunkte aus der letzten Übergabe**, wenn Zeit ist: `app/ui/vorbereiten-ansicht.tsx` (`tokenHolen`) ohne Netz,
   Gruppe `react` in `.github/dependabot.yml` beobachten, Karte im Querformat oder auf dem Tablet, `e2e/raum.spec.ts`
   beobachten, Funde aus PR #24 und PR #20, `noUncheckedIndexedAccess`. Weitere Roadmap-Punkte in der Projektvision.

Vor dem Start eines neuen Plans `docs/Tools für später.md` auf vorgemerkte Werkzeuge für Phase 4 prüfen.

**Aus tages-dashboard (2026-11-04), klein, ein PR mit `/code-review`: `.github/dependabot.yml` nachziehen** (Erklärung in dessen `docs/tools/Dependabot - Einrichtung.md`):

- `npm-klein` mit `exclude-patterns` für die Familien `next` und `react`, weil React hier trotz eigener Gruppe im Sammel-PR landete (#57, #62). Im ersten Lauf dort kam React als eigener PR, bewiesen ist die Wirkung noch nicht.
- Große Updates von `typescript` ignorieren: `typescript-eslint` verlangt eine Fassung unter 6.1, das erklärt das rote #59. Prüfen, ob auch ESLint 10 (#60) ignoriert werden sollte: `eslint-plugin-react`, `-import` und `-jsx-a11y` erlauben dort nur ESLint bis 9, obwohl die CI grün war.
- `cooldown` mit `default-days: 7` für beide Einträge, gegen ganz frische, womöglich manipulierte Versionen.

## Passende Skills

- `plan-schreiben`: Teil 2 des Online-Modus planen
- `fehler-diagnose`: wenn am Online-Spieleabend etwas nicht klingt oder nicht verbindet, oder für #59
- `tdd`: beim Abarbeiten der Review-Funde
