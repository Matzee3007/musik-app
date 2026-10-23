---
titel: Lernjournal Phase 4 - Prototypen Tisch und Handy
status: aktiv
phase: 4
erstellt: 2026-10-23
tags: [lernjournal, phase-4, design, prototyp, artifact, tailwind, svg, vitest, playwright, code-review]
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
- [ ] Teil 2: Handy-Karte mit höheren Feldern und Kreuz
- [ ] Teil 3: ohne Songliste, ADR 0007
- [ ] Wellenlinie mit echter Musik ansehen (die Demo hat keine)

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

## Aus dem Chat

-

## Offene Fragen

- Wie sieht die Wellenlinie mit echter Musik aus, ist sie zu schnell oder zu unruhig?
- Ist der Fehlschlag in `e2e/raum.spec.ts` ein unzuverlässiger Test oder ein echter Fehler?
- Soll eine Kategorie später selbst sagen, welche Angabe sie markiert (Review-Fund 9, Prinzip „Kategorien sind Daten“)?
- Stört die offene Schublade auf einem 13-Zoll-Laptop über dem Rad?

## Nächste Schritte

1. Teil 2 des Plans: Handy-Karte mit höheren Feldern und Kreuz (`feat/handy-karte-hoch`)
2. Teil 3: Songliste entfernen, ADR 0007, Prinzip 4 in der `CLAUDE.md` anpassen (`feat/ohne-songliste`)
3. Danach `plan-pruefer` und Prüfung an echten Geräten
