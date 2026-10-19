---
titel: Arbeitsumgebung
status: aktiv
erstellt: 2026-10-18
tags: [arbeitsumgebung, einrichtung]
---

# Arbeitsumgebung

Was dieses Projekt auf dem Rechner braucht, um zu laufen. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Die Einrichtung des Rechners für alle Projekte (Terminal, Statuszeile, `install.sh`) steht in [[Rechner]].

## Voraussetzungen

- Node.js 24 LTS mit npm 11 (Homebrew `node@24`, eingerichtet 2026-10-18, siehe [[Next.js.md|Next.js]])
- Spotify Premium für das Konto des DJs (Web Playback SDK, Development Mode)
- ab Phase 3: Supabase CLI und Docker Desktop für die lokale Datenbank

## Umgebungsvariablen

Geheimnisse stehen in `.env` (nicht im Repo, Claude darf sie nicht lesen). Welche Variablen es gibt, steht
ohne Werte in `.env.example`, sobald die erste gebraucht wird.

## Starten und stoppen

```bash
npm ci        # Abhängigkeiten installieren (nach dem Klonen oder wenn package-lock.json sich ändert)
npm run dev   # App starten, http://localhost:3000, stoppen mit Ctrl+C
```
