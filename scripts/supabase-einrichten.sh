#!/usr/bin/env bash
#
# Ein Assistent führt einen Menschen Schritt für Schritt durch einen Ablauf von Hand.
# Erzeugt mit dem Skill assistent-bauen.
#
# Alles oberhalb der Markierung "STUFEN" ist die Bibliothek: nicht von Hand ändern.
# Die Stufen kommen unter die Markierung.

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────
# Bibliothek: einheitliche Bedienung, in jedem Assistenten gleich.
# ──────────────────────────────────────────────────────────────────────────

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  FETT=$(tput bold); BLASS=$(tput dim); NORMAL=$(tput sgr0)
  BLAU=$(tput setaf 4); GRUEN=$(tput setaf 2); GELB=$(tput setaf 3)
else
  FETT=""; BLASS=""; NORMAL=""; BLAU=""; GRUEN=""; GELB=""
fi

# Wird oben im Abschnitt STUFEN gesetzt.
STUFEN_GESAMT=0

_STUFE_NR=0
ENV_DATEI="${ENV_DATEI:-.env}"
GESCHRIEBEN_ENV=()    # Schlüssel, die in diesem Lauf in ENV_DATEI geschrieben wurden
GESCHRIEBEN_SECRET=() # Secrets, die in diesem Lauf gesetzt wurden
UEBERSPRUNGEN=()      # was nicht ging (z. B. gh fehlt)

# _leeren leert das Terminal, damit nur der aktuelle Schritt zu sehen ist. Ohne Terminal
# (Ausgabe in eine Datei oder Pipe) passiert nichts, damit Logs lesbar bleiben.
_leeren() {
  [[ -t 1 ]] || return 0
  if command -v tput >/dev/null 2>&1 && tput clear 2>/dev/null; then return 0; fi
  printf '\033[2J\033[3J\033[H'
}

# banner "Titel" zeigt den Anfang: was dieser Assistent tut.
banner() {
  _leeren
  printf '\n%s%s  %s%s\n' "$FETT" "$BLAU" "$1" "$NORMAL"
  printf '%s  %s Stufen%s\n\n' "$BLASS" "$STUFEN_GESAMT" "$NORMAL"
  printf '%s  Du bedienst den Browser, der Assistent sagt dir genau, was zu tun ist, und\n' "$BLASS"
  printf '  nimmt die Werte entgegen, die du hineinkopierst. Abbrechen geht jederzeit mit\n'
  printf '  Ctrl-C, beim nächsten Start sind gespeicherte Werte noch da.%s\n' "$NORMAL"
  warte "Bereit?"
}

# stufe "Name" leert den Bildschirm, kündigt eine Stufe an und zeigt den Fortschritt.
stufe() {
  _leeren
  _STUFE_NR=$((_STUFE_NR + 1))
  printf '\n%s%s▸ Stufe %s/%s · %s%s\n' \
    "$FETT" "$BLAU" "$_STUFE_NR" "$STUFEN_GESAMT" "$1" "$NORMAL"
}

# sag "..." gibt eine Anweisung aus.
sag()     { printf '  %s\n' "$1"; }
# schritt "..." ist ein Handgriff des Menschen im Browser.
schritt() { printf '  %s•%s %s\n' "$BLAU" "$NORMAL" "$1"; }
hinweis() { printf '  %s%s%s\n' "$BLASS" "$1" "$NORMAL"; }
warnung() { printf '  %s⚠ %s%s\n' "$GELB" "$1" "$NORMAL"; }

# adresse_oeffnen URL öffnet sie im Browser, auf jedem System einschließlich WSL.
adresse_oeffnen() {
  local url="$1"
  printf '  %s↗ öffne%s %s\n' "$GRUEN" "$NORMAL" "$url"
  { if   command -v wslview     >/dev/null 2>&1; then wslview "$url"
    elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url"
    elif command -v xdg-open    >/dev/null 2>&1; then xdg-open "$url"
    elif command -v open        >/dev/null 2>&1; then open "$url"
    else false; fi
  } >/dev/null 2>&1 || warnung "Browser ließ sich nicht öffnen, bitte selbst aufrufen: $url"
}

# warte "Text" wartet, bis der Mensch den Handgriff bestätigt.
warte() {
  printf '  %s%s%s ' "$BLASS" "${1:-Weiter mit Enter}" "$NORMAL"
  read -r _ || true
}

# bestaetige "Frage" ist eine j/N-Abfrage, erfolgreich bei Ja.
bestaetige() {
  local antwort=""
  printf '  %s? %s [j/N] ' "$GELB" "$1"
  read -r antwort || true
  [[ "$antwort" =~ ^[JjYy] ]]
}

# _vorhanden SCHLÜSSEL: aktueller Wert in ENV_DATEI, falls vorhanden. Macht die einfachen
# Anführungszeichen von env_schreiben oder einen einfachen Wert in doppelten rückgängig.
_vorhanden() {
  [[ -f "$ENV_DATEI" ]] || return 1
  local zeile wert sq="'\\''"; zeile=$(grep -E "^${1}=" "$ENV_DATEI" | tail -n1) || return 1
  wert="${zeile#*=}"
  if [[ "$wert" == \'*\' ]]; then wert="${wert:1:${#wert}-2}"; wert="${wert//"$sq"/\'}"
  elif [[ "$wert" == \"*\" ]]; then
    wert="${wert:1:${#wert}-2}"
    [[ "$wert" == *[\\\$\"]* ]] && return 1   # Escapes, $ oder ": nicht sicher lesbar, neu fragen
  fi
  printf '%s' "$wert"
}

# frage SCHLÜSSEL "Text" liest einen Wert in $SCHLÜSSEL. Bei erneutem Lauf ist der Wert aus
# ENV_DATEI vorbelegt (Enter behält ihn). Sichtbare Eingabe (nicht geheim), mit Readline.
# Scheitert bei Dateiende ohne Eingabe.
frage() {
  local schluessel="$1" text="$2" aktuell eingabe s=$'\001' e=$'\002' p rc=0
  aktuell=$(_vorhanden "$schluessel" || true)
  # Readline braucht die Farbcodes in \001..\002, um den Cursor richtig zu setzen.
  p="  $s$FETT$e$text$s$NORMAL$e "
  [[ -n "$aktuell" ]] && p+="$s$BLASS$e[Enter behält den aktuellen Wert]$s$NORMAL$e "
  read -e -r -p "$p" eingabe || rc=1
  if (( rc )) && [[ -z "$eingabe" ]]; then return 1; fi
  [[ -z "$eingabe" && -n "$aktuell" ]] && eingabe="$aktuell"
  printf -v "$schluessel" '%s' "$eingabe"
}

# frage_geheim SCHLÜSSEL "Text" wie frage, aber die Eingabe bleibt unsichtbar.
frage_geheim() {
  local schluessel="$1" text="$2" aktuell eingabe rc=0
  aktuell=$(_vorhanden "$schluessel" || true)
  if [[ -n "$aktuell" ]]; then
    printf '  %s%s%s %s[Enter behält den aktuellen Wert]%s ' "$FETT" "$text" "$NORMAL" "$BLASS" "$NORMAL"
  else
    printf '  %s%s%s ' "$FETT" "$text" "$NORMAL"
  fi
  read -rs eingabe || rc=1
  printf '\n'
  if (( rc )) && [[ -z "$eingabe" ]]; then return 1; fi
  [[ -z "$eingabe" && -n "$aktuell" ]] && eingabe="$aktuell"
  printf -v "$schluessel" '%s' "$eingabe"
}

# env_schreiben SCHLÜSSEL WERT trägt SCHLÜSSEL='WERT' in ENV_DATEI ein (ersetzt eine
# vorhandene Zeile) und setzt $SCHLÜSSEL. Wiederholbar. Legt ENV_DATEI mit Modus 0600 an,
# schreibt durch einen Symlink und behält den Modus einer vorhandenen Datei.
env_schreiben() {
  local schluessel="$1" wert="$2" tmp sq="'\\''"
  [[ -e "$ENV_DATEI" ]] || (umask 077 && : > "$ENV_DATEI")
  tmp=$(mktemp)
  grep -vE "^${schluessel}=" "$ENV_DATEI" > "$tmp" || true
  printf "%s='%s'\n" "$schluessel" "${wert//\'/$sq}" >> "$tmp"
  cat "$tmp" > "$ENV_DATEI"
  rm -f "$tmp"
  printf -v "$schluessel" '%s' "$wert"
  GESCHRIEBEN_ENV+=("$schluessel")
  printf '  %s✓ geschrieben%s %s → %s\n' "$GRUEN" "$NORMAL" "$schluessel" "$ENV_DATEI"
}

# secret_setzen NAME WERT setzt ein GitHub-Actions-Secret des Repos über gh. Ist gh nicht
# da oder nicht angemeldet, nur eine Warnung (und ein Eintrag für die Zusammenfassung).
secret_setzen() {
  local name="$1" wert="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if printf '%s' "$wert" | gh secret set "$name" >/dev/null 2>&1; then
      GESCHRIEBEN_SECRET+=("$name")
      printf '  %s✓ gesetzt%s GitHub-Secret %s\n' "$GRUEN" "$NORMAL" "$name"
      return
    fi
  fi
  UEBERSPRUNGEN+=("GitHub-Secret $name (von Hand: gh secret set $name)")
  warnung "GitHub-Secret $name übersprungen: gh nicht bereit, später setzen"
}

# variable_setzen NAME WERT setzt eine GitHub-Actions-Variable des Repos (nicht geheim).
variable_setzen() {
  local name="$1" wert="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if gh variable set "$name" --body "$wert" >/dev/null 2>&1; then
      printf '  %s✓ gesetzt%s GitHub-Variable %s\n' "$GRUEN" "$NORMAL" "$name"
      return
    fi
  fi
  UEBERSPRUNGEN+=("GitHub-Variable $name")
  warnung "GitHub-Variable $name übersprungen: gh nicht bereit, später setzen"
}

# fertig leert den Bildschirm und fasst zusammen, was eingerichtet wurde.
fertig() {
  _leeren
  printf '\n%s%s  ✓ Einrichtung fertig%s\n' "$FETT" "$GRUEN" "$NORMAL"
  (( ${#GESCHRIEBEN_ENV[@]} ))    && hinweis "${#GESCHRIEBEN_ENV[@]} Wert(e) in $ENV_DATEI: ${GESCHRIEBEN_ENV[*]}"
  (( ${#GESCHRIEBEN_SECRET[@]} )) && hinweis "${#GESCHRIEBEN_SECRET[@]} GitHub-Secret(s): ${GESCHRIEBEN_SECRET[*]}"
  if (( ${#UEBERSPRUNGEN[@]} )); then
    printf '\n'; warnung "noch von Hand zu tun:"
    for s in "${UEBERSPRUNGEN[@]}"; do hinweis "  - $s"; done
  fi
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────
# STUFEN: diesen Abschnitt schreiben. Eine stufe() je Handgriff des Menschen.
# Das Beispiel unten ersetzen. STUFEN_GESAMT auf die Zahl der Stufen setzen.
# Alle Stufen in assistent_starten lassen und die letzte Zeile unverändert: So liest bash
# die ganze Datei vor der ersten Frage, eine Änderung mitten im Lauf kann nichts kaputt machen.
# ──────────────────────────────────────────────────────────────────────────


assistent_starten() {

STUFEN_GESAMT=4
ENV_DATEI=.env.local   # nur in Next.js-Projekten einschalten, Next.js liest .env.local

banner "Supabase für die Musik-App einrichten"

stufe "Supabase: Projekt anlegen"
sag "Die Räume laufen über Supabase Realtime. Dafür brauchst du ein Supabase-Projekt."
adresse_oeffnen "https://supabase.com/dashboard/new"
schritt "Falls nötig anmelden oder ein kostenloses Konto anlegen."
schritt "Project name: musik-bingo"
schritt "Database Password: auf „Generate a password“ klicken (die App braucht es nicht)."
schritt "Region: Central EU (Frankfurt)"
schritt "„Create new project“ klicken und warten, bis das Projekt bereit ist (1–2 Minuten)."
warte "Projekt ist bereit? Weiter mit Enter"

stufe "Supabase: URL und Schlüssel"
sag "Die App braucht die Projekt-URL und den öffentlichen Schlüssel (publishable key)."
hinweis "Beide sind öffentlich und landen im Browser jedes Spielers, das ist so gedacht."
schritt "Im Projekt oben auf „Connect“ klicken, dort steht beides bereit zum Kopieren."
schritt "Alternativ: Project Settings → API Keys (Schlüssel) und „Connect“ (URL)."
frage NEXT_PUBLIC_SUPABASE_URL "Projekt-URL (https://….supabase.co) einfügen:"
until [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https://([a-z0-9]+)\.supabase\.co/?$ ]]; do
  warnung "Das sieht nicht aus wie https://<kennung>.supabase.co"
  frage NEXT_PUBLIC_SUPABASE_URL "Projekt-URL einfügen:"
done
PROJEKT_REF="${BASH_REMATCH[1]}"
NEXT_PUBLIC_SUPABASE_URL="https://${PROJEKT_REF}.supabase.co"
frage NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "Publishable key (sb_publishable_…) einfügen:"
until [[ "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" == sb_publishable_* ]]; do
  warnung "Gesucht ist der Schlüssel, der mit sb_publishable_ beginnt (nicht der secret key)."
  frage NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "Publishable key einfügen:"
done
env_schreiben NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"
env_schreiben NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
warte

stufe "Supabase: öffentliche Realtime-Kanäle erlauben"
sag "Spieler treten ohne Anmeldung bei, die Kanäle der Räume sind deshalb öffentlich."
adresse_oeffnen "https://supabase.com/dashboard/project/${PROJEKT_REF}/realtime/settings"
schritt "Den Schalter „Allow public access“ suchen."
schritt "Ist er aus: einschalten und „Save changes“ klicken. Ist er an: nichts tun."
warte "„Allow public access“ ist an? Weiter mit Enter"

stufe "Vercel: Variablen eintragen"
sag "Damit die Räume auch unter musik-bingo.vercel.app und in den Vorschauen laufen."
adresse_oeffnen "https://vercel.com/matzee3007-s-projects/musik-bingo/settings/environment-variables"
schritt "„Add Environment Variable“ (bzw. „Add New“) klicken."
schritt "Umgebungen: Production und Preview anhaken (Development nicht nötig)."
schritt "Diese beiden Paare eintragen:"
printf '\n    %sNEXT_PUBLIC_SUPABASE_URL%s\n    %s\n' "$FETT" "$NORMAL" "$NEXT_PUBLIC_SUPABASE_URL"
printf '    %sNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY%s\n    %s\n\n' "$FETT" "$NORMAL" "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
schritt "„Save“ klicken."
hinweis "Kein Redeploy nötig: Production nutzt Supabase erst nach dem Merge, und der baut neu."
warte "Beide Variablen gespeichert? Weiter mit Enter"

fertig
sag "Weiter in Claude Code: Bescheid sagen, dass der Assistent durch ist."
}

assistent_starten "$@"; exit
