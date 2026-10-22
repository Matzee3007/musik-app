---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-22
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-22. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], letztes Journal:
[[Lernjournal Phase 3 - Raum und Beitritt]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #29)
- **Offene PRs:** keine
- **Nicht committet:** nichts. `.env.local` mit Spotify-Client-ID und Supabase-Werten liegt nur lokal und ist von Git
  ignoriert.
- **Production:** `https://musik-bingo.vercel.app` mit Spotify und Räumen (Plan B fertig, PR #27 und #28), mit zwei
  echten Handys geprüft

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` und der Prettier-Hook geladen werden:

   ```bash
   cd ~/claude-ecosystem/projects/musik-app
   claude
   ```

2. `git pull` holt den Stand von GitHub, falls seitdem etwas gemergt wurde.

## Womit es weitergeht

**Phase 3 – Mehrspieler, Plan C (Live-Spiel):** Karte, Runden und Bingo am Handy, der Tisch schickt Runde und
Auflösung über den Raum-Kanal (`RaumNachricht` in `lib/raum/kanal.ts` ist dafür vorbereitet). Die Abgrenzung steht in
der [[projects/musik-app/docs/Projektvision|Projektvision]] („Geklärte Fragen“ zu Phase 3). Ablauf:

1. Plan C mit `plan-schreiben` schreiben, offene Fragen zum Spiel am Handy mit dem Entwickler klären, freigeben.
2. Plan C umsetzen, am Ende ein Spiel mit echten Handys unter Production. Danach ist Phase 3 abgeschlossen.

**Beim Planen von Plan C mitdenken** (bewusst gelassene Review-Funde, Details im Journal):

- Ein Handy, das „Raum geschlossen“ verpasst (Bildschirm gesperrt), bleibt im Zustand „drin“ (Fund 5, PR #28). Mit
  Runden vom Tisch fällt das eher auf, z. B. wenn das Handy beim Zurückkommen keinen Tisch mehr sieht.
- Ein Name wird frei, solange sein Spieler nicht verbunden ist (Fund 6, PR #27). Mit Karten pro Spieler könnte das
  zählen.

**Nebenbei vorgemerkt, kein Muss:**

- **Leere Startseite ohne Netz:** Kann das Spotify-Token offline nicht erneuert werden, bleibt die Startseite leer
  (Fund 7, PR #27, schon vor Plan B so). Lösung wäre ein `.catch` beim Laden des Tokens in `app/ui/start.tsx`.
- **Funde aus dem Review von PR #24** (kollaborative Playlists, 401 bei „Nochmal versuchen“, leere Liste bei
  `GET /v1/me`): Details in [[2026-10-20-deployment|Plan A]], Aufgabe 4.
- **Ladezeit beim Vorbereiten** (81 Songs gut anderthalb Minuten): Jahre in Supabase (Phase 4) oder im Hintergrund.
- **Test am Laptop mit echtem Player ohne WLAN:** Was tut das Web Playback SDK bei Pause und „Weiterhören“?
- **Aufräumen bei Plan C:** Fehler in `lib/spotify/player.ts` in Meldungen übersetzen, Startzähler nur einmal führen
  (Funde #8, #9 aus PR #20).
- **TypeScript-Option `noUncheckedIndexedAccess`:** eigener kleiner PR (Review PR #19).
- Punkte fürs Ecosystem stehen in der [[docs/Nächste Session|Übergabe des Ecosystems]].

## Passende Skills

- `plan-schreiben`: Plan C in kleinen, prüfbaren Aufgaben
- `tdd`: Spiellogik und Ansichten am Handy
- `fertig-pruefen`: vor dem Merge, danach der Agent `plan-pruefer`
