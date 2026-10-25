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
- **Daten und Echtzeit:** Supabase (Postgres, Realtime-Kanäle für die Spielräume)
- **Hosting:** Vercel
- **Qualität:** ESLint, Prettier, Vitest, Playwright für Browser-Tests
- **Musik:** Spotify Web API und Web Playback SDK (Premium des Entwicklers), MusicBrainz für das Erscheinungsjahr

Begründung und Alternativen: `docs/adr/0001-stack.md`.

## Architekturprinzipien

1. **Nur der DJ meldet sich bei Spotify an.** Mitspieler treten über einen Raum-Code bei und brauchen kein
   Spotify-Konto. Grund: Eine private Spotify-App erlaubt höchstens 5 freigeschaltete Konten.
2. **Spiellogik als reine Funktionen, testgetrieben:** Rad, Karte, Songauswahl und Bingo-Erkennung hängen
   weder an React noch an Spotify oder Supabase.
3. **Kategorien sind Daten, nicht Code.** Eine neue Kategorie braucht Name, Farbe und Lösung (welche Angabe
   zum Song sie zeigt), keinen Umbau.
4. **Das Erscheinungsjahr kommt nicht nur von Spotify.** Album-Daten von Remastern und Best-ofs sind oft falsch,
   das Jahr kommt aus MusicBrainz und lässt sich vom DJ in der Auflösung korrigieren
   (`docs/adr/0007-keine-songliste-vor-dem-spiel.md`). Es wird je Playlist einmal ermittelt und
   gespeichert, nicht während des Spiels.
5. **Kontext liegt in Dateien** (`CLAUDE.md`, `docs/`), nicht im Chatverlauf.

## Repo-Struktur

Aktuell:

```
app/              Next.js App Router: layout.tsx, page.tsx, globals.css, raum/[code]/ (Handy), ui/ (Ansichten),
                  callback/ (Rückkehr von der Spotify-Anmeldung), api/erscheinungsjahr/ (MusicBrainz über den Server)
lib/              Spiellogik als reine Funktionen: Rad, Karte, Bingo, Songliste, Spielzüge (spiel.ts);
                  raum/ für Räume (Code, Spieler, Speicher, Kanal über Supabase Realtime),
                  spotify/ für Anmeldung (PKCE), Playlists und Abspielen
__tests__/        Vitest-Tests, lib/ für die Spiellogik, hilfen/ für Testhilfen und Nachbauten
e2e/              Playwright-Tests im Browser gegen das echte Supabase, hilfen/ mit den Bots Tisch und Spieler
specs/            Testpläne der Playwright-Agents (.claude/agents/playwright-test-*.md)
scripts/          Assistenten für Einrichtungen von Hand (supabase-einrichten.sh)
portraet/         Projekt-Porträt als Artifact (index.html, data.json), Skill portraet-bauen
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
npm run dev                # App lokal starten, http://127.0.0.1:3000 (nicht localhost, Spotify verlangt 127.0.0.1)
npm run lint               # ESLint prüft den Code
npm run format             # Prettier formatiert den Code (Markdown nicht)
npm run typecheck          # Next.js-Typen erzeugen, dann TypeScript prüfen
npm test                   # Vitest einmal ausführen (npm run test:watch: bei jeder Änderung)
npm run build              # Produktionsfassung bauen
npm run check              # alle Prüfungen: lint, format:check, typecheck, test
npm run e2e                # Playwright, nur lokal: braucht Supabase in .env.local, nicht in der CI
npx playwright test --repeat-each=3   # jeden Browser-Test dreimal, nach Änderungen am Raum
gh pr checks <nr>          # CI-Ergebnis eines PRs (GitHub Actions)
```

Nach Änderungen per Shell (Heredoc, Python, `sed`) `npx prettier --write <dateien>` ausführen: Der Prettier-Hook
greift nur bei Edit und Write.

Änderungen an `app/globals.css` übernimmt ein laufender `npm run dev` nicht: Server neu starten, bevor Screenshots oder
`npm run e2e` laufen.

Vor jedem Commit mit Code oder Konfiguration (auch Skills, Agents, Workflows): `npm run check` muss mit Exit-Code 0
durchlaufen. Reine Doku-Commits (Journal, Übergabe, Notizen in `docs/`) brauchen das nicht, CI prüft trotzdem jeden PR.
Vor jedem Merge: `gh pr checks <nr>` muss grün sein (privates Repo mit GitHub Free, daher kein Branch-Schutz).

Production: `https://musik-bingo.vercel.app`, jeder Merge in `main` erneuert sie, jeder PR bekommt eine Vorschau.
Spotify-Anmeldung nur unter dieser Adresse und lokal, Vorschauen zeigen nur die Demo (`docs/tools/Vercel.md`).

## Dokumentation

Allgemeine Konventionen (ADRs, Lernjournale, Tool-Notizen, Skills, Tools für später) stehen in
der globalen `CLAUDE.md`. Roadmap und Phasen stehen in `docs/Projektvision.md`.
