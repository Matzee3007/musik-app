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

## Geplant

| Werkzeug | Phase | Wofür in einem Satz |
|---|---|---|
| Supabase | 3 | Datenbank und Live-Abgleich zwischen den Geräten |
| Vercel | 3 | App ins Internet bringen |
| Playwright | später | Tests im echten Browser |
