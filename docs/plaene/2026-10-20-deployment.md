---
titel: "Plan: Deployment auf Vercel"
status: aktiv
erstellt: 2026-10-20
tags: [plan, vercel, deployment, phase-3]
---

# Plan: Deployment auf Vercel

**Ziel:** Die heutige App läuft unter `https://musik-bingo.vercel.app`, mit Spotify-Anmeldung und Musik. Jeder PR
bekommt eine Vorschau-Adresse, die nur die Demo anbietet.

**Vorgehen:** Vercel holt den Code über die Git-Verbindung von GitHub: Ein Merge in `main` erneuert die feste Adresse
(Production), jeder PR bekommt ein eigenes Vorschau-Deployment (Preview). Die Spotify-Client-ID steht nur in der
Umgebung „Production“ von Vercel. Vorschauen haben deshalb keine und zeigen nur die Demo. Am Code ändert sich nur der
Hinweis auf der Startseite und die Node-Version in `package.json`.

**Technik:** Vercel (Git-Verbindung, keine Vercel-CLI nötig), Next.js 16, Node 24. Keine neuen Pakete.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 3 (Deployment,
Plan A); [[0003-spotify-anmeldung-nur-im-browser|ADR 0003]] (zweite Redirect-URI).

## Feste Vorgaben

- Adresse `https://musik-bingo.vercel.app`, Name ohne „hitster“. Ist der Name vergeben, hängt Vercel etwas an; dann
  gilt die angezeigte Adresse überall, wo hier `musik-bingo.vercel.app` steht.
- Redirect-URI bei Spotify genau `https://musik-bingo.vercel.app/callback`, ohne Schrägstrich am Ende. Die alte
  `http://127.0.0.1:3000/callback` bleibt eingetragen.
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` in Vercel nur für die Umgebung **Production**, nicht für Preview und Development.
- Kein Client-Secret und kein anderer Schlüssel in Vercel oder im Repo (ADR 0003, `REVIEW.md`).
- Node 24 wie lokal und in der CI (`.github/workflows/ci.yml`).
- Schritte im Browser (Vercel, Spotify Dashboard) macht der Entwickler, Claude erklärt sie vorher.

## Prüf-Schwerpunkte

1. **Erster Start auf Vercel:** Token und vorbereitete Playlists liegen im `localStorage` von `127.0.0.1` und fehlen
   unter der neuen Adresse. Erwartet: Startseite mit „Mit Spotify anmelden“, nach Anmeldung und einmaligem
   Vorbereiten läuft alles wie lokal (Aufgabe 3).
2. **Redirect-URI nicht genau gleich** (z. B. mit `/` am Ende): Spotify zeigt „INVALID_CLIENT: Invalid redirect URI“.
   Erwartet: Anmeldung klappt mit genau der Adresse aus den Vorgaben (Aufgabe 3).
3. **MusicBrainz-Route als Vercel Function:** Vorbereiten einer Playlist mit mindestens 20 Songs läuft durch, einzelne
   503-Antworten fängt das Wiederholen in `lib/vorbereiten.ts` ab. Erwartet: „N Songs bereit“ wie lokal (Aufgabe 3).
4. **Vorschau-Adresse eines PRs:** Spotify-Knopf ausgegraut mit Hinweis, Demo spielbar (Aufgabe 1, Aufgabe 2).
   Vercel schützt Vorschauen standardmäßig mit einer Vercel-Anmeldung (Deployment Protection); das bleibt so.
5. **Musik über HTTPS:** Das Web Playback SDK braucht eine sichere Verbindung. Erwartet: Song läuft am Laptop unter
   der Vercel-Adresse wie unter `127.0.0.1` (Aufgabe 3).

### Aufgabe 1: Startseite ohne Client-ID

Der Hinweis „trage NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local ein“ stimmt lokal, auf einer Vorschau-Adresse ist er
irreführend. Neuer Text, der für beide Fälle passt.

**Dateien:**
- Ändern: `app/ui/start.tsx` (Hinweis unter dem Knopf „Mit Spotify anmelden“)
- Test: `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: `clientId()` aus `lib/spotify/konfig.ts` (liefert `undefined`, wenn die Variable fehlt)
- Liefert: nichts Neues

- [x] **Schritt 1: Fehlschlagenden Test schreiben**

Den vorhandenen Test „ohne Client-ID ist Anmelden aus und ein Hinweis erklärt warum“ anpassen (er setzt die Variable
schon mit `vi.stubEnv` leer). Prüfungen: Knopf „Mit Spotify anmelden“ ist `disabled`, Text
„Spotify ist hier nicht eingerichtet, nur die Demo. Lokal: NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local eintragen.“
ist sichtbar, Knopf „Demo starten“ ist aktiv.

- [x] **Schritt 2: Test laufen lassen, er muss fehlschlagen**

`npx vitest run __tests__/ui/start.test.tsx`
Erwartet: FAIL, der neue Text fehlt.

- [x] **Schritt 3: Hinweis in `app/ui/start.tsx` ersetzen**

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ui/start.test.tsx`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/ui/start.tsx __tests__/ui/start.test.tsx
git commit -m "Explain missing Spotify client ID on preview deployments"
```

### Aufgabe 2: Vercel-Projekt anlegen

**Dateien:**
- Ändern: `package.json` (`"engines": { "node": "24.x" }`, Vercel liest daraus die Node-Version)
- Neu: `docs/tools/Vercel.md` (Tool-Notiz: was Vercel ist, Production und Preview, Umgebungsvariablen, Deployment
  Protection, Fehler mit Ursache und Lösung)
- Ändern: `docs/tools/Tools Übersicht.md` (Eintrag Vercel)

**Schnittstellen:**
- Nutzt: Aufgabe 1 (Hinweis für Vorschauen)
- Liefert: Production-Adresse `https://musik-bingo.vercel.app` für Aufgabe 3 und für Plan B (QR-Code)

- [ ] **Schritt 1: `engines` in `package.json` eintragen, `npm run check` grün, committen**

```bash
git commit -am "Pin Node 24 for Vercel"
```

- [ ] **Schritt 2: Branch pushen und PR öffnen**, damit Vercel gleich nach dem Verbinden ein Vorschau-Deployment baut.

- [ ] **Schritt 3 (Entwickler, im Browser): Projekt importieren**

vercel.com → „Add New… → Project“ → GitHub-Repo `musik-app` importieren (Vercel um Zugriff auf genau dieses Repo
bitten lassen) → Projektname `musik-bingo`, Framework „Next.js“ (erkennt Vercel selbst), Build-Befehl und Ordner
unverändert → unter „Environment Variables“ `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` mit der Client-ID aus `.env.local`,
**nur Production** angehakt → „Deploy“.

- [ ] **Schritt 4: Production prüfen**

`curl -s -o /dev/null -w "%{http_code}\n" https://musik-bingo.vercel.app`
Erwartet: `200`. Im Browser: Startseite mit aktivem Knopf „Mit Spotify anmelden“. Auf dem Handy: Demo bis zur ersten
Auflösung spielbar.

- [ ] **Schritt 5: Vorschau prüfen**

`gh pr checks <nr>` zeigt den Vercel-Check, der PR einen Kommentar mit der Vorschau-Adresse. Erwartet: Dort ist
„Mit Spotify anmelden“ ausgegraut mit dem Hinweis aus Aufgabe 1, die Demo läuft.

- [ ] **Schritt 6: Tool-Notiz und Übersicht schreiben, committen**

```bash
git add docs/tools/Vercel.md "docs/tools/Tools Übersicht.md"
git commit -m "Add Vercel tool note"
```

### Aufgabe 3: Spotify unter der Vercel-Adresse

**Dateien:**
- Ändern: `docs/tools/Spotify Web API.md` (beide Redirect-URIs, Hinweis „`localStorage` je Adresse“)
- Ändern: `CLAUDE.md` (unter „Befehle“ die Production-Adresse und dass ein Merge in `main` sie erneuert)

**Schnittstellen:**
- Nutzt: Production-Adresse aus Aufgabe 2
- Liefert: Anmeldung und Musik unter der Production-Adresse, Grundlage für Plan B

- [ ] **Schritt 1 (Entwickler, im Browser): Redirect-URI eintragen**

developer.spotify.com → Dashboard → App → „Edit Settings“ → „Redirect URIs“ → `https://musik-bingo.vercel.app/callback`
hinzufügen, „Save“.

- [ ] **Schritt 2: Anmeldung, Vorbereiten und Musik prüfen (Prüf-Schwerpunkte 1, 2, 3, 5)**

Am Laptop `https://musik-bingo.vercel.app` öffnen → anmelden → eine Playlist mit mindestens 20 Songs vorbereiten →
Spiel starten → eine Runde mit Musik bis zur Auflösung. Erwartet: keine Fehlermeldung, Song läuft, Erscheinungsjahre
wie lokal.

- [ ] **Schritt 3: Doku ergänzen und committen**

```bash
git add "docs/tools/Spotify Web API.md" CLAUDE.md docs/plaene/2026-10-20-deployment.md
git commit -m "Document production address and Spotify redirect URI"
```

**Fertig, wenn:** `https://musik-bingo.vercel.app` liefert die App, der DJ meldet sich dort an, bereitet eine Playlist
vor und hört in einer Runde Musik. Die Vorschau des PRs bietet nur die Demo an. `npm run check` und `gh pr checks`
grün, `plan-pruefer` hat den Branch gegen diesen Plan geprüft.
