---
titel: Lernjournal Phase 4 - Prototypen Tisch und Handy
status: aktiv
phase: 4
erstellt: 2026-10-23
tags: [lernjournal, phase-4, design, prototyp, artifact, tailwind, svg, vitest, playwright, code-review, plan-pruefer, adr]
---

# Lernjournal Phase 4: Prototypen Tisch und Handy

Fortsetzung von [[Lernjournal Phase 4 - Design Spielshow]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Die Oberfläche gefiel noch nicht ganz: Der Abschnitt mit der Lösung änderte seine Größe je nach Zustand, Lösung und
Cover waren zu klein. Diesmal zuerst klickbare Prototypen als Claude Artifact, dann ein Plan in drei Teilen:
[[2026-10-23-tisch-und-handy-nach-prototyp|Plan Tisch und Handy nach den Prototypen]].

## Erledigt

- [x] Prototyp Tisch (7 Versionen): fester Abschnitt so hoch wie das Rad, größere Lösung und Cover, kräftigere
      Kategoriefarben, Raum als Schublade mit einem Knopf, Musikspur als Zickzack-Welle nach einem Bild des Entwicklers
- [x] Prototyp Handy (2 Versionen): Felder im Hochformat, Kreuz statt Kreis beim Abhaken
- [x] Prototyp Playlists (2 Versionen): Songliste vor dem Spiel fällt weg, nur noch die Zahl der unsicheren Jahre
- [x] Entscheidungen: Raum-Zustand bleibt über ein Neuladen (1B), kein automatisches Ausblenden (2A)
- [x] Plan mit `plan-schreiben`, drei PRs nacheinander
- [x] Teil 1 umgesetzt (PR #43), fünf Aufgaben testgetrieben: Farben, `wellenPunkte`, Musikspur als Welle, festes
      Gerüst im Abschnitt „Runde“, Raum als Schublade mit `raumSichtbar` im `localStorage`
- [x] Screenshots 1280×800, 1600×900, 390×844 mit einer vorübergehenden Playwright-Datei, dabei ein zu großes Cover
      gefunden und behoben
- [x] `/code-review`: 10 Funde, 5 behoben (neuer Raum startet sichtbar, Fehler bei ausgeblendetem Raum sichtbar,
      `aria-controls`, Welle rechnet nach dem Absinken nicht weiter, kein negativer erster Zeitschritt), 5 begründet
      nicht geändert
- [x] Prüfungen: 295 Vitest-Tests, `npx playwright test --repeat-each=3` 33 bestanden, CI grün, PR #43 gemergt
- [x] Teil 2: Handy-Karte mit höheren Feldern und Kreuz (PR #45)
- [x] Teil 3: ohne Songliste, ADR 0007 (PR #46)
- [ ] Wellenlinie mit echter Musik ansehen (die Demo hat keine)
- [x] Teil 2 testgetrieben: Felder 3 : 4, ohne Notizen 2 : 3, SVG-Kreuz mit `data-kreuz` statt Kreis, Schrift 13 px am
      Handy. Neuer Browser-Test „Handy … mit und ohne Notizen passt ohne Scrollen“ für 390×844 und 360×780
- [x] Screenshots im Bingo-Zustand zeigten 25 px Überhang. Abgesprochen: Notizfläche bis 800 px Höhe nur 2 Zeilen,
      Raumseite am Handy `py-4` statt `py-8`. Danach von Hand gemessen 844/844 und 780/780 px
- [x] `/code-review` PR #45: 8 Funde, 4 behoben (Prop `felder?: "hoch" | "hoeher"`, damit die Laptop-Karte im
      Solo-Modus quadratisch bleibt; Test für „Notizen aus“; ein `<path>` statt vier `<line>`; `overflow-hidden`,
      damit der Stempel nicht in Nachbarfelder ragt), 1 falsch („Erscheinungsjahr“ gibt es als Kategorie nicht),
      3 begründet nicht geändert
- [x] Teil 3: `unsichereJahre` in `lib/vorbereiten.ts`, `app/ui/songliste.tsx` und ihr Test gelöscht, ihre Fälle
      „Spiel starten“ und „Keine spielbaren Songs“ in den Test der Vorbereiten-Ansicht übernommen. ADR 0007,
      Prinzip 4 in der `CLAUDE.md`, Projektvision angepasst
- [x] `/code-review` PR #46 und `plan-pruefer` parallel. Wichtigster Fund: Die Auflösung zeigte nicht, welcher Song ein
      unsicheres Jahr hat. Jetzt „Jahr unsicher“ über `Song.jahrUnsicher`, eine Korrektur entfernt es. Dazu „Prüfe
      sie“ in der Mehrzahl, einmal zählen statt bei jedem Neuzeichnen, drei veraltete Kommentare, Wellenlinie in der
      Projektvision
- [x] Abweichungen aus Teil 1 im Plan vermerkt („Jahr korrigieren“ bei Bingo, Cover im schmalen Layout, Bingo am Tisch
      von Hand gemessen: Runde 576×592 wie zu Beginn, Seite 800 px, Rad 580 px)
- [x] Plan auf `status: abgeschlossen`, 299 Vitest-Tests, 13 Browser-Tests, CI grün, PR #45 und #46 gemergt

## Befehle: Prototypen und Prüfung

```bash
npx playwright test e2e/zz-bilder.spec.ts --project=chromium
npx playwright test --repeat-each=3
gh pr checks 43 --watch --interval 15
gh pr view 43 --json mergeable -q .mergeable
gh pr merge 43 --merge --delete-branch
```

- `npx playwright test e2e/zz-bilder.spec.ts --project=chromium`: eine vorübergehende Testdatei, die mit den Bots aus
  `e2e/hilfen/raum.ts` die Zustände des Tischs fotografiert. Nur in Chromium, danach wieder gelöscht.
- `npx playwright test --repeat-each=3`: jeden Browser-Test dreimal, um unzuverlässige Tests zu erkennen.
- `gh pr checks 43 --watch --interval 15`: wartet, bis alle Prüfungen des PRs fertig sind, und fragt alle 15 Sekunden
  nach.
- `gh pr view 43 --json mergeable -q .mergeable`: meldet `MERGEABLE`, wenn sich der PR ohne Konflikte mergen lässt.
- `gh pr merge 43 --merge --delete-branch`: PR in `main` zusammenführen und den Branch auf GitHub löschen.

## Befehle: Handy-Karte und Songliste

```bash
git switch -c feat/handy-karte-hoch
npx playwright test e2e/design.spec.ts -g "mit Notizen"
npx vitest run __tests__/ui/karte-ansicht.test.tsx
git rm app/ui/songliste.tsx __tests__/ui/songliste.test.tsx
gh pr checks 45 --watch
```

- `git switch -c feat/handy-karte-hoch`: neuen Branch anlegen und auf ihn wechseln.
- `npx playwright test e2e/design.spec.ts -g "mit Notizen"`: nur die Browser-Tests, deren Name „mit Notizen“ enthält.
- `npx vitest run <datei>`: nur eine Testdatei einmal ausführen, schneller als `npm test`.
- `git rm <dateien>`: Dateien löschen und das Löschen gleich für den Commit vormerken.
- `gh pr checks 45 --watch`: wartet, bis die CI des PRs fertig ist.

## Neu gelernt

### Prototyp vor dem Code

Ein klickbarer Prototyp als Claude Artifact (private Webseite auf claude.ai) zeigt alle Zustände nebeneinander und
lässt sich in Minuten ändern. So waren Größe, Farben, Welle und Schublade geklärt, bevor eine Zeile App-Code entstand.
Der Prototyp nimmt die echten Tokens und Texte der App, damit der Plan genaue Werte übernehmen kann.

### Festes Gerüst statt wachsender Inhalt

Der Abschnitt wuchs, weil in jedem Zustand andere Elemente darin standen. Jetzt gibt es vier Plätze, die immer da
sind (Kopf, großer Platz, Mitte, Fuß), nur ihr Inhalt wechselt, vor der Auflösung mit Platzhaltern „· · ·“. Ein
Browser-Test misst, dass die Größe in jedem Zustand gleich bleibt.

### Container-Queries und `cqw`

`@container` am Tisch und `@5xl:` in Tailwind entscheiden nach der Breite des Tischs, nicht des Fensters, ob Rad und
Abschnitt nebeneinander stehen. `cqw` ist ein Hundertstel dieser Breite. Ein Wert `--rad` aus Fensterhöhe und
Tischbreite bestimmt Rad und Abschnitt zugleich.

### Animation mit `requestAnimationFrame` und Ref

Für 60 Bilder pro Sekunde setzt die Musikspur die Punkte der SVG-Linie direkt über eine Ref, ohne React-State. Sonst
würde React jedes Bild neu zeichnen. `vector-effect: non-scaling-stroke` hält den Strich gleich dick, auch wenn das SVG
mit `preserveAspectRatio="none"` verzerrt wird.

### `requestAnimationFrame` im Test nachbauen

Mit `vi.stubGlobal("requestAnimationFrame", …)` speichert der Test die angeforderten Bilder in einer Map und spielt sie
selbst ab. So lässt sich prüfen, ob die Schleife nach dem Absinken wirklich aufhört.

### Ein Test, der sofort grün ist, kann trotzdem sinnvoll sein

Der Test „Handy mit Notizen passt ohne Scrollen“ war schon vor dem Umbau grün, weil die quadratischen Felder kleiner
waren. Er ist kein Rot-Grün-Test, sondern ein Schutz: Er soll zeigen, dass es nach dem Umbau so bleibt. Den echten
Überhang zeigte erst der Screenshot im Bingo-Zustand, mit der großen Überschrift „Bingo!“.

### Media-Query nach Höhe in Tailwind

Tailwind hat Breakpoints nur für die Breite. Mit einer beliebigen Variante geht auch die Höhe:
`[@media(max-height:800px)]:h-[calc(2lh+1rem)]`. `lh` ist die Zeilenhöhe als Einheit, so sind es genau zwei Zeilen
plus Polster. `rows` am `textarea` lässt sich nicht je Bildschirm ändern, die Höhe per Klasse schon.

### `vector-effect` wird nicht vererbt

`vector-effect: non-scaling-stroke` muss an jeder Linie oder jedem Pfad stehen, an der Gruppe `<g>` wirkt es nicht.
Ein `<path d="M12 12L88 88M88 12L12 88">` zeichnet beide Linien des Kreuzes auf einmal.

### `as const` für Listen aus Paaren

`[["stroke-akzent", 9], …] as const` lässt TypeScript jedes Paar als festes Tupel sehen. Dann hat `farbe` den Typ
`string` und `breite` den Typ `number`, ohne Cast wie `as string`.

### Review-Funde selbst prüfen

Nicht jeder Fund stimmt: Einer nannte eine Kategorie „Erscheinungsjahr“, die es nicht gibt, ein anderer übersah, dass
Tests `jahreVon` noch benutzen. Andere waren wichtiger als gedacht: Der Hinweis „Prüfe es bei der Auflösung“ half
nichts, solange die Auflösung den unsicheren Song nicht kennzeichnet. Darum jeden Fund am Code nachsehen, bevor er
umgesetzt oder verworfen wird.

### Optionales Feld nur setzen, wenn es zutrifft

`...(unsicher ? { jahrUnsicher: true } : {})` fügt das Feld nur bei Bedarf hinzu, wie schon beim `cover`. So bleiben
bestehende `toEqual`-Vergleiche gültig, die Songs ohne das Feld erwarten.

## Fehler und Lösungen

### Cover ragt über den Fuß (nur im Screenshot sichtbar)

- **Wo:** Screenshot der Auflösung auf 1280×800, alle Tests waren grün
- **Ursache:** Das Cover wuchs mit der Fensterhöhe (`36vh`), der Abschnitt aber mit dem Rad, das auf 1280 Pixel durch
  die Breite begrenzt ist
- **Lösung:** Cover höchstens so groß, wie der Abschnitt übrig hat:
  `min(22rem, calc(max(var(--rad), 34rem) - 24.5rem))`
- **Prüfen:** Screenshot neu aufnehmen, `npm run e2e`

### `(eval):1: command not found: timeout`

- **Wo:** `timeout 600 npm run e2e`
- **Ursache:** macOS hat den Befehl `timeout` nicht (gehört zu GNU coreutils)
- **Lösung:** ohne `timeout` aufrufen, die Wartezeit begrenzt das Werkzeug selbst
- **Prüfen:** `npm run e2e` läuft durch

### `(eval):1: no matches found: --include=*.ts`

- **Wo:** `grep -rn … --include=*.ts`
- **Ursache:** zsh versucht `*.ts` als Dateimuster aufzulösen, bevor grep es sieht
- **Lösung:** Muster in Anführungszeichen setzen (`--include='*.ts'`) oder ohne `--include` suchen
- **Prüfen:** grep liefert Treffer statt der Meldung

### Einzelner Fehlschlag in `e2e/raum.spec.ts`

- **Wo:** erster kompletter `npm run e2e` nach den Review-Korrekturen, 10 von 11 bestanden
- **Ursache:** unbekannt, die Fehlermeldung war beim nächsten Lauf überschrieben. Einzeln und mit `--repeat-each=3`
  grün, vermutlich Last durch parallele Tests gegen Supabase
- **Lösung:** noch keine, im PR #43 vermerkt
- **Prüfen:** beim nächsten Fehlschlag sofort `test-results/` lesen, dann mit `fehler-diagnose` eingrenzen

### `fatal: pathspec 'app/ui/songliste.tsx' did not match any files`

- **Wo:** `git add -A … app/ui/songliste.tsx …` vor dem Commit von Teil 3
- **Ursache:** `git rm` hatte die Datei schon gelöscht und das Löschen vorgemerkt, `git add` fand sie nicht mehr
- **Lösung:** die gelöschte Datei im `git add` weglassen
- **Prüfen:** `git status --short` zeigt `D  app/ui/songliste.tsx`

### Exit-Code nach einer Pipe fehlt (`check exit:` leer)

- **Wo:** `npm run check | grep … ; echo ${PIPESTATUS[0]}`
- **Ursache:** zsh schreibt die Variable klein (`pipestatus`), `PIPESTATUS` ist dort leer
- **Lösung:** den Befehl ohne Pipe ausführen: `npm run check >/dev/null 2>&1; echo $?`
- **Prüfen:** Ausgabe `exit 0`

### Wegwerf-Test findet „Demo starten“ nicht

- **Wo:** Messung der Laptop-Karte im Solo-Modus
- **Ursache:** Mit Supabase in `.env.local` zeigt die Startseite zuerst nur „Raum eröffnen“, die Demo ohne Raum gibt es
  nur ohne Supabase
- **Lösung:** keine Messung, der Fund (hochkantige Felder auch im Solo-Modus) wurde mit dem Prop `felder` behoben
- **Prüfen:** `__tests__/ui/karte-ansicht.test.tsx`, „ohne Angabe sind die Felder quadratisch“

## Aus dem Chat

-

## Offene Fragen

- Wie sieht die Wellenlinie mit echter Musik aus, ist sie zu schnell oder zu unruhig?
- Ist der Fehlschlag in `e2e/raum.spec.ts` ein unzuverlässiger Test oder ein echter Fehler?
- Soll eine Kategorie später selbst sagen, welche Angabe sie markiert (Review-Fund 9, Prinzip „Kategorien sind Daten“)?
- Stört die offene Schublade auf einem 13-Zoll-Laptop über dem Rad?
- Wie sehen Kreuz und hochkantige Felder auf echten Handys aus (iOS, Android), auch mit eingeblendeter Adressleiste?
- Wie wirkt „Jahr unsicher“ mit einer echten Playlist, sind es viele Songs?
- Sollte sich die Kartengröße aus der Bildschirmhöhe ergeben statt aus festen Grenzen (Review-Fund PR #45)?

## Nächste Schritte

1. Prüfung an echten Geräten: Kreuz und Karte am Handy, Welle mit echter Musik, Schublade auf 13-Zoll-Laptops
2. Mit einer echten Playlist „<n> Songs mit unsicherem Jahr“ und „Jahr unsicher“ in der Auflösung ansehen
3. Nächster Schritt in Phase 4 laut Projektvision, vorher Restpunkte der Übergabe prüfen
