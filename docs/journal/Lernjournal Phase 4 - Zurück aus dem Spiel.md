---
titel: Lernjournal Phase 4 - Zurück aus dem Spiel
status: aktiv
phase: 4
erstellt: 2026-11-19
tags: [lernjournal, phase-4, react, tailwind, vitest, playwright, code-review, vercel]
---

# Lernjournal Phase 4: Zurück aus dem Spiel

Fortsetzung von [[Lernjournal Phase 4 - Spotify-Regeln und Ton nur an Sichtbare]]. Gehört zu
[[projects/musik-app/docs/Projektvision|Projektvision]]. Die Session lief am 2026-11-18.

## Erledigt

- [x] Fehler eingegrenzt: Im lokalen Raum am Tisch kam der DJ nach einem Spiel nicht zur Playlist-Auswahl zurück, nur
  durch Neuladen. `VorbereitenAnsicht` zeigte nach „Spiel starten“ nur noch die `SpielAnsicht`, ohne Weg zurück.
  Die Demo ließ sich ebenso nicht verlassen.
- [x] PR #95: Knopf „Andere Playlist“ im Spiel und „Demo beenden“ in der Demo, beide mit Rückfrage „Spiel beenden?“.
  Je ein Test vorher rot, danach grün (`__tests__/ui/vorbereiten-ansicht.test.tsx`, `__tests__/ui/start.test.tsx`).
  `npm run check` grün (392 Tests), `/code-review low 95` ohne Funde, CI grün, gemergt, Production `success`.
- [x] Zweite Ursache gefunden: Der Entwickler sah weiter keinen Knopf. Sein Screenshot zeigte, dass der Link „Zurück“
  beim Vorbereiten unter der Schublade des Raums lag (`absolute top-0 left-0 z-10`, `app/ui/raum-kopf.tsx`), nur ein
  Strich der Unterstreichung ragte heraus. Die neuen Knöpfe standen unten unter dem Spiel und rutschten aus dem Bild.
- [x] PR #96: „Zurück“, „Andere Playlist“ und „Demo beenden“ stehen oben rechts (`self-end`), gleich gestaltet über
  `ZURUECK_LINK` in `app/ui/vorbereiten-ansicht.tsx`. `npm run check` grün, Screenshot lokal im Raum mit Demo
  (1440×900) zeigt den Link frei von der Schublade. `/code-review low 96` ohne Funde, CI grün, gemergt,
  Production `success`. Der Entwickler hat den Knopf danach in der Production gesehen: „passt“.
- [ ] „Andere Playlist“ nach einem echten Spiel mit Spotify: nur über die gleiche Klasse wie die Demo abgesichert,
  nicht eigens im Browser angesehen.

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Design | Aus dem Spiel führt ein Knopf zurück zur Playlist-Auswahl, mit Rückfrage „Spiel beenden?“ | Ein Fehlklick soll das Spiel nicht löschen | Entwickler |
| Design | Die Demo bekommt denselben Ausweg | Gleicher Fehler, eine Zeile | Entwickler |
| Design | Der Ausweg aus der Demo heißt „Demo beenden“, nicht „Andere Playlist“ | In der Demo gibt es keine Playlist, zu der man zurückkehrt | Entwickler |
| Design | Links zum Verlassen stehen oben rechts statt oben links | Oben links verdeckt im Raum ab `lg` die Schublade alles | Entwickler |
| Design | Auch „Demo beenden“ steht oben rechts | Alle drei Auswege an derselben Stelle | Entwickler |
| Prüfen | Beide PRs mit `/code-review low` | Kleine Änderung an der Oberfläche, keine Daten, Rechte oder Schlüssel | Entwickler |
| Betrieb | PR #96 nach grüner CI und Review ohne Funde gemergt, ohne eigene Rückfrage | Der Entwickler konnte den Knopf mit Spotify nur in der Production prüfen | Entwickler |

## Befehle: Fehler im Browser nachstellen

```bash
node ./.demo-tmp.mjs <scratchpad>
```

- Ein kurzes Playwright-Skript (aus dem Scratchpad ins Projekt kopiert, damit es `playwright` aus `node_modules`
  findet, danach gelöscht): öffnet die App, eröffnet einen Raum am Tisch, startet die Demo, listet alle Knöpfe und
  macht Screenshots. Damit ließ sich zeigen, wo ein Knopf steht, ohne Spotify-Anmeldung.

## Befehle: PR und Production

```bash
gh pr checks 95 --watch
gh pr merge 95 --merge --delete-branch
gh api repos/Matzee3007/musik-app/commits/<sha>/status --jq '.statuses[] | "\(.context): \(.state)"'
```

- `gh pr checks <nr> --watch`: wartet, bis die CI des PRs fertig ist, und zeigt das Ergebnis.
- `gh pr merge <nr> --merge --delete-branch`: übernimmt den PR in `main` und löscht den Branch auf GitHub.
- `gh api …/commits/<sha>/status`: zeigt, ob Vercel die Production für diesen Commit fertig gebaut hat
  (`success`), in einer Schleife mit `until`, bis der Status nicht mehr `pending` ist.

## Neu gelernt

### `absolute` und `z-index` verdecken still

Ein Element mit `absolute` nimmt im Layout keinen Platz ein und schwebt über dem Inhalt, `z-10`/`z-20` legen es nach
oben. Was darunter liegt, ist unsichtbar, aber weiter im Code und im Test vorhanden. Deshalb fiel der verdeckte Link
„Zurück“ keinem Test auf.

### Tests in jsdom sehen kein Layout

jsdom ist ein nachgebauter Browser ohne Darstellung. `getByRole("button", …)` findet einen Knopf, auch wenn er
verdeckt oder außerhalb des Bildschirms liegt. Ob etwas sichtbar ist, zeigt nur ein Screenshot im echten Browser.

### `window.confirm` im Test

Mit `vi.spyOn(window, "confirm").mockReturnValue(false)` antwortet die Rückfrage im Test mit „Abbrechen“, mit
`true` mit „OK“. So prüft ein Test beide Wege: Abbrechen bleibt im Spiel, OK führt zurück.

## Fehler und Lösungen

### `Error: Must setup test before interacting with the page`

- **Wo:** Production mit dem Browser-Werkzeug `mcp__playwright-test__browser_navigate` öffnen.
- **Ursache:** Die Werkzeuge des Playwright-MCP-Servers (Model Context Protocol: Schnittstelle, über die Claude
  fremde Werkzeuge nutzt) arbeiten nur in einem eingerichteten Test (`generator_setup_page`/`planner_setup_page`).
- **Lösung:** Ein kurzes Playwright-Skript mit `chromium.launch()` geschrieben und mit `node` ausgeführt.
- **Prüfen:** Das Skript gibt die Knöpfe der Seite aus und legt die Screenshots ab.

## Aus dem Chat

-

## Offene Fragen

- Dependabot-PRs #91 (Next.js) und #92 (npm-klein) sind weiter offen.

## Nächste Schritte

1. „Andere Playlist“ beim nächsten Spiel mit Spotify einmal benutzen.
2. Dependabot-PRs #91 und #92 prüfen und mergen.
