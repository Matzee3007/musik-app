---
titel: "Plan: Raum und Beitritt"
status: aktiv
erstellt: 2026-10-21
tags: [plan, phase-3, supabase, realtime, raum, playwright]
---

# Plan: Raum und Beitritt

**Ziel:** Der DJ eröffnet am Tisch einen Raum, Spieler treten per QR-Code oder Raum-Code mit ihrem Namen vom Handy
bei, der Tisch zeigt sie live in einer Leiste, und „Raum schließen“ beendet den Raum auf allen Geräten.

**Vorgehen:** Ein Raum ist ein Supabase-Realtime-Kanal `raum:<Code>` ohne Tabellen
([[0004-mehrspieler-ohne-tabellen|ADR 0004]]): Presence sagt, wer da ist (Tisch und Spieler), Broadcast schickt
„geschlossen“. Die Regeln (Code, Name, Spielerleiste) sind reine Funktionen in `lib/raum/`, die Oberfläche spricht
über die Schnittstelle `RaumKanal`, die Tests mit einem Nachbau ersetzen. Das eigentliche Spiel am Handy (Karte,
Runden, Bingo) kommt in Plan C.

**Technik:** `@supabase/supabase-js` 2.117.2, `qrcode.react` 4.2.0 (`QRCodeSVG`), `@playwright/test` 1.63.0 (nur
lokal), Skill `assistent-bauen` für die Einrichtung. Next.js 16: dynamische Route `app/raum/[code]/page.tsx` mit
`PageProps<'/raum/[code]'>`, `params` ist ein Promise.

**Anforderung:** [[projects/musik-app/docs/Projektvision|Projektvision]], „Geklärte Fragen“ zu Phase 3 (Raum,
Beitritt, Neuladen, Tisch, Tests, Fertig). Abgrenzung zu Plan C und „Raum eröffnen“ als eigener Knopf: Entscheidung
des Entwicklers am 2026-10-21.

## Feste Vorgaben

- Fachbegriffe aus [[projects/musik-app/docs/Glossar|Glossar]]: Raum, Raum-Code, Tisch, DJ, Spieler (nicht
  „Mitspieler“, „Lobby“, „PIN“).
- Raum-Code: 4 Buchstaben aus `ABCDEFGHJKMNPQRSTUVWXYZ` (ohne `I`, `L`, `O`). Eingabe mit Kleinbuchstaben und
  Leerzeichen wird angenommen.
- Link im QR-Code: `<Adresse der Seite>/raum/<Code>`, also unter Production `https://musik-bingo.vercel.app/raum/ABCD`.
- Name: 1 bis 20 Zeichen nach `trim`, mehrere Leerzeichen zu einem. „Vergeben“ ohne Unterschied von Groß- und
  Kleinschreibung, gegen alle anderen verbundenen Spieler im Raum.
- Supabase-Schlüssel: nur der **publishable key** (`sb_publishable_…`), Variablen `NEXT_PUBLIC_SUPABASE_URL` und
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, in `.env.local` und bei Vercel für **Production und Preview**. Kein secret
  key, kein Datenbankschema, keine Tabellen.
- Kanäle öffentlich (nicht `private`), dafür muss in den Realtime-Einstellungen „Allow public access“ an sein.
- Speicher: Tisch `localStorage` `musik-app:tisch-raum`, Handy `localStorage` `musik-app:handy-raum`, Kennung des Tabs
  `sessionStorage` `musik-app:geraet` (übersteht Neuladen, ist je Tab verschieden, damit Tisch und Handy im selben
  Browser getrennt bleiben).
- Pakete mit genauer Version, ohne `^` (`npm install -E`), jede mindestens zwei Wochen alt.
- Schritte im Browser (Supabase, Vercel) macht der Entwickler, geführt vom Assistenten.

## Prüf-Schwerpunkte

1. **Handy lädt neu:** Es bleibt mit demselben Namen im Raum, ohne „Name schon vergeben“, obwohl sein alter Eintrag
   in Presence noch kurz da ist. Test: `nameVergeben` ignoriert die eigene Kennung (Aufgabe 3), `HandyRaum` mit
   gespeichertem Raum überspringt die Namensabfrage (Aufgabe 7), Neuladen im Playwright-Test (Aufgabe 8).
2. **Code getippt als `abcd ` oder über `/raum/abcd`:** wird als `ABCD` angenommen. Test: `raumCodeLesen`
   (Aufgabe 2), `HandyRaum` mit `code="abcd"` (Aufgabe 7).
3. **Falscher Code** (kein Tisch im Kanal): „Kein Tisch mit dem Code ABCD. Code prüfen.“ statt Warten ohne Ende.
   Test in Aufgabe 7.
4. **Tisch lädt neu oder kommt von der Spotify-Anmeldung zurück** (`/callback` leitet auf `/`): Derselbe Raum mit
   demselben Code ist wieder da. Test in Aufgabe 6.
5. **Handy sperrt den Bildschirm oder verliert das Netz:** Der Name bleibt in der Leiste, ausgegraut, und wird wieder
   normal, sobald das Handy zurück ist. Test: `spielerleiste` (Aufgabe 3), am echten Handy in Aufgabe 8.

### Aufgabe 1: Supabase einrichten

**Dateien:**
- Neu: `scripts/supabase-einrichten.sh` (Assistent aus dem Skill `assistent-bauen`, bleibt im Repo als
  wiederholbarer Einrichtungsweg)
- Neu: `lib/supabase.ts`
- Ändern: `.env.example` (beide Variablen), `package.json` und `package-lock.json` (`@supabase/supabase-js`)
- Neu: `docs/tools/Supabase.md`, Ändern: `docs/tools/Tools Übersicht.md` (von „Geplant“ nach „Im Einsatz“; Link mit
  Pfad, `Supabase.md` gibt es auch in sport-fantasy)
- Test: `__tests__/lib/supabase.test.ts`

**Schnittstellen:**
- Liefert: `supabaseKonfiguriert(): boolean` (beide Variablen gesetzt, bei jedem Aufruf gelesen wie
  `lib/spotify/konfig.ts`), `supabaseClient(): SupabaseClient` (einmal erzeugt, danach derselbe)

- [ ] **Schritt 1: Paket installieren**

`npm install -E @supabase/supabase-js@2.117.2`

- [ ] **Schritt 2: Assistent mit dem Skill `assistent-bauen` schreiben**

Vier Stufen, `ENV_DATEI=.env.local` eingeschaltet:
1. Projekt anlegen: `https://supabase.com/dashboard/new`, Name `musik-bingo`, Region Frankfurt, Datenbank-Passwort
   „Generate“ (die App braucht es nicht), warten, bis das Projekt bereit ist.
2. Werte: Settings → API Keys (`https://supabase.com/dashboard/project/_/settings/api-keys`) bzw. Dialog „Connect“.
   `frage` für `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (beide öffentlich),
   `env_schreiben` beide.
3. Realtime → Settings: „Allow public access“ ist an. Den genauen Weg beim Schreiben in der Supabase-Doku prüfen.
4. Vercel: `https://vercel.com/matzee3007-s-projects/musik-bingo/settings/environment-variables`, beide Variablen für
   Production und Preview, dann „Redeploy“ der Production.

Prüfen: `bash -n scripts/supabase-einrichten.sh`, Stufen statisch nachverfolgen (Skill, Schritt 4).

- [ ] **Schritt 3 (Entwickler, eigenes Terminal): Assistent ausführen**

`bash scripts/supabase-einrichten.sh` im Projektordner. Erwartet: `.env.local` enthält beide Variablen.

- [ ] **Schritt 4: Tests für `supabaseKonfiguriert` schreiben, rot sehen, umsetzen, grün sehen**

```ts
test("ohne URL oder Schlüssel ist Supabase nicht eingerichtet", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  expect(supabaseKonfiguriert()).toBe(false);
});
test("mit URL und Schlüssel ist Supabase eingerichtet", () => { /* beide gesetzt → true */ });
```

`npx vitest run __tests__/lib/supabase.test.ts`

- [ ] **Schritt 5: Tool-Notiz, prüfen, committen**

`docs/tools/Supabase.md` im Aufbau der Übersicht: Projekt, Schlüsselarten (publishable/secret, anon läuft Ende 2026
aus), Realtime mit Broadcast und Presence, „Allow public access“, der Assistent als Einrichtungsweg.

```bash
npm run check
git add scripts/ lib/supabase.ts __tests__/lib/supabase.test.ts .env.example package.json package-lock.json docs/tools/
git commit -m "Set up Supabase project and client"
```

### Aufgabe 2: Raum-Code

**Dateien:**
- Neu: `lib/raum/code.ts`
- Test: `__tests__/lib/raum/code.test.ts`

**Schnittstellen:**
- Nutzt: `Zufall` aus `lib/zufall.ts`
- Liefert: `RAUM_BUCHSTABEN: string`, `neuerRaumCode(zufall: Zufall = Math.random): string`,
  `raumCodeLesen(eingabe: string): string | null`

- [ ] **Schritt 1: Tests schreiben**

```ts
test("neuerRaumCode nimmt vier Buchstaben aus dem Alphabet", () => {
  expect(neuerRaumCode(() => 0)).toBe("AAAA");
  expect(neuerRaumCode(() => 0.999)).toBe("ZZZZ");
});
test("neuerRaumCode enthält nie I, L oder O", () => { /* 200 Codes mit Math.random, keiner trifft /[ILO]/ */ });
test("raumCodeLesen nimmt Kleinbuchstaben und Leerzeichen an", () => {
  expect(raumCodeLesen(" ab cd ")).toBe("ABCD");
});
test("raumCodeLesen lehnt falsche Länge und verwechselbare Buchstaben ab", () => {
  expect(raumCodeLesen("ABC")).toBeNull();
  expect(raumCodeLesen("ABCDE")).toBeNull();
  expect(raumCodeLesen("ABIO")).toBeNull();
  expect(raumCodeLesen("AB1D")).toBeNull();
});
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/code.test.ts`
Erwartet: FAIL, `lib/raum/code` gibt es nicht.

- [ ] **Schritt 3: `lib/raum/code.ts` umsetzen**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/code.ts __tests__/lib/raum/code.test.ts
git commit -m "Add room codes"
```

### Aufgabe 3: Spieler im Raum

**Dateien:**
- Neu: `lib/raum/spieler.ts`
- Test: `__tests__/lib/raum/spieler.test.ts`

**Schnittstellen:**
- Liefert:
  - `type Anwesend = { schluessel: string; rolle: "tisch" } | { schluessel: string; rolle: "spieler"; name: string }`
    (`schluessel` ist die Kennung des Tabs, zugleich der Presence-Schlüssel)
  - `nameLesen(eingabe: string): string | null`
  - `nameVergeben(anwesende: readonly Anwesend[], name: string, ich: string): boolean`
  - `tischDa(anwesende: readonly Anwesend[]): boolean`
  - `spielerleiste(bekannt: readonly string[], anwesende: readonly Anwesend[]): { name: string; verbunden: boolean }[]`:
    alle bekannten in ihrer Reihenfolge, dahinter neue verbundene Spieler; der Tisch ist kein Eintrag

- [ ] **Schritt 1: Tests schreiben**

```ts
const anna = { schluessel: "s1", rolle: "spieler", name: "Anna" } as const;
const tisch = { schluessel: "t", rolle: "tisch" } as const;

test("nameLesen kürzt Leerzeichen und lehnt leere oder zu lange Namen ab", () => {
  expect(nameLesen("  Anna   Lena ")).toBe("Anna Lena");
  expect(nameLesen("   ")).toBeNull();
  expect(nameLesen("x".repeat(21))).toBeNull();
});
test("ein Name ist vergeben, wenn ein anderer Spieler ihn trägt, auch anders geschrieben", () => {
  expect(nameVergeben([tisch, anna], "anna", "s2")).toBe(true);
});
test("der eigene Eintrag zählt nicht, so übersteht ein Handy das Neuladen", () => {
  expect(nameVergeben([anna], "Anna", "s1")).toBe(false);
});
test("tischDa erkennt den Tisch unter den Anwesenden", () => { /* [anna] → false, [tisch, anna] → true */ });
test("spielerleiste graut bekannte Spieler aus, die nicht verbunden sind, und hängt neue an", () => {
  const ben = { schluessel: "s3", rolle: "spieler", name: "Ben" } as const;
  expect(spielerleiste(["Anna", "Cem"], [tisch, ben, anna])).toEqual([
    { name: "Anna", verbunden: true },
    { name: "Cem", verbunden: false },
    { name: "Ben", verbunden: true },
  ]);
});
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/spieler.test.ts`

- [ ] **Schritt 3: `lib/raum/spieler.ts` umsetzen**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/spieler.ts __tests__/lib/raum/spieler.test.ts
git commit -m "Add player rules for rooms"
```

### Aufgabe 4: Raum merken

**Dateien:**
- Neu: `lib/raum/speicher.ts`
- Test: `__tests__/lib/raum/speicher.test.ts`

**Schnittstellen:**
- Liefert:
  - `type TischRaum = { code: string; bekannt: string[] }`; `tischRaumLaden(): TischRaum | null`,
    `tischRaumSpeichern(raum: TischRaum): void`, `tischRaumLoeschen(): void`
  - `type HandyRaum = { code: string; name: string }`; `handyRaumLaden(code: string): HandyRaum | null` (nur für
    denselben Code), `handyRaumSpeichern(raum: HandyRaum): void`, `handyRaumLoeschen(): void`
  - `tabSchluessel(): string` (beim ersten Aufruf `crypto.randomUUID()` in `sessionStorage`, danach derselbe)

- [ ] **Schritt 1: Tests schreiben**

Testnamen: „Tischraum übersteht Speichern und Laden“, „ohne gespeicherten Raum liefert das Laden null“,
„Handyraum gilt nur für denselben Code“, „tabSchluessel bleibt im selben Tab gleich“ (zweimal aufrufen, gleich),
„ein neuer Tab bekommt einen neuen Schlüssel“ (`sessionStorage.clear()` dazwischen, verschieden).

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/lib/raum/speicher.test.ts`

- [ ] **Schritt 3: `lib/raum/speicher.ts` umsetzen**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/raum/speicher.ts __tests__/lib/raum/speicher.test.ts
git commit -m "Remember room on table and phone"
```

### Aufgabe 5: Raum-Kanal über Supabase Realtime

Kein Unit-Test: Die einzige Nahtstelle ist Supabase selbst. Abgedeckt durch den Playwright-Test in Aufgabe 8, die
Ansichten testen gegen den Nachbau.

**Dateien:**
- Neu: `lib/raum/kanal.ts`
- Neu: `__tests__/hilfen/raum-kanal.ts` (Nachbau für die Ansichten)

**Schnittstellen:**
- Nutzt: `supabaseClient()` (Aufgabe 1), `Anwesend` (Aufgabe 3)
- Liefert:

```ts
export type RaumNachricht = { art: "geschlossen" }; // Plan C ergänzt Runde und Auflösung
export interface RaumKanal {
  // Abonniert den Kanal und liefert die Anwesenden nach dem ersten Presence-Abgleich ("sync").
  verbinden(): Promise<Anwesend[]>;
  // Meldet das eigene Gerät an (Presence "track").
  anmelden(ich: Anwesend): Promise<void>;
  // Jede Änderung der Anwesenden, liefert eine Funktion zum Abmelden des Rückrufs.
  beiAnwesenden(rueckruf: (anwesende: Anwesend[]) => void): () => void;
  senden(nachricht: RaumNachricht): Promise<void>;
  beiNachricht(rueckruf: (nachricht: RaumNachricht) => void): () => void;
  trennen(): void;
}
export type KanalOeffnen = (code: string, schluessel: string) => RaumKanal;
export const supabaseRaumKanal: KanalOeffnen;
```

- Nachbau: `nachgebauterRaum()` liefert `{ oeffnen: KanalOeffnen; anwesendeSetzen(a: Anwesend[]): void;
  nachrichtSchicken(n: RaumNachricht): void; gesendet: RaumNachricht[]; angemeldet: Anwesend[] }`.

- [ ] **Schritt 1: `lib/raum/kanal.ts` umsetzen**

Kanal `raum:<Code>` mit `config: { presence: { key: schluessel } }`. Rückrufe für `presence`/`sync` und
`broadcast`/`nachricht` vor `subscribe()` anmelden. Anwesende aus `presenceState()`: je Schlüssel der erste Eintrag.

- [ ] **Schritt 2: Nachbau `__tests__/hilfen/raum-kanal.ts` schreiben**

- [ ] **Schritt 3: Prüfen und committen**

```bash
npm run check
git add lib/raum/kanal.ts __tests__/hilfen/raum-kanal.ts
git commit -m "Add room channel over Supabase Realtime"
```

### Aufgabe 6: Tisch eröffnet und schließt den Raum

**Dateien:**
- Neu: `app/ui/raum-kopf.tsx`
- Ändern: `app/ui/start.tsx`, `package.json` und `package-lock.json` (`qrcode.react`)
- Test: `__tests__/ui/raum-kopf.test.tsx`, Ändern: `__tests__/ui/start.test.tsx`

**Schnittstellen:**
- Nutzt: Aufgaben 2 bis 5
- Liefert: `RaumKopf({ code, kanal, onGeschlossen })`; `Start({ kanalOeffnen = supabaseRaumKanal })`

Ablauf der Startseite: Ohne gespeicherten Tischraum zwei Teile: Knopf „Raum eröffnen“ und „Raum beitreten“
(Eingabefeld für den Code, Knopf „Beitreten“ öffnet `/raum/<Code>`, ausgegraut, solange `raumCodeLesen` `null`
liefert). „Raum eröffnen“ speichert einen neuen Tischraum und zeigt darüber den `RaumKopf`, darunter den bisherigen
Ablauf (Anmelden, Playlists, Demo). Mit gespeichertem Tischraum geht es sofort so weiter. Ohne Supabase
(`supabaseKonfiguriert()` falsch) sind beide Teile ausgegraut mit „Supabase ist hier nicht eingerichtet, nur die
Demo ohne Raum.“, und der bisherige Ablauf steht wie heute darunter.

`RaumKopf`: verbindet, meldet sich als `{ rolle: "tisch" }` an, zeigt den Code groß, `QRCodeSVG` mit
`${window.location.origin}/raum/${code}`, die Leiste aus `spielerleiste` (nicht verbundene ausgegraut) und speichert
neue Namen in `bekannt`. „Raum schließen“ sendet `{ art: "geschlossen" }`, trennt, löscht den Tischraum und ruft
`onGeschlossen`.

- [ ] **Schritt 1: Paket installieren**

`npm install -E qrcode.react@4.2.0`

- [ ] **Schritt 2: Tests schreiben**

`raum-kopf.test.tsx`: „zeigt Code und QR-Code mit dem Link zum Raum“ (`ABCD`, ein `svg` mit dem Titel
`QR-Code für Raum ABCD`, gesetzt über die Prop `title`), „meldet den Tisch im Raum an“ (`angemeldet` enthält `rolle: "tisch"`),
„zeigt verbundene Spieler und graut gegangene aus“ (erst Anna und Ben, dann nur Ben: Anna bleibt mit
`aria-disabled="true"`), „Raum schließen sagt es allen und löscht den Raum“ (`gesendet` enthält
`{ art: "geschlossen" }`, `tischRaumLaden()` ist `null`, `onGeschlossen` aufgerufen).

`start.test.tsx`: „Raum eröffnen zeigt den Raum-Kopf, danach Demo und Anmelden“, „gespeicherter Raum ist nach dem
Neuladen wieder da“ (Prüf-Schwerpunkt 4: `tischRaumSpeichern({ code: "ABCD", bekannt: [] })`, dann rendern, `ABCD`
sichtbar), „Beitreten öffnet den Raum mit dem gelesenen Code“ (`ab cd` eintippen → Ziel `/raum/ABCD`), „ohne Supabase
sind Raum-Knöpfe aus, die Demo geht“. Bestehende Tests, die „Demo starten“ sofort erwarten, gehen jetzt über
„Raum eröffnen“ oder laufen ohne Supabase.

- [ ] **Schritt 3: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/raum-kopf.test.tsx __tests__/ui/start.test.tsx`

- [ ] **Schritt 4: `app/ui/raum-kopf.tsx` und `app/ui/start.tsx` umsetzen**

- [ ] **Schritt 5: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 6: Prüfen und committen**

```bash
npm run check
git add app/ui/raum-kopf.tsx app/ui/start.tsx __tests__/ui/ package.json package-lock.json
git commit -m "Open and close a room at the table"
```

### Aufgabe 7: Handy tritt bei

**Dateien:**
- Neu: `app/raum/[code]/page.tsx` (wartet auf `params`, rendert `HandyRaum`)
- Neu: `app/ui/handy-raum.tsx`
- Test: `__tests__/ui/handy-raum.test.tsx`

**Schnittstellen:**
- Nutzt: Aufgaben 2 bis 5
- Liefert: `HandyRaum({ code, kanalOeffnen = supabaseRaumKanal })` mit diesen Zuständen und Texten:
  - Code ungültig: „Ungültiger Raum-Code.“ und Link „Zur Startseite“
  - ohne Supabase: „Supabase ist hier nicht eingerichtet.“
  - nach `verbinden()` ohne Tisch und ohne gespeicherten Handyraum: „Kein Tisch mit dem Code ABCD. Code prüfen.“
  - Name eingeben: Überschrift „Raum ABCD“, Feld „Dein Name“, Knopf „Beitreten“ (aus, solange `nameLesen` `null`
    liefert); bei vergebenem Namen „Name schon vergeben“
  - beigetreten (auch sofort mit gespeichertem Handyraum): „Du bist im Raum ABCD als Anna.“ und „Warte auf das
    Spiel …“ (Plan C zeigt hier die Karte)
  - nach der Nachricht `geschlossen`: „Raum geschlossen“, Handyraum gelöscht

- [ ] **Schritt 1: Tests schreiben**

Testnamen: „Name eingeben und beitreten meldet den Spieler an“ (`angemeldet` enthält `name: "Anna"`, Handyraum
gespeichert), „Name schon vergeben“, „Raum-Code klein in der Adresse wird gelesen“ (`code="abcd"` → „Raum ABCD“,
Prüf-Schwerpunkt 2), „ohne Tisch im Kanal: Kein Tisch mit dem Code“ (Prüf-Schwerpunkt 3), „gespeicherter Raum tritt
nach dem Neuladen ohne Namensabfrage bei“ (Prüf-Schwerpunkt 1), „Raum geschlossen“, „ungültiger Code“.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ui/handy-raum.test.tsx`

- [ ] **Schritt 3: `app/ui/handy-raum.tsx` und `app/raum/[code]/page.tsx` umsetzen**

- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add app/raum app/ui/handy-raum.tsx __tests__/ui/handy-raum.test.tsx
git commit -m "Join a room from the phone"
```

### Aufgabe 8: Playwright und Test mit echten Handys

**Dateien:**
- Neu: `playwright.config.ts` (`testDir: "e2e"`, `baseURL` `http://127.0.0.1:3000`, `webServer` mit `npm run dev`
  und `reuseExistingServer: true`, nur Chromium)
- Neu: `e2e/raum.spec.ts`
- Ändern: `vitest.config.mts` (`exclude: [...configDefaults.exclude, "e2e/**"]`, sonst nimmt Vitest die
  `.spec.ts`), `.gitignore` (`test-results/`, `playwright-report/`), `package.json` (Skript `"e2e": "playwright test"`,
  `@playwright/test`)
- Neu: `docs/tools/Playwright.md`, Ändern: `docs/tools/Tools Übersicht.md`, `CLAUDE.md` (Befehl `npm run e2e`,
  Repo-Struktur mit `lib/raum/`, `e2e/`, `scripts/`)

- [ ] **Schritt 1: Installieren**

```bash
npm install -D -E @playwright/test@1.63.0
npx playwright install chromium
```

- [ ] **Schritt 2: `e2e/raum.spec.ts` schreiben**

Ein Test mit zwei Browser-Kontexten gegen das echte Supabase-Projekt: Tisch „Raum eröffnen“ → Code lesen → Handy 1
öffnet `/raum/<Code>`, Name „Anna“ → Tisch zeigt „Anna“ → Handy 2 versucht „anna“ → „Name schon vergeben“ → Handy 1
lädt neu → „Du bist im Raum … als Anna.“ ohne Namensabfrage → Tisch „Raum schließen“ → Handy 1 zeigt „Raum
geschlossen“.

- [ ] **Schritt 3: Laufen lassen, er muss bestehen**

`npm run e2e`
Erwartet: `1 passed`

- [ ] **Schritt 4: Doku, prüfen, committen, PR**

```bash
npm run check
git add playwright.config.ts e2e/ vitest.config.mts .gitignore package.json package-lock.json docs/ CLAUDE.md
git commit -m "Add Playwright test for joining a room"
```

PR öffnen, `gh pr checks <nr>` grün.

- [ ] **Schritt 5 (Entwickler): mit echten Handys unter der Production prüfen**

Nach dem Merge am Laptop `https://musik-bingo.vercel.app` → „Raum eröffnen“. Zwei Handys scannen den QR-Code und
treten mit Namen bei, beide stehen in der Leiste. Ein Handy sperrt den Bildschirm eine Minute (Name grau, danach
wieder normal, Prüf-Schwerpunkt 5), eines lädt neu (bleibt drin). „Raum schließen“: beide zeigen „Raum
geschlossen“.

**Fertig, wenn:** Der Tisch unter `https://musik-bingo.vercel.app` eröffnet einen Raum, zwei echte Handys treten
per QR-Code bei und stehen in der Leiste, Neuladen und Bildschirmsperre verhalten sich wie in den
Prüf-Schwerpunkten, „Raum schließen“ erreicht alle. `npm run e2e`, `npm run check` und `gh pr checks` grün,
`plan-pruefer` hat den Branch gegen diesen Plan geprüft.
