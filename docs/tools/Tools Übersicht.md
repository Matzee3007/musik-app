---
titel: Tools Übersicht
status: aktiv
erstellt: 2026-10-18
tags: [tools, übersicht, lernen]
---

# Tools Übersicht

Landkarte aller Werkzeuge im Projekt. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]]. Abkürzungen stehen in [[Abkürzungen]].

Werkzeuge, die jedes Projekt nutzt (Terminal, Git, Claude Code, Docker …), haben ihre Notiz im Ecosystem
([[Werkzeuge Übersicht]]). Hier steht für sie nur, wie sie in diesem Projekt eingerichtet sind
(`<Werkzeug> - Einrichtung.md`). Werkzeuge nur dieses Projekts haben ihre ganze Notiz hier, im Aufbau:
Was ist das, wofür nutzen wir es, wichtige Begriffe, wie wir es eingerichtet haben, typischer Ablauf,
alle benutzten Befehle, Fehler.

## Im Einsatz

| Werkzeug | Seit | Wofür in einem Satz |
|---|---|---|
| [[Git]], [[GitHub und gh]] | 2026-10-18 | Versionen und Repo `musik-app` |
| [[Claude Code]] ([[projects/musik-app/docs/tools/Claude Code - Einrichtung|Einrichtung]]) | 2026-10-18 | KI-Entwickler im Terminal, mit Prettier-Hook |
| [[Next.js.md\|Next.js]] (mit Node.js 24, npm, TypeScript, React) | 2026-10-18 | Oberfläche und Server-Teil der App |
| [[Vitest, ESLint und Prettier]] | 2026-10-18 | Tests, Code prüfen, einheitlich formatieren |
| [[projects/musik-app/docs/tools/GitHub Actions - Einrichtung\|GitHub Actions]] | 2026-10-18 | prüft jeden PR automatisch (CI) |
| [[Spotify Web API]] | 2026-10-19 | Anmeldung des DJs, seine Playlists und ihre Songs, Abspielen über das Web Playback SDK |
| [[MusicBrainz]] | 2026-10-19 | Erscheinungsjahr eines Songs über den ISRC |
| [[projects/musik-app/docs/tools/Vercel\|Vercel]] | 2026-10-20 | bringt die App ins Internet, `musik-bingo.vercel.app` und eine Vorschau je PR |
| [[projects/musik-app/docs/tools/Supabase\|Supabase]] | 2026-10-22 | Realtime-Kanäle für die Räume: wer ist da, Nachrichten an alle |
| [[Playwright]] | 2026-10-22 | Tests im echten Browser: Tisch und Handys über das echte Supabase |
| [[projects/musik-app/docs/tools/Dependabot - Einrichtung\|Dependabot]] | 2026-10-26 | öffnet PRs für neue Paketversionen und Sicherheitslücken |
| [[WebRTC]] | 2026-10-26 | schickt im Online-Modus den Ton vom DJ direkt an jeden Spieler |

## Geplant

| Werkzeug | Phase | Wofür in einem Satz |
|---|---|---|
