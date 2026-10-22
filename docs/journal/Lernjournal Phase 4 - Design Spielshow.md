---
titel: Lernjournal Phase 4 - Design Spielshow
status: aktiv
phase: 4
erstellt: 2026-10-22
tags: [lernjournal, phase-4, design, frontend-design, tailwind, next-font, playwright, code-review, plan-pruefer]
---

# Lernjournal Phase 4: Design Spielshow

Fortsetzung von [[Lernjournal Phase 3 - Raum und Beitritt]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Vor dem Start von Phase 4 stand zuerst die Oberfläche an: Bisher gab es nur das Nötigste, damit die App funktioniert.
Gewünscht war ein einheitliches, ansprechendes Aussehen für Start, Tisch und Handy. Plan:
[[2026-10-22-design-spielshow|Design Spielshow im Studio]].

## Erledigt

- [x] UI/UX-Werkzeug gesucht und Plugin `frontend-design` (Anthropic) installiert, im Skill-Katalog des Ecosystems
      eingetragen (claude-ecosystem PR #83)
- [x] Designplan mit dem Skill: Studio einer Spielshow, Nachtblau mit Glühbirnen-Gelb, Schriften Bungee und Barlow,
      Birnenkranz ums Rad, nur dunkles Thema, Titel „Musik-Bingo“
- [x] Plan mit `plan-schreiben`, vier Teile als gestapelte PRs
- [x] Teil 1: Farben als Tailwind-Tokens, Schriften, gemeinsamer `Knopf`, Titel (PR #35)
- [x] Teil 2: Startseite mit Code-Eingabe wie eine Anzeigetafel, Namensabfrage am Handy (PR #36)
- [x] Teil 3: Tisch mit Kulisse links und Bühne rechts, Rad im Birnenkranz mit Lauflicht (PR #37)
- [x] Teil 4: Handy-Karte mit Stempel und Silbentrennung (PR #38)
- [x] Review mit `plan-pruefer` und `/code-review`, Funde behoben (Stempel als Ring, größeres Rad, `color-scheme`,
      Fokus an Textknöpfen, Test-Aufräumen)
- [x] Zeile in der Projekt-`CLAUDE.md`: Dev-Server nach Änderungen an `app/globals.css` neu starten
- [x] Alle PRs gemergt, Prüfungen: 278 Vitest-Tests, 11 Browser-Tests, CI grün
- [ ] Prüfung an echten Geräten (Laptop und Handys), Production nicht von hier aus prüfbar

## Befehle: Plugin

```bash
claude plugin install frontend-design@claude-plugins-official
claude plugin list
/reload-plugins
```

- `claude plugin install`: holt das Plugin aus dem offiziellen Marktplatz und schaltet es für den Benutzer ein
  (Scope `user`, alle Projekte). Es landet in `~/.claude/settings.json`, im Ecosystem ein Link auf
  `config/settings.json`.
- `claude plugin list`: zeigt, ob es `enabled` ist.
- `/reload-plugins`: lädt das Plugin in die laufende Session, ohne Neustart.

## Befehle: Gestapelte PRs

```bash
gh pr create --base feat/design-grundlage --title "…"
gh pr edit 37 --base main
gh pr merge 36 --merge --delete-branch
gh pr checks 36 --watch --interval 10
gh pr reopen 36
git push origin "${sha}:refs/heads/feat/design-grundlage"
```

- `gh pr create --base <branch>`: Der PR zielt auf den Branch des vorherigen Teils und zeigt so nur seine eigenen
  Änderungen.
- `gh pr edit <nr> --base main`: stellt das Ziel eines PRs um. Bei gestapelten PRs **vor** dem Merge des Vorgängers.
- `gh pr merge --merge --delete-branch`: Merge-Commit nach `main`, löscht den Branch auf GitHub **und lokal**.
- `gh pr checks --watch`: wartet, bis die CI fertig ist.
- `gh pr reopen`: öffnet einen geschlossenen PR wieder. Geht nur, wenn sein Ziel-Branch existiert.
- `git push origin "<commit>:refs/heads/<branch>"`: legt einen Branch auf GitHub aus einem bestimmten Commit an,
  hier um einen gelöschten Branch wiederherzustellen.

## Befehle: Screenshots und Messen

```bash
npx playwright test e2e/zz-screens.spec.ts --project=chromium --reporter=line
curl -s "http://127.0.0.1:3000$c" | grep -c "birne-lauf"
```

- Ein Wegwerf-Test im Ordner `e2e/` macht Screenshots (Laptop 1280×800, iPhone 15, 360 px) und misst mit
  `page.evaluate` Werte im Browser (Höhe, Breite, berechnete CSS-Werte). Er liegt im Scratchpad und kommt nur zum
  Laufen kurz ins Repo, committet wird er nie.
- `curl … | grep`: lädt das CSS, das der Dev-Server wirklich ausliefert, und sucht darin eine Regel.

## Neu gelernt

### Designplan vor dem Code

Der Skill `frontend-design` verlangt erst einen kurzen Plan: 4–6 benannte Farben, Schriften mit Rollen, Aufbau als
Textskizze, Grundsätze. Danach den Plan gegen typische KI-Looks prüfen (z. B. Schwarz mit Neon, Karten mit Schatten,
Großbuchstaben-Etiketten). Die erste Idee „Schwarz mit Neon-Pink“ fiel dabei heraus. „Mutig nur an einer Stelle“: hier
der Birnenkranz, alles andere bleibt ruhig.

### Tailwind v4: Tokens mit `@theme`

Farben und Schriften stehen in `app/globals.css` unter `@theme` (z. B. `--color-birne`). Daraus entstehen Klassen wie
`bg-birne`, `text-birne`, `outline-birne`. Wer eine Farbe ändert, ändert sie an einer Stelle. `next/font/google` lädt
die Schriften und setzt sie als CSS-Variable. Barlow ist kein variabler Font, deshalb braucht es die Gewichte einzeln.

### Container-Query `@container`

`@container` an einem Element und `@2xl:flex-row` darin richtet das Layout nach der Breite des **Elements**, nicht
des Fensters. So steht der Tisch auf der breiten Bühne nebeneinander und in der schmalen Demo untereinander, ohne dass
die Komponente weiß, wo sie steckt.

### Spezifität in CSS

Kommen zwei Regeln in Konflikt, gewinnt die genauere, erst bei gleicher Genauigkeit die spätere.
`.birnenkranz[data-modus="lauf"] .birne` (Klasse, Attribut, Klasse) schlägt `.birnenkranz .birne`, auch in einem
`@media`-Block weiter unten.

### Messen statt raten

Zwei Tests waren sofort grün, obwohl ein Fehler erwartet war. Erst das Nachmessen zeigte, warum: Bei 393 px passt
„Jahrzehnt“ wirklich, und `scrollWidth` übersieht zentrierten Text, der nach beiden Seiten hinausragt. Der Test misst
jetzt die Breite des Worts mit einem `Range` gegen die Innenbreite des Felds. Ebenso ließ sich Fund 1 aus dem Review
(Rad scrollt am Handy seitlich) bei 360 px nicht nachstellen, der Test wacht trotzdem darüber.

### `color-scheme: dark`

Nur dunkle Farben im CSS reichen nicht: Auswahllisten, Zahlenfelder und Scrollbalken zeichnet der Browser selbst. Mit
`color-scheme: dark` auf `:root` zeichnet er sie dunkel.

### Gestapelte PRs

Jeder Teil baut auf dem vorigen auf, jeder PR zielt auf den Branch des Vorgängers. Vorteil: kleine Reviews je Teil,
Production sieht erst nach dem Merge etwas (Entscheidung: erst nach Teil 3 mergen, dann alle nach Teil 4).

## Fehler und Lösungen

### Dev-Server liefert altes CSS aus

- **Wo:** Screenshots nach Aufgabe 1 (Seite noch weiß) und nach dem Birnenkranz (Birnen mit `animation: none`).
- **Ursache:** Ein laufender `npm run dev` übernimmt Änderungen an `app/globals.css` nicht. Neue Tailwind-Klassen in
  `.tsx`-Dateien kommen sofort an, eigene Regeln in `globals.css` erst nach einem Neustart. Warum, ist nicht geklärt.
- **Lösung:** Server neu starten. Zweimal aufgetreten, deshalb Zeile in der Projekt-`CLAUDE.md`.
- **Prüfen:** `curl` auf die CSS-Datei des Dev-Servers und nach der neuen Regel suchen.

### Lauflicht läuft trotz „Bewegung reduzieren“

- **Wo:** Teil 3, Prüf-Schwerpunkt 3 des Plans.
- **Ursache:** Spezifität, die Ausnahme `.birnenkranz .birne` war ungenauer als die Regel fürs Lauflicht.
- **Lösung:** Ausnahme als `.birnenkranz[data-modus] .birne`, steht danach und gewinnt.
- **Prüfen:** e2e „bei „Bewegung reduzieren“ läuft kein Lauflicht“ in `e2e/design.spec.ts`.

### Test findet „Partyhits (98 Songs)“ nicht

- **Wo:** Teil 2, Playlist als Fläche mit Name und Anzahl in zwei `span`.
- **Ursache:** `findByText` sucht den Text als ein Stück, zwei Textknoten zählen nicht.
- **Lösung:** Text zusammen lassen, Vorgabe „Texte bleiben gleich“.
- **Prüfen:** `npm run check`.

### `GraphQL: Cannot change the base branch of a closed pull request.`

- **Wo:** Merge von PR #35 mit `--delete-branch`.
- **Ursache:** #36 zielte auf den Branch von #35. GitHub schloss #36, als der Branch gelöscht wurde, statt ihn auf
  `main` umzustellen. `--delete-branch` löscht auch den lokalen Branch.
- **Lösung:** Branch aus dem letzten Commit von #35 wiederhergestellt (`gh pr view 35 --json headRefOid`), #36
  wieder geöffnet und auf `main` gestellt. Danach #37 und #38 **vor** dem nächsten Merge auf `main` gestellt.
- **Prüfen:** `gh pr view <nr> --json state,mergeable,baseRefName`.

### `error: src refspec 040dd93…efs/heads/feat/design-grundlage does not match any`

- **Wo:** Branch wiederherstellen mit `git push origin $sha:refs/heads/…`.
- **Ursache:** In zsh ist `:r` ein Modifikator für Variablen (Endung abschneiden), `$sha:refs` wurde verstümmelt.
- **Lösung:** `"${sha}:refs/heads/…"`.
- **Prüfen:** `git ls-remote --heads origin`.

### #37 gemergt bei `UNKNOWN`

- **Wo:** Merge direkt nach #36.
- **Ursache:** GitHub rechnet `mergeable` nach jedem Merge neu aus und meldet kurz `UNKNOWN`. Gemergt, ohne zu warten.
- **Lösung:** Ging glatt, war aber gegen die Regel „erst bei `MERGEABLE`“. Bei #38 gewartet.
- **Prüfen:** `gh pr view <nr> --json mergeable` vor jedem Merge, bei `UNKNOWN` kurz warten.

## Aus dem Chat

-

## Offene Fragen

- Warum übernimmt der Dev-Server Änderungen an `app/globals.css` nicht (Turbopack, Next.js 16.4)?
- Wie sieht die Silbentrennung „Jahr-zehnt“ auf echten Handys aus (Safari auf iOS, Chrome auf Android)?
- Wie wirkt die Playlist-Liste nach der Spotify-Anmeldung (ohne Anmeldung nicht fotografiert)?
- `config/settings.json` im Ecosystem hat viele Änderungen, die nicht aus dieser Session stammen. Woher?

## Nächste Schritte

1. Spieleabend zur Probe mit Laptop und Handys auf Production, Design an echten Geräten prüfen.
2. Phase 4 mit `grill-with-docs` schärfen: Scoreboard, Jahre in Supabase, Tisch am Handy, Kategorie auf dem Handy.
