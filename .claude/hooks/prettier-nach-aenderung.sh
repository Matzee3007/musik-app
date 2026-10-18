#!/usr/bin/env bash
# PostToolUse-Hook: läuft, nachdem Claude eine Datei mit Edit oder Write geändert hat.
# Claude Code übergibt die Details als JSON auf stdin, z. B. {"tool_input": {"file_path": "..."}}.

f=$(jq -r '.tool_input.file_path // empty')

# Nur Dateien in diesem Projekt, nur Endungen, die Prettier formatiert. Markdown gehört Obsidian.
case "$f" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac
case "$f" in
  *.ts | *.tsx | *.js | *.mjs | *.json | *.css | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Formatieren. Scheitert Prettier (z. B. Syntaxfehler), geht die Meldung mit Exit-Code 2 an Claude.
npx --no-install prettier --write --log-level warn "$f" >&2 || exit 2

# Prüfen ohne --fix, sonst würde ESLint z. B. einen gerade ergänzten, noch unbenutzten
# Import löschen. Warnungen lassen ESLint mit Exit-Code 0 enden, nur Fehler kommen zurück.
case "$f" in
  *.ts | *.tsx | *.js | *.mjs)
    npx --no-install eslint "$f" >&2 || exit 2
    ;;
esac
exit 0
