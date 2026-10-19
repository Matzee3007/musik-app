# CLAUDE.md – Musik-App

Diese Datei lädt Claude Code bei jedem Start in diesem Projekt automatisch. Sie enthält den
dauerhaften Projektkontext. Die ausführliche Vision steht in `docs/Projektvision.md`.
Projektunabhängige Regeln (Arbeitsweise, Git, Phasenwechsel, Doku-Konventionen, Antwortstil)
stehen in der globalen `~/.claude/CLAUDE.md` (Repo `claude-ecosystem`, `config/CLAUDE.md`).

Regeln von Next.js für Coding-Agents (Doku der installierten Version in `node_modules/next/dist/docs/` lesen):

@AGENTS.md

## Projektziel

Hitster Bingo als Web-App, damit der Entwickler es mit seinen Freunden spielen kann: Ein Rad wählt eine Kategorie
(Titel, Interpret, Jahrzehnt, Erscheinungsjahr, Jahr ±3), ein Song aus einer eigenen Spotify-Playlist läuft,
wer richtig liegt, hakt ein Feld seiner 5×5-Karte ab (die Spieler prüfen selbst, `docs/adr/0002-spieler-pruefen-selbst.md`).
Der Laptop ist der „Tisch“, jeder Spieler hat Karte und Notizfläche auf dem eigenen Handy. Kein Streamingdienst und kein
öffentliches Produkt unter dem Namen „Hitster“. Fachbegriffe: `docs/Glossar.md`.

Gleichwertiges Ziel ist das **Lernen**: TypeScript, Spotify in eine App einbinden und aus einer Idee Schritt für
Schritt eine funktionierende App entwickeln.

## Stack

- **Sprache:** TypeScript
- **Framework:** Next.js (React), Laufzeit Node.js 24 LTS, Pakete mit npm
- **Daten und Echtzeit:** Supabase (Postgres, Realtime-Kanäle für die Spielräume), ab Phase 3
- **Hosting:** Vercel, ab Phase 3
- **Qualität:** ESLint, Prettier, Vitest (später Playwright für Browser-Tests)
- **Musik:** Spotify Web API und Web Playback SDK (Premium des Entwicklers), MusicBrainz für das Original-Jahr

Begründung und Alternativen: `docs/adr/0001-stack.md`.

## Architekturprinzipien

1. **Nur der DJ meldet sich bei Spotify an.** Mitspieler treten über einen Raum-Code bei und brauchen kein
   Spotify-Konto. Grund: Eine private Spotify-App erlaubt höchstens 5 freigeschaltete Konten.
2. **Spiellogik als reine Funktionen, testgetrieben:** Rad, Karte, Songauswahl und Bingo-Erkennung hängen
   weder an React noch an Spotify oder Supabase.
3. **Kategorien sind Daten, nicht Code.** Eine neue Kategorie braucht Name, Farbe und Lösung (welche Angabe
   zum Song sie zeigt), keinen Umbau.
4. **Das Erscheinungsjahr kommt nicht nur von Spotify.** Album-Daten von Remastern und Best-ofs sind oft falsch,
   das Jahr kommt aus MusicBrainz und lässt sich vom DJ korrigieren. Es wird je Playlist einmal ermittelt und
   gespeichert, nicht während des Spiels.
5. **Kontext liegt in Dateien** (`CLAUDE.md`, `docs/`), nicht im Chatverlauf.

## Repo-Struktur

Aktuell (Phase 1):

```
app/              Next.js App Router: layout.tsx, page.tsx, globals.css
lib/              Spiellogik als reine Funktionen: Rad, Karte, Bingo, Songliste, Spielzüge (spiel.ts)
__tests__/        Vitest-Tests, lib/ für die Spiellogik, hilfen/ für Testhilfen
docs/             Obsidian-Vault: adr/, journal/, plaene/, tools/
.github/          workflows/ci.yml: CI mit GitHub Actions
AGENTS.md         Regeln von Next.js für Coding-Agents (schreibt `next dev` neu)
CLAUDE.md
package.json      Abhängigkeiten und npm-Skripte
```

## Befehle

```bash
npm ci                     # Abhängigkeiten genau nach package-lock.json installieren
npm install -D <paket>     # Entwicklungs-Abhängigkeit hinzufügen (ohne -D: Laufzeit)
npm run dev                # App lokal starten, http://localhost:3000
npm run lint               # ESLint prüft den Code
npm run format             # Prettier formatiert den Code (Markdown nicht)
npm run typecheck          # Next.js-Typen erzeugen, dann TypeScript prüfen
npm test                   # Vitest einmal ausführen (npm run test:watch: bei jeder Änderung)
npm run build              # Produktionsfassung bauen
npm run check              # alle Prüfungen: lint, format:check, typecheck, test
gh pr checks <nr>          # CI-Ergebnis eines PRs (GitHub Actions)
```

Vor jedem Commit: `npm run check` muss mit Exit-Code 0 durchlaufen. Vor jedem Merge: `gh pr checks <nr>` muss grün
sein (privates Repo mit GitHub Free, daher kein Branch-Schutz).

## Dokumentation

Allgemeine Konventionen (ADRs, Lernjournale, Tool-Notizen, Skills, Tools für später) stehen in
der globalen `CLAUDE.md`. Roadmap und Phasen stehen in `docs/Projektvision.md`.
