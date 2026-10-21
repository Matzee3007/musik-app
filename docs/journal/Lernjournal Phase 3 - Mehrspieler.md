---
titel: Lernjournal Phase 3 - Mehrspieler
status: aktiv
phase: 3
erstellt: 2026-10-21
tags: [lernjournal, phase-3, tdd, code-review, supabase, realtime, vercel, grill-with-docs]
---

# Lernjournal Phase 3: Mehrspieler

Fortsetzung von [[Lernjournal Phase 2 - Spotify]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Die Session lief vom Abend des 2026-10-20 bis in den 2026-10-21: erst die Restpunkte aus Phase 1 und 2, dann der Start
von Phase 3.

## Erledigt

- [x] Restpunkt Phase 1: `feldAbhaken` und `abhakenZuruecknehmen` lassen das Spiel bei einem Index außerhalb der Karte
  unverändert (PR #19)
- [x] Restpunkt Phase 2: Spotify-Fehler mitten im Spiel abgefangen. Meldung am Tisch („Spotify reagiert nicht.“ oder
  die Meldung eines `PlayerFehler`), das Spiel geht weiter, „Nochmal“ und „Weiterhören“ starten den Song nach einem
  gescheiterten Start neu, späte Fehler älterer Befehle werden verworfen (PR #20, zwei Runden `/code-review`)
- [x] Phase 3 mit `/grill-with-docs` geklärt (F1 bis F21): drei Pläne A Deployment, B Raum und Beitritt,
  C Live-Spiel; [[0004-mehrspieler-ohne-tabellen|ADR 0004]] (Broadcast und Presence statt Tabellen), Glossar um
  „Raum-Code“ ergänzt (PR #21)
- [x] Plan A geschrieben: [[2026-10-20-deployment|Deployment auf Vercel]]
- [x] Plan A, Aufgabe 1: Hinweis auf der Startseite ohne Client-ID passt auch für Vorschau-Adressen
- [x] Plan A, Aufgabe 2, Schritte 1 bis 3: Node 24 in `package.json`, PR #22, Vercel-Projekt `musik-bingo` angelegt,
  `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` nur für Production. `https://musik-bingo.vercel.app` antwortet mit 200, der PR hat
  den ersten Vercel-Check. Aus dem Review: `engines` von Hand ins Lockfile (`npm install --package-lock-only` hätte
  66 fremde Zeilen mitgebracht), übrige Funde als Notizen in Plan A. PR #22 gemergt.
- [ ] Plan A, Aufgabe 2, Schritte 4 bis 6 (Production und Vorschau im Browser prüfen, Tool-Notiz Vercel) und
  Aufgabe 3 (Redirect-URI bei Spotify, Anmeldung und Musik unter der Vercel-Adresse)

## Befehle: Git und PRs

```bash
git switch -c fix/feldabhaken-index
gh pr create --title "…" --body "…"
gh pr checks 20 --watch
gh pr view 20 --json mergeable -q .mergeable
gh pr merge 20 --merge --delete-branch
```

- `git switch -c <branch>`: legt einen Branch an und wechselt hinein, damit nichts direkt auf `main` landet.
- `gh pr checks <nr> --watch`: wartet, bis die CI des PRs fertig ist, und zeigt das Ergebnis. Direkt nach dem Push
  meldet es manchmal „no checks reported“, weil GitHub den Lauf noch nicht angelegt hat; dann kurz warten.
- `gh pr view <nr> --json mergeable`: `UNKNOWN` heißt nur „GitHub rechnet noch“, erst bei `MERGEABLE` mergen.
- `gh pr merge <nr> --merge --delete-branch`: Merge-Commit wie bei den bisherigen PRs, danach Branch löschen.

## Befehle: Tests und Prüfungen

```bash
npx vitest run __tests__/lib/spiel.test.ts
npm run check >/dev/null 2>&1; echo "EXIT: $?"
npx prettier --write __tests__/ui/spiel-musik.test.tsx
/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" https://musik-bingo.vercel.app
```

- `npx vitest run <datei>`: nur eine Testdatei ausführen, schnell für den Rot-Grün-Zyklus.
- `npm run check …; echo "EXIT: $?"`: alle Prüfungen, danach den Exit-Code zeigen (0 heißt bestanden).
- `npx prettier --write <datei>`: formatiert eine Datei, die nicht über Edit/Write entstanden ist.
- `/usr/bin/curl … -w "%{http_code}"`: fragt nur den HTTP-Status einer Adresse ab, mit dem `curl` von macOS.

## Neu gelernt

### Rot muss aus dem richtigen Grund rot sein

Ein neuer Test soll mit genau dem erwarteten Fehler scheitern, z. B. `TypeError: Cannot read properties of undefined
(reading 'abgehakt')` oder `Unhandled Rejection: TypeError: Failed to fetch`. Erst dann beweist er, dass der Fix den
Fehler behebt. Bei `abhakenZuruecknehmen` war der Test rot, obwohl nichts abstürzte: Das Spiel sah gleich aus, war
aber ein neues Objekt (`toBe` vergleicht die Identität).

### Ein Promise ohne `catch` wird zum `unhandledRejection`

`p.tokenHolen().then(cb)` hatte keine Fehlerbehandlung. Scheiterte das Erneuern des Tokens, landete der Fehler als
`unhandledRejection` im Log. `.then(cb, () => {})` fängt ihn ab. In der Spielansicht bekommt jeder Befehl an den
Abspieler ein `.catch`, das eine Meldung setzt.

### Späte Fehler mit einem Zähler verwerfen

Bei wackligem Netz kann der Fehler eines alten Befehls erst eintreffen, wenn schon der nächste Song läuft. Jeder Start
bekommt deshalb eine Nummer (`startNr` als `useRef`), und ein Fehler zählt nur, wenn seine Nummer noch die aktuelle
ist. Auch das Drehen des Rads zählt als neuer Start.

### Review-Funde einordnen statt alle umsetzen

`/code-review` meldete zu PR #20 erst 9, nach dem Umbau noch einmal 9 Funde. Bei Fehlerbehandlung findet ein Review
immer noch einen Randfall. Geholfen hat: jeden Fund am Code nachprüfen, nach gemeinsamer Ursache gruppieren, beheben,
was am Spieleabend passieren kann, und den Rest begründet in die Übergabe schreiben. Ein Fund (Klicks mit Index
außerhalb der Karte) war gar nicht möglich, weil die Karte die Indizes selbst erzeugt.

### Supabase Realtime: Broadcast, Presence, Postgres Changes

Broadcast schickt Nachrichten an alle im Kanal, ohne etwas zu speichern. Presence zeigt, wer gerade im Kanal ist.
Postgres Changes meldet Änderungen an Tabellen live. Für Phase 3 reichen Broadcast und Presence (ADR 0004), Tabellen
mit RLS kommen erst mit dem Scoreboard.

### Vercel: Production, Preview und Umgebungsvariablen

Ein Merge in `main` erneuert die feste Adresse (Production), jeder PR bekommt eine eigene Vorschau-Adresse (Preview).
Umgebungsvariablen gelten je Umgebung und erst ab dem nächsten Build, nach einer Änderung also „Redeploy“. Weil
Spotify nur genau eingetragene Redirect-URIs annimmt, bekommt nur Production die Client-ID.

### `localStorage` gilt je Adresse

Token, vorbereitete Playlists und korrigierte Jahre von `http://127.0.0.1:3000` gibt es unter
`https://musik-bingo.vercel.app` nicht. Dort muss der DJ sich einmal neu anmelden und neu vorbereiten.

### Handys erreichen `127.0.0.1` nicht

`127.0.0.1` ist die Adresse des Laptops für sich selbst. Für Handys braucht es eine echte Adresse, und Spotify verlangt
außerhalb von `127.0.0.1` HTTPS. Deshalb kommt das Deployment in Phase 3 zuerst.

## Fehler und Lösungen

### `TypeError: Cannot read properties of undefined (reading 'abgehakt')`

- **Wo:** `feldAbhaken(spiel, -1)` in einer aufgelösten Runde (Restpunkt aus Phase 1)
- **Ursache:** `karte[index]` ist bei einem Index außerhalb der Karte `undefined`.
- **Lösung:** `if (!feld || …) return spiel;`, ebenso in `abhakenZuruecknehmen`
- **Prüfen:** `npx vitest run __tests__/lib/spiel.test.ts`

### `[browser] ⨯ unhandledRejection: TypeError: Failed to fetch` (aus Phase 2, jetzt gelöst)

- **Wo:** `getOAuthToken` in `lib/spotify/player.ts`
- **Ursache:** `p.tokenHolen().then(cb)` ohne Fehlerbehandlung
- **Lösung:** `.then(cb, () => {})`, Meldungen in der Spielansicht (PR #20)
- **Prüfen:** `npx vitest run __tests__/lib/spotify/player.test.ts`

### `npm run check` mit Exit-Code 1: `[warn] Code style issues found`

- **Wo:** nach dem Anhängen von Tests mit einem Heredoc (`cat >> datei <<'EOF'`)
- **Ursache:** Der Prettier-Hook läuft nur nach Edit und Write, nicht nach Shell-Befehlen.
- **Lösung:** `npx prettier --write <datei>`
- **Prüfen:** `npm run check >/dev/null 2>&1; echo $?` gibt `0` aus.

### `EXIT:` ohne Zahl nach `echo ${PIPESTATUS[0]}`

- **Wo:** Exit-Code von `npm run check | tail` anzeigen
- **Ursache:** `PIPESTATUS` gibt es in bash, die Shell ist aber zsh (dort `pipestatus`).
- **Lösung:** ohne Pipe ausführen und `$?` ausgeben
- **Prüfen:** `npm run check >/dev/null 2>&1; echo "EXIT: $?"`

### `open: invalid option -- .`

- **Wo:** `open -e.env.local`
- **Ursache:** Ohne Leerzeichen liest `open` alles als Optionen.
- **Lösung:** `open -e .env.local`
- **Prüfen:** TextEdit öffnet die Datei.

### Umgebung einer Variable bei Vercel lässt sich nicht ändern

- **Wo:** Settings → Environment Variables, `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` nur für Production
- **Ursache:** Die bestehende Variable ließ sich in der Oberfläche nicht auf eine Umgebung einschränken.
- **Lösung:** löschen, neu anlegen mit nur „Production“, dann Deployments → „Redeploy“
- **Prüfen:** Vorschau eines PRs zeigt „Spotify ist hier nicht eingerichtet, nur die Demo.“ (steht noch aus)

### `curl` mit Code 77 bzw. `000` (zum zweiten Mal)

- **Wo:** Abfrage von `https://musik-bingo.vercel.app`
- **Ursache:** wie in Phase 2: Die Shell nimmt das `curl` aus Anaconda, das seine Zertifikate nicht lesen kann.
- **Lösung:** `/usr/bin/curl`
- **Prüfen:** `/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" https://musik-bingo.vercel.app` gibt `200` aus.

## Aus dem Chat

-

## Offene Fragen

- Was tut das Web Playback SDK ohne Netz: Scheitern Pause und Fortsetzen, bleiben sie hängen, oder spielt der Song
  weiter? Nur am Laptop mit echtem Player prüfbar (WLAN aus).

## Nächste Schritte

1. Plan A fertig machen: Production und Vorschau im Browser prüfen, Tool-Notiz Vercel, Redirect-URI bei Spotify
   eintragen, Anmeldung, Vorbereiten und Musik unter der Vercel-Adresse.
2. Plan B (Raum und Beitritt) mit `plan-schreiben`, danach Supabase-Projekt anlegen.
