---
titel: Claude Code - Einrichtung
status: aktiv
erstellt: 2026-10-18
tags: [tools, claude-code, hooks, einrichtung]
---

# Claude Code: Einrichtung in musik-app

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Was Claude Code ist, die Begriffe (Hook, Skill, Plugin), Befehle und Fehler stehen in
der Werkzeug-Notiz des Ecosystems: [[Claude Code]]. Hier steht nur, wie es in diesem Projekt eingerichtet ist.

## Wie haben wir es eingerichtet?

Alles steht in `.claude/settings.json` (im Repo, gilt für jeden, der im Projekt arbeitet).

1. **2026-10-18, Projektstart:** `permissions.deny` sperrt `Read(./.env)` und `Edit(./.env)`. Claude kann die Datei
   mit den Geheimnissen (später Spotify- und Supabase-Schlüssel) weder lesen noch ändern.
2. **2026-10-18, Phase 0:** Hook `.claude/hooks/prettier-nach-aenderung.sh` als `PostToolUse` mit Matcher
   `Write|Edit`, nach dem Plan [[2026-10-18-ci-und-prettier-hook|Plan: CI und Prettier-Hook]]. Vorbild ist der
   ruff-Hook aus sport-fantasy.

## Der Prettier-Hook

Läuft automatisch, nachdem Claude eine Datei geändert hat:

- Er bearbeitet nur Dateien im Projekt mit den Endungen `ts`, `tsx`, `js`, `mjs`, `json`, `css`, `yml` und `yaml`.
  Markdown fasst er nicht an, Doku gehört Obsidian.
- **Prettier** formatiert die Datei. Scheitert das (z. B. Syntaxfehler), geht die Meldung mit Exit-Code 2 an Claude.
- **ESLint** prüft Code-Dateien ohne `--fix`. Fehler gehen an Claude, Warnungen (z. B. unbenutzte Variable) nicht,
  weil ESLint bei Warnungen mit Exit-Code 0 endet.

Der Hook greift nur bei den Werkzeugen Write und Edit. Dateien, die Claude per Shell schreibt (`cat <<EOF`), bleiben
unformatiert, bis `npx prettier --write <datei>` läuft (2026-10-19, `npm run check` fand es). Weil er nach jeder
einzelnen Änderung prüft, meldet ESLint auch Zwischenstände, z. B. eine Komponente, deren Import erst mit der nächsten
Änderung kommt.

Die Änderung an `settings.json` wirkte sofort, ohne Neustart von Claude Code. Ansehen oder abschalten: `/hooks`.

### Hook von Hand testen

Der Hook liest JSON von stdin. So lässt er sich ohne Claude prüfen:

```bash
export CLAUDE_PROJECT_DIR="$PWD"
printf 'export const a   =  1\n' > "app/probe datei.ts"
echo "{\"tool_input\":{\"file_path\":\"$PWD/app/probe datei.ts\"}}" | .claude/hooks/prettier-nach-aenderung.sh
echo $?                    # 0, die Datei enthält jetzt: export const a = 1;
rm "app/probe datei.ts"
```

Am 2026-10-18 geprüft: Pfad mit Leerzeichen (formatiert, 0), Syntaxfehler (2), ESLint-Fehler `rules-of-hooks` (2),
Markdown (unverändert, 0), Datei außerhalb des Projekts (nichts passiert, 0).

## Fehler

**`no such file or directory: .claude/hooks/prettier-nach-aenderung.sh`** (2026-10-18, absichtlich vor dem Anlegen):
- Ursache: Das Skript gab es noch nicht.
- Lösung: Skript anlegen und mit `chmod +x` ausführbar machen. Ohne `chmod +x` kommt stattdessen
  `permission denied`.
