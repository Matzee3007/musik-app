---
titel: Lernjournal Phase 4 - Restpunkte und Dependabot
status: aktiv
phase: 4
erstellt: 2026-10-26
tags: [lernjournal, phase-4, github-actions, ci, dependabot, supabase, vitest, playwright, code-review, online-modus, webrtc, web-audio]
---

# Lernjournal Phase 4: Restpunkte und Dependabot

Fortsetzung von [[Lernjournal Phase 4 - Prototypen Tisch und Handy]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Neue Funktionen kamen heute nicht dazu. Die Session hat Restpunkte aus den Übergaben abgearbeitet und die App vor dem
nächsten Spieleabend robuster gemacht: CI, Abhängigkeiten, Supabase und die Startseite ohne Netz.

**Zweite Session am selben Tag:** Nach dem gelungenen Spieleabend vor Ort kam der Wunsch, auch online zu spielen. Daraus
wurde der **Online-Modus** mit Ton vom DJ, von der Idee über einen Durchstich bis zum Test an echten Geräten.

## Erledigt

- [x] **CI absichern** (PR #52, Nachtrag PR #61): `concurrency`, `permissions: contents: read`,
  `timeout-minutes: 10` in `.github/workflows/ci.yml`. Auf `main` hat jeder Commit eine eigene Gruppe, abgebrochen
  wird nur bei PRs. Die Tool-Notiz nannte noch 40 Sekunden pro Lauf, korrigiert auf 1,5 bis 2 Minuten.
- [x] **Dependabot** (PR #53): `.github/dependabot.yml` für npm und GitHub Actions, wöchentlich. Gruppen `next`,
  `react`, `npm-klein` (minor, patch) und `actions`, große Updates von `@types/node` ignoriert. Neue Notiz
  [[projects/musik-app/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]], Ablauf vor dem Merge mit
  `npm run e2e`.
- [x] **Sicherheitswarnungen und Sicherheits-Updates von Dependabot** im Repo eingeschaltet (über `gh api`).
- [x] **Supabase-Pause geklärt** (PR #54): Kostenlose Projekte pausieren nach 7 Tagen ohne Datenbank-Aktivität und
  lassen sich ein Jahr lang wieder starten. In der Notiz [[projects/musik-app/docs/tools/Supabase|Supabase]] steht
  jetzt ein Befehl, mit dem man vor dem Spieleabend prüft, ob das Projekt läuft.
- [x] **Startseite ohne Netz** (PR #55): Vorher blieb die Seite leer, wenn das Token ohne Netz nicht erneuert werden
  konnte. Jetzt erscheint der Hinweis „Spotify ist gerade nicht erreichbar …“, auch wenn die Playlists ohne Netz
  nicht laden. Testgetrieben, zwei neue Tests.
- [x] `/code-review` für #52, #53, #55 und #61, insgesamt 26 Funde mit dem Entwickler durchgegangen, die empfohlenen
  behoben.
- [x] Erste Dependabot-PRs: #56 (Next 16.4.3) und #62 (React 19.3.1, `supabase-js` 2.118.0, Playwright 1.64.1)
  lokal mit `npm run e2e` geprüft (13 von 13 grün) und gemergt. Die Playwright-Agents wurden für 1.64 neu erzeugt.
- [ ] Große Updates vertagt: #59 TypeScript 7.0 (CI rot) und #60 ESLint 10 (CI grün).

**Zweite Session: Online-Modus**

- [x] **Idee geschärft** in drei Fragerunden: lokaler Modus und Online-Modus, auf der Startseite gewählt, der DJ spielt
  online mit, jeder sieht Rad, Kategorie und Auflösung am eigenen PC, getippt wird in die Notizfläche, die Spieler
  prüfen weiter selbst. Discord spielt für die App keine Rolle.
- [x] **Durchstich** (Branch `spike/ton-streamen`, Seite `/durchstich`): Ton eines Spotify-Tabs über `getDisplayMedia`
  per WebRTC an einen zweiten Browser, Signaling über Supabase. Test 1 (ein Laptop) und Test 2 (WLAN zum Handy mit
  mobilen Daten) bestanden, Versatz etwa 1 Sekunde. Danach gelöscht.
- [x] **ADR 0008** „Online-Modus mit Ton vom DJ“ (PR #64), Glossar um „Lokaler Modus“ und „Online-Modus“ ergänzt.
  Deezer-Hörproben als Alternative kurz getestet: „Bohemian Rhapsody“ ohne Hörprobe (`preview: ''`).
- [x] **Teil 1: Online spielen ohne Ton** (PR #65, Plan [[2026-10-26-online-spielen]]): „Lokal spielen“ und „Online
  spielen“ auf der Startseite, Karte des DJs am Tisch, `Tisch` als Zuschauer beim Spieler, Lösung im Stand erst nach
  der Auflösung, Name des DJs gilt als vergeben, Browser-Test `e2e/online.spec.ts`. `/code-review high`: 10 Funde,
  4 behoben (Neuladen machte den Online-Raum lokal, Bingo des DJs ließ sich zurücknehmen, Name als Text prüfen,
  Kommentar).
- [x] **Teil 3: Ton vom DJ** (PR #66, Plan [[2026-10-26-ton-vom-dj]]): `lib/raum/ton.ts` mit `tonSenden` und
  `tonEmpfangen`, Knopf „Ton teilen“, Ton beim Spieler mit Lautstärkeregler über Web Audio. Gerätetests A, B, C mit
  dem Entwickler bestanden. `/code-review high`: 9 Funde, 6 behoben (DJ meldet nach Wiederbeitritt erneut „bereit“,
  Signal „ende“, Neuversuch bei Abbruch, tote Verbindungen aufräumen, kein doppeltes Teilen, Ton bleibt zwischen
  Spielen, Lautstärke auf dem iPhone).
- [x] Neue Tool-Notiz [[WebRTC]], Abkürzungen WebRTC, SDP, ICE, STUN, TURN, NAT, DRM im Ecosystem (dort PR #123).
- [ ] **Teil 2: Notizen in der Auflösung** (alle sehen die getippten Antworten) noch nicht geplant.

## Befehle: CI und GitHub

```bash
gh run list --limit 8 --json displayTitle,createdAt,updatedAt,conclusion
gh pr checks <nr> --watch
gh pr view <nr> --json mergeable --jq .mergeable
gh api -X PUT repos/Matzee3007/musik-app/vulnerability-alerts
gh api -X PUT repos/Matzee3007/musik-app/automated-security-fixes
```

- `gh run list … --json`: letzte CI-Läufe mit Start und Ende. So ließ sich die echte Laufzeit für den Timeout
  ablesen.
- `gh pr checks <nr> --watch`: wartet, bis die CI eines PRs fertig ist. Exit-Code 8 heißt nur „noch nicht fertig“.
- `gh pr view … mergeable`: vor jedem Merge. `UNKNOWN` heißt, GitHub rechnet noch, also warten bis `MERGEABLE`.
- `gh api -X PUT …`: schaltet die Dependabot-Warnungen und die automatischen Sicherheits-PRs ein. Prüfen mit
  `gh api -i …/vulnerability-alerts` (`204` = an).

## Befehle: Dependabot-PRs prüfen

```bash
gh pr checkout <nr>
npm ci
npx playwright install
npm run e2e
npx playwright init-agents --loop=claude
```

- `gh pr checkout <nr>`: holt den Branch eines PRs lokal, auch einen von Dependabot.
- `npm ci`: installiert genau die Versionen aus der Lock-Datei des PRs.
- `npx playwright install`: nur nötig, wenn `@playwright/test` neu ist, lädt die passenden Browser.
- `npm run e2e`: die Browser-Tests, die die CI nicht ausführt.
- `npx playwright init-agents --loop=claude`: erzeugt die Playwright-Agents nach einem Update neu. Die Änderung an
  `.mcp.json` war nur Formatierung und wurde verworfen.

## Befehle: Supabase prüfen

```bash
(set -a; source .env.local; /usr/bin/curl -s -o /dev/null -w '%{http_code}\n' "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/health" -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
```

- Fragt das eigene Supabase-Projekt, ob es läuft (`200` = ja), ohne URL und Schlüssel anzuzeigen. `set -a` macht die
  Werte aus `.env.local` für `curl` sichtbar, die Klammern halten sie aus der übrigen Shell heraus.

## Befehle: Online-Modus prüfen

```bash
git switch -c spike/ton-streamen
git push origin --delete spike/ton-streamen
gh api "repos/Matzee3007/musik-app/commits/$(git rev-parse HEAD)/statuses" --jq '…'
lsof -ti tcp:3000
kill $(lsof -ti tcp:3000)
```

- `git switch -c spike/…`: eigener Branch für Wegwerf-Code, der nie gemergt wird.
- `git push origin --delete …`: löscht den Durchstich auf GitHub, als er ausgedient hatte.
- `gh api …/statuses`: zeigt, ob Vercel die Vorschau eines Commits fertig gebaut hat, auch ohne PR.
- `lsof -ti tcp:3000` und `kill …`: Wer belegt Port 3000? Den alten Entwicklungsserver beenden, bevor `npm run e2e`
  einen eigenen startet. Der Exit-Code 143 danach heißt nur „beendet“.
- Vorschau eines Branches: `https://musik-bingo-git-<branch>-matzee3007-s-projects.vercel.app`. Sie hat kein Spotify,
  nutzt aber dasselbe Supabase: Der DJ spielt lokal, der Spieler tritt über die Vorschau demselben Raum bei.

## Neu gelernt

### `concurrency` in GitHub Actions

Läufe mit derselben Gruppe stören sich gegenseitig: Höchstens einer läuft und einer wartet. Ein neuer wartender Lauf
verdrängt den alten, auch mit `cancel-in-progress: false`. Darum hat auf `main` jeder Commit seine eigene Gruppe
(`github.sha`), bei PRs ist es eine Gruppe je PR-Nummer.

### `permissions: contents: read`

Begrenzt nur das Token der CI (`GITHUB_TOKEN`) auf Lesen. Ein manipuliertes npm-Paket kann damit nichts ins Repo
schreiben, aber trotzdem Code ausführen und Daten senden. Bevor Secrets in die CI kommen, muss man das neu bedenken.

### Dependabot: Versions-Updates und Sicherheits-Updates

Die Datei `dependabot.yml` steuert die Versions-Updates. Warnungen und Sicherheits-Updates sind eine Einstellung des
Repos. Gruppen fassen Pakete zu einem PR zusammen. Ein Paket landet in der ersten passenden Gruppe.

### Dependabot ersetzt veraltete PRs

Ändert sich `main`, schließt Dependabot veraltete PRs und öffnet einen neuen („Superseded by #62“). Eigene Commits auf
seinem Branch gehen dabei verloren. Einen angefassten Dependabot-PR deshalb zügig mergen.

### `reuseExistingServer` in Playwright

Läuft schon ein `next dev` auf Port 3000, nimmt Playwright diesen Server und testet dessen Stand. Nach einem
Paket-Update hätte das die alten Versionen geprüft. Vor `npm run e2e` deshalb nachsehen, ob der Port frei ist
(`lsof -iTCP:3000 -sTCP:LISTEN`).

### Kostenloses Supabase pausiert

Nach 7 Tagen ohne Datenbank-Aktivität pausiert das Projekt. Ob Realtime als Aktivität zählt, sagt die Doku nicht.
Weil die App noch keine Tabellen hat, vor dem Spieleabend prüfen und notfalls im Dashboard „Resume project“ drücken.

### Durchstich

Ein kleiner Wegwerf-Versuch, der nur eine Frage klärt, hier: Kommt der Spotify-Ton trotz Kopierschutz aus dem Tab
heraus und über das Internet an? Erst mit der Antwort lohnte sich ADR, Plan und Code.

### WebRTC, Signaling, STUN und TURN

WebRTC schickt Ton direkt von Browser zu Browser. Vorher tauschen beide Verbindungsdaten aus (Signaling), bei uns über
den Supabase-Kanal des Raums. STUN hilft beim Finden hinter dem Router und ist kostenlos, TURN leitet weiter, wenn
nichts anderes klappt, und kostet. Bisher reicht STUN. Mehr in [[WebRTC]].

### Nachrichten einer Verbindung zuordnen

Können mehrere Verbindungsversuche gleichzeitig unterwegs sein, braucht jede Nachricht eine Kennung (`versuch`), sonst
landet eine Antwort beim falschen Versuch.

### React Strict Mode

Im Entwicklungsmodus startet React jeden Effekt zweimal, damit Fehler beim Aufräumen auffallen. Er hat hier einen
echten Wettlauf sichtbar gemacht.

### Web Audio und `GainNode`

Web Audio ist ein Mischpult im Browser, ein `GainNode` sein Lautstärkeregler. Auf dem iPhone ist er der einzige Weg,
die Lautstärke aus der Seite heraus zu ändern, Safari ignoriert `audio.volume`.

### Zustand aus Props beim Rendern ableiten

Der Tisch merkt sich die zuletzt gesehene Rundennummer. Ändert sie sich, dreht das Rad, auch beim Zuschauer ohne Klick
und ohne Effekt, also ohne kurzes Aufblitzen der Kategorie.

### Ein Test, der eine Abkürzung nimmt, sieht den Fehler nicht

Der Test für das Neuladen hat den Online-Raum direkt gespeichert und `RaumKopf` übersprungen, der `dj` wegwarf. Erst
`/code-review high` fand es, `low` meldete nichts.

### Gegenprobe bei nachträglichen Tests

Ein Test, der nach dem Code entsteht, ist sofort grün. Erst wenn er bei absichtlich kaputtem Code rot wird, prüft er
wirklich etwas.

## Fehler und Lösungen

### Leere Startseite ohne Netz

- **Wo:** `app/ui/start.tsx`, beim Laden mit abgelaufenem Token und ohne Netz.
- **Ursache:** `gueltigesToken` wirft den Netzfehler absichtlich weiter, damit der DJ nicht abgemeldet wird.
  `start.tsx` fing ihn nicht ab, `token` blieb `undefined`, die Seite zeigte nichts.
- **Lösung:** `.catch` setzt `unerreichbar` und gibt den Fehler mit `console.error` aus. Dasselbe beim Laden der
  Playlists.
- **Prüfen:** `npx vitest run __tests__/ui/start.test.tsx` (Tests „ohne Netz …“ grün).

### CI-Lauf auf `main` „cancelled“ nach 7 Sekunden

- **Wo:** Merge von PR #53, kurz nach #52 und vor #55.
- **Ursache:** Alle drei Läufe hatten die Gruppe `ci-refs/heads/main`. Der Lauf zu #53 wartete und wurde vom Lauf
  zu #55 verdrängt, obwohl `cancel-in-progress` auf `main` aus war.
- **Lösung:** Gruppe `ci-${{ github.event.pull_request.number || github.sha }}`, PR #61.
- **Prüfen:** `gh run list --workflow CI --branch main --event push --limit 2`: beide Merges danach `success`.

### `The play() request was interrupted by a new load request.` und Verbindung `failed` (Durchstich)

- **Wo:** `/durchstich`, Empfänger-Tab.
- **Ursache:** Zwei Sender liefen, beide antworteten auf dasselbe „hallo“. Außerdem wurden Kandidaten eingetragen,
  bevor Angebot oder Antwort fertig waren, der Fehler blieb leise.
- **Lösung:** Kennung je Sender, nur das erste Angebot annehmen, Nachrichten der Reihe nach verarbeiten, Fehler ins
  Protokoll.
- **Prüfen:** Protokoll zeigt auf beiden Seiten `connected`.

### Neuer Spieler bekommt keinen Ton, erst nach „Teilen beenden“ und neu teilen

- **Wo:** Gerätetest A, Spieler tritt bei, während der DJ teilt.
- **Ursache:** React Strict Mode, der Spieler sagte zweimal „hallo“. Der DJ ersetzte die erste Verbindung, der Spieler
  antwortete auf das erste Angebot.
- **Lösung:** `versuch` in jedem Signal, beide Seiten nehmen nur Nachrichten zum aktuellen Versuch an.
- **Prüfen:** `npx vitest run __tests__/lib/raum/ton.test.ts` (Tests „… alten Versuch …“) und Gerätetest A.

### `Property 'kandidat' does not exist on type …`

- **Wo:** `npm run check`, `lib/raum/ton.ts`.
- **Ursache:** Die Variante `art: "angebot" | "antwort"` ließ sich mit `signal.art === "antwort"` nicht eingrenzen.
- **Lösung:** zwei getrennte Varianten über den Hilfstyp `Beschreibung<…>`.
- **Prüfen:** `npm run typecheck`.

### Online-Raum wird nach dem Neuladen lokal

- **Wo:** Fund aus `/code-review high` von PR #65, `app/ui/raum-kopf.tsx`.
- **Ursache:** Beim Speichern der Spielerleiste wurde `{ code, bekannt }` geschrieben und `dj` ging verloren.
- **Lösung:** `tischRaumSpeichern({ ...raum, bekannt })`.
- **Prüfen:** Test „neue Anwesende lassen den Online-Raum online“.

## Aus dem Chat

-

## Offene Fragen

- Greift die Gruppe `react` in `dependabot.yml`? In #62 kamen `react` und `react-dom` in `npm-klein`.
- Zählt Supabase Realtime als Aktivität gegen das Pausieren?
- Reicht STUN auch bei allen Freunden, oder braucht jemand hinter strengem NAT doch TURN?

## Nächste Schritte

1. Große Updates #59 (TypeScript 7) und #60 (ESLint 10) einzeln angehen.
2. `app/ui/vorbereiten-ansicht.tsx`: dieselbe Lücke ohne Netz wie bei der Startseite (Fund aus dem Review von #55).
3. Ecosystem-Notiz `GitHub Actions.md` um `concurrency`, `permissions` und `timeout` ergänzen.
4. Fix ohne Netz einmal im echten Browser mit ausgeschaltetem WLAN prüfen.
5. Online-Spieleabend mit Freunden als echter Test.
6. Teil 2 des Online-Modus planen: Notizen in der Auflösung.
7. Offene Review-Funde: aus PR #65 Nr. 3 (Name des DJs frei, solange er weg ist), 5 („Jahr unsicher“ fehlt bei den
   Spielern), 8 und 9 (Aufräumen). Aus PR #66 Nr. 4 (Kandidaten in falscher Reihenfolge), 8 (Angebote nacheinander),
   9 (gescheitertes Angebot macht stumm bis zum nächsten Versuch).
