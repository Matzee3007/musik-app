---
titel: Lernjournal Phase 4 - Startseite Bühne
status: aktiv
phase: 4
erstellt: 2026-11-08
tags: [lernjournal, phase-4, design, tailwind, vitest, playwright, code-review, dependabot, eslint, typescript]
---

# Lernjournal Phase 4: Startseite Bühne

Fortsetzung von [[Lernjournal Phase 4 - Restpunkte und Dependabot]]. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]].
Die Startseite und die Playlist-Auswahl sahen nicht professionell aus. Aus einem Mock mit drei Varianten wurde
Variante B „Bühne“ gewählt, geplant, testgetrieben umgesetzt und live gestellt. Danach wurden die zwei offenen
Dependabot-PRs abgeschlossen.

## Erledigt

- [x] **Werkzeug für UI/UX gesucht:** Auf GitHub gefunden wurden `ui-ux-pro-max-skill` (ca. 147 000 Sterne, MIT, ein
  Skill, der ein Designsystem erzeugt) und `LibreUIUX-Claude-Code` (93 Agents, zu breit). Entscheidung: nichts Neues
  installieren, sondern den schon installierten Skill `frontend-design` und den Agent `mock-bauer` nehmen. Das Farbthema
  „Anthrazit und Messing“ bleibt.
- [x] **Mock mit drei Varianten** (A „Zwei Wege“, B „Bühne“, C „Code zuerst“), gewählt: **B**.
- [x] **Plan** [[2026-11-08-startseite-buehne|Plan: Startseite „Bühne“ und Playlist-Raster]] mit vier Aufgaben, jetzt
  `status: abgeschlossen`.
- [x] **PR #74 gemergt, live auf Production:**
  - `eigenePlaylists` liest das Cover der Playlist (`cover: string | null`).
  - Neue Ansicht `app/ui/buehne.tsx`: Logo, „Dreh das Rad. Erkenn den Song.“, Rad-Ring, die Knöpfe „Am Tisch spielen“
    (vorher „Lokal spielen“) und „Online spielen“ mit Erklärung, Band „Mitspielen“ mit Code-Feld.
  - Neue Ansicht `app/ui/playlist-auswahl.tsx`: Raster mit Covern, Platzhalter mit Anfangsbuchstaben, Hinweis ohne
    Playlists.
  - Tisch, Vorbereiten und Raum-Schublade sehen aus wie vorher.
- [x] **`plan-pruefer`** meldete 4 Lücken (fehlende Tests, Widerspruch im Plan bei den Farben), alle geschlossen. Dazu
  gehört der neue Browser-Test in `e2e/design.spec.ts` für 1440 und 390 px: kein seitliches Scrollen, lange Namen
  höchstens zweizeilig.
- [x] **`/code-review` zu #74** fand 10 Punkte. Behoben wurden 1, 2, 3, 4, 6, 7 und 10: Die Bühne wartet nicht mehr auf
  Spotify, die Vorschau ohne Supabase zeigt die Demo im ersten Bildschirm, Emojis im Platzhalter, Doku, `geladen`
  entfernt, großer Ring erst ab 1280 px. Bewusst gelassen wurden 5, 8 und 9.
- [x] **Dependabot:** #68 (ESLint 9 → 10) gemergt. #59 (TypeScript 7) geschlossen, PR #75 lässt Dependabot TypeScript
  ab 7 ignorieren.
- [x] **`minimatch`-Warnung** (mittlere Stufe, über ESLint 10): bewusst gelassen, läuft nur beim Linten.
- [ ] Die neue Playlist-Seite mit echter Spotify-Anmeldung und echten Covern ansehen.

## Befehle: Design und Prüfen

```bash
npx vitest run __tests__/ui/buehne.test.tsx
npx playwright test e2e/design.spec.ts -g 'Bühne'
NEXT_PUBLIC_SUPABASE_URL= npm run dev
gh pr checks 74 --watch --interval 15
```

- `npx vitest run <datei>`: nur die Tests einer Datei, schnell für den Rot-Grün-Wechsel.
- `npx playwright test <datei> -g '<name>'`: nur Browser-Tests, deren Name passt.
- `NEXT_PUBLIC_SUPABASE_URL= npm run dev`: App lokal so starten wie die Vorschauen auf Vercel, ohne Supabase.
- `gh pr checks <nr> --watch`: wartet, bis die CI eines PRs fertig ist.

## Befehle: Dependabot-PRs prüfen

```bash
git worktree add --detach <ordner> origin/<branch>
git worktree remove --force <ordner>
npm view @typescript-eslint/parser peerDependencies
gh pr close 59 --comment "…"
```

- `git worktree add`: zweiter Arbeitsordner mit dem Branch eines PRs. Damit lässt sich der PR testen, ohne `main` zu
  verlassen.
- `git worktree remove`: den Ordner wieder entfernen.
- `npm view <paket> peerDependencies`: zeigt, welche Versionen anderer Pakete ein Paket verlangt.
- `gh pr close`: PR schließen, der Kommentar nennt den Grund.

## Neu gelernt

### Mock vor dem Code

Ein Mock ist ein Entwurf als einfache HTML-Datei ohne echte Funktion. Drei Varianten nebeneinander machen die
Entscheidung leicht, bevor Code entsteht. Annahmen aus dem Mock gehören trotzdem geprüft: Der Hinweis „ab 25 Songs“
stimmte nicht, denn die 25 Felder der Karte sind Kategorien, keine Songs.

### Einen Test erst rot sehen

Ein Test, der nie fehlschlagen kann, beweist nichts. Darum wurde der behobene Fehler (dreizeiliger Name) kurz wieder
eingebaut: Der neue Browser-Test wurde rot (3 bzw. 4 Zeilen statt höchstens 2) und ohne den Fehler wieder grün.

### `line-clamp` und `block`

`line-clamp-2` kürzt Text auf zwei Zeilen, braucht dafür aber eine eigene Anzeigeart. Steht `block` auf demselben
Element, überschreibt es diese, und die Kürzung wirkt nicht.

### Peer-Abhängigkeit

Damit sagt ein Paket: „Ich laufe nur mit Version X von Paket Y, und Y installierst du selbst.“ Eine Warnung heißt
„nicht offiziell getestet“ (ESLint 10 bei zwei Plugins von Next.js, funktioniert trotzdem). Ein Fehler heißt „geht
wirklich nicht“ (TypeScript 7 bei `typescript-eslint`).

### `react-hooks/set-state-in-effect`

Die React-Regel verbietet, in einem Effekt den Zustand direkt zu setzen, weil das sofort ein zweites Zeichnen auslöst.
Läuft das Setzen über ein Promise (`.then(setTischRaum)`), ist es erlaubt.

## Fehler und Lösungen

### Raum-Schublade überdeckt das Playlist-Raster

- **Wo:** Screenshot der Playlist-Seite bei 1440 px
- **Ursache:** Die Schublade liegt ab `lg` absolut oben links. Die alte, schmale Liste stand mittig, das neue Raster
  ist breit.
- **Lösung:** Im Raum `lg:pl-72` um das Raster.
- **Prüfen:** Screenshot bei 1440 px, `npm run e2e`

### `Unable to find an accessible element with the role "heading" and name "Dreh das Rad. Erkenn den Song."`

- **Wo:** `__tests__/ui/buehne.test.tsx`
- **Ursache:** `<br />` erzeugt im Namen der Überschrift kein Leerzeichen („Rad.Erkenn“).
- **Lösung:** `{" "}` vor dem `<br />`
- **Prüfen:** `npx vitest run __tests__/ui/buehne.test.tsx`

### `typescript-eslint does not support TS 7.0.`

- **Wo:** `npm run lint` mit Dependabot-PR #59 (TypeScript 5.9 → 7.0)
- **Ursache:** `typescript-eslint` aus `eslint-config-next` unterstützt höchstens TypeScript 6.0 (`>=4.8.4 <6.1.0`).
- **Lösung:** #59 geschlossen, `dependabot.yml` ignoriert `typescript` mit `versions: [">=7.0.0"]` (PR #75).
- **Prüfen:** `npm view @typescript-eslint/parser peerDependencies`

### `viewport.width: expected integer, got float NaN`

- **Wo:** eigenes Screenshot-Skript, aufgerufen in einer Schleife über `$v`
- **Ursache:** zsh teilt eine Variable nicht in einzelne Wörter auf, das Skript bekam alles als ein Argument.
- **Lösung:** das Skript einzeln mit getrennten Argumenten aufrufen.
- **Prüfen:** Das Skript gibt `tablet-800 800` aus.

## Aus dem Chat

-

## Offene Fragen

- Wie wirken echte Spotify-Cover im neuen Raster?
- ~~Beachtet Dependabot den Eintrag `versions: [">=7.0.0"]`?~~ Ja: Direkt nach dem Merge von #75 kam #80 mit TypeScript 6.0.3.

## Nächste Schritte

1. Playlist-Seite mit eigener Spotify-Anmeldung ansehen, bei Bedarf nachbessern.
2. Online-Spieleabend mit Freunden als echter Test (aus der letzten Übergabe), vorher prüfen, ob Supabase läuft.
