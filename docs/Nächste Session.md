---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-21
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-21 (Abend). Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 3 - Mehrspieler]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #26)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit der Spotify-Client-ID liegt nur lokal und ist von Git ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit Spotify (Plan A fertig, PR #24)

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` und der Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. `git pull` holt den Stand von GitHub, falls seitdem etwas gemergt wurde.

## Womit es weitergeht

**Phase 3 – Mehrspieler, Plan B (Raum und Beitritt):** [[2026-10-21-raum-beitritt|Plan B]] ist geschrieben und
gemergt (PR #25), aber **noch nicht freigegeben**. Ablauf:

1. Plan B lesen und freigeben. Zu prüfen: Mit Supabase zeigt die Startseite zuerst „Raum eröffnen“ und „Raum
   beitreten“, Anmeldung und Demo kommen erst danach; ohne Supabase sind die Raum-Knöpfe aus und die Demo läuft ohne
   Raum.
2. Neuer Branch `feature/raum-beitritt`, dann Aufgabe 1: Claude schreibt mit `assistent-bauen` das Skript
   `scripts/supabase-einrichten.sh`, du führst es **in einem eigenen Terminal-Fenster** aus (Supabase-Konto nötig).
3. Aufgaben 2 bis 8, am Ende Test mit zwei echten Handys unter Production.

**Nebenbei vorgemerkt, kein Muss:**

- **Funde aus dem Review von PR #24**, nicht umgesetzt: kollaborative Playlist, der du nur folgst, könnte trotz Filter
  403 liefern (dann kommt die Meldung); bei 401 nutzt „Nochmal versuchen“ das alte Token; scheitert `GET /v1/me`,
  bleibt die Playlist-Liste leer. Details in [[2026-10-20-deployment|Plan A]], Aufgabe 4.
- **Ladezeit beim Vorbereiten** (81 Songs gut anderthalb Minuten wegen 1 Anfrage pro Sekunde bei MusicBrainz): Ideen
  für später sind Jahre in Supabase (ohnehin in Phase 4 vorgesehen) oder Vorbereiten im Hintergrund.
- **Test am Laptop mit echtem Player:** Spiel starten, WLAN aus, Pause, „Weiterhören“ und „Nochmal“. Erscheint
  „Spotify reagiert nicht.“, oder bleibt das SDK hängen? (offene Frage im Journal)
- **Aufräumen, wenn die Spielansicht für Plan C ohnehin umgebaut wird:** Fehler in `lib/spotify/player.ts` in
  Meldungen übersetzen statt in der Ansicht, den Startzähler nur einmal führen (Funde #8, #9 aus PR #20).
- **TypeScript-Option `noUncheckedIndexedAccess`:** eigener kleiner PR (Review PR #19).
- Punkte fürs Ecosystem (Zeile zu `curl` in der globalen `CLAUDE.md`, `receiving-code-review`) stehen in der
  [[docs/Nächste Session|Übergabe des Ecosystems]].

## Passende Skills

- `assistent-bauen`: Supabase-Einrichtung in Aufgabe 1
- `tdd`: Aufgaben 1 bis 7
- `fertig-pruefen`: vor dem Merge von Plan B, danach der Agent `plan-pruefer`
