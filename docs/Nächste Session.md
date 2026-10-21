---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-21
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-21. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 3 - Mehrspieler]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #23)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit der Spotify-Client-ID liegt nur lokal und ist von Git ignoriert.
- **Vercel:** Projekt `musik-bingo` ist mit dem Repo verbunden, `https://musik-bingo.vercel.app` läuft (Stand nach
  PR #22). Jeder Merge in `main` erneuert die Adresse, jeder PR bekommt eine Vorschau.

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` und der Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. `git pull` holt den Stand von GitHub, falls Vercel oder ein Merge seitdem etwas geändert hat.

## Womit es weitergeht

**Phase 3 – Mehrspieler, Plan A (Deployment)** ist halb fertig: [[2026-10-20-deployment|Plan A]]. Erledigt sind
Aufgabe 1 und Aufgabe 2, Schritte 1 bis 3. Weiter auf einem neuen Branch `feature/deployment-spotify`:

1. **Aufgabe 2, Schritt 4 und 5:** `https://musik-bingo.vercel.app` im Browser öffnen (aktiver Knopf „Mit Spotify
   anmelden“, Demo am Handy spielbar). Vorschau eines PRs öffnen: Knopf ausgegraut mit „Spotify ist hier nicht
   eingerichtet, nur die Demo.“
2. **Aufgabe 2, Schritt 6:** Tool-Notiz `docs/tools/Vercel.md`, Eintrag in der Tools-Übersicht, in der CI
   `node-version-file: package.json` (Notizen aus dem Review von PR #22 stehen im Plan).
3. **Aufgabe 3:** Redirect-URI `https://musik-bingo.vercel.app/callback` im Spotify-Dashboard eintragen (machst du im
   Browser), dann dort anmelden, eine Playlist mit mindestens 20 Songs vorbereiten und eine Runde mit Musik spielen.
   Nur über `musik-bingo.vercel.app`, nicht über eine Nebenadresse. Kommen beim Vorbereiten viel mehr „beschäftigt“
   als lokal (MusicBrainz begrenzt je IP-Adresse), Plan A erweitern.
4. Danach `/code-review`, Merge, `plan-pruefer` gegen Plan A, und weiter mit **Plan B (Raum und Beitritt)** über
   `plan-schreiben`. Für Plan B brauchst du dein Supabase-Konto (ein neues Projekt, Schlüssel in `.env.local` und bei
   Vercel).

**Nebenbei vorgemerkt, kein Muss:**

- **Test am Laptop mit echtem Player:** Spiel starten, WLAN aus, Pause, „Weiterhören“ und „Nochmal“ probieren.
  Erscheint „Spotify reagiert nicht.“, oder bleibt das SDK hängen? (offene Frage im Journal, Funde #2, #6, #7 aus dem
  Review von PR #20)
- **Aufräumen, wenn die Spielansicht für Plan C ohnehin umgebaut wird:** Fehler in `lib/spotify/player.ts` in
  Meldungen übersetzen statt in der Ansicht, den Startzähler nur einmal führen (Funde #8, #9 aus PR #20).
- **TypeScript-Option `noUncheckedIndexedAccess`:** meldet jeden ungeprüften Zugriff wie `karte[i]` (Review PR #19).
  Betrifft viele Dateien, eigener kleiner PR.
- Punkte fürs Ecosystem (`receiving-code-review`, Zeile zu `curl` für die globale `CLAUDE.md`) stehen in der
  [[docs/Nächste Session|Übergabe des Ecosystems]].

## Passende Skills

- `tdd`: falls Aufgabe 3 eine Codeänderung braucht (z. B. längeres Warten bei MusicBrainz)
- `plan-schreiben`: für Plan B, sobald Plan A gemergt ist
- `fertig-pruefen`: vor dem Merge von Plan A
