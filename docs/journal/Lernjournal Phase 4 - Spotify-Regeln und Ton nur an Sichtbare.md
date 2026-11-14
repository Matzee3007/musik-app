---
titel: Lernjournal Phase 4 - Spotify-Regeln und Ton nur an Sichtbare
status: aktiv
phase: 4
erstellt: 2026-11-14
tags: [lernjournal, phase-4, spotify, supabase, webrtc, adr, vitest, playwright, code-review, dependabot]
---

# Lernjournal Phase 4: Spotify-Regeln und Ton nur an Sichtbare

Fortsetzung von [[Lernjournal Phase 4 - Raum offen und Dependabot]]. Gehört zu
[[projects/musik-app/docs/Projektvision|Projektvision]]. Die Session lief vom 2026-11-12 bis 2026-11-14.

## Erledigt

- [x] Dependabot-PR #87 (Tailwind 4.3.4 → 4.3.5, nur Fehlerbehebungen) nach grüner CI gemergt.
- [x] „Raum offen“ mit echter Spotify-Anmeldung auf Production abgenommen: Raum → Spotify → Playlist → Tisch,
  gemerkter Raum nach dem Neuladen. Laut Entwickler „alles geklappt“.
- [x] Supabase vor dem Spieleabend geprüft: `200` am 2026-11-12 und am 2026-11-14.
- [x] Spotify Developer Terms (Version 10) und Developer Policy (beide gültig seit 15.05.2025) vom `quellen-leser`
  auswerten lassen. Die vier tragenden Zitate hat die Hauptsitzung per `grep -F` im Text bestätigt.
- [x] [[0009-spotify-regeln-bewusst-privat|ADR 0009]]: Spotify-Regeln bewusst überschritten, App bleibt streng privat.
- [x] [[0010-offener-raum-ton-nur-an-sichtbare|ADR 0010]]: Raum bleibt öffentlich, Ton nur an Spieler in Presence.
  Hinweise darauf in ADR 0004 und ADR 0008 ergänzt.
- [x] `tonSenden` in `lib/raum/ton.ts`: Antwort auf `hallo` nur an Geräte, die als Spieler in Presence stehen. Ein
  frühes `hallo` wartet, bis das Gerät sichtbar wird. 4 neue Tests in `__tests__/lib/raum/ton.test.ts`.
- [x] `/code-review` von PR #88 (Stufe high, 7 Funde) mit dem Entwickler durchgegangen. Nr. 1, 2, 3, 6 und 7
  umgesetzt, Nr. 4 und 5 bleiben liegen.
- [x] `npm run check`: Exit-Code 0, 390 Tests. `e2e/online.spec.ts` 3 von 3 grün (`--repeat-each=3`). CI grün,
  PR #88 gemergt, Production-Deployment `success`.
- [ ] Online-Spieleabend mit Freunden: vorbereitet (Ablauf und Beobachtungspunkte stehen in der Session), Ergebnis
  noch nicht berichtet.

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Produkt | Spotify-Regeln bewusst überschritten, nur privat | [[0009-spotify-regeln-bewusst-privat\|ADR 0009]] | Entwickler |
| Technik | Raum bleibt öffentlich, Ton nur an sichtbare Spieler | [[0010-offener-raum-ton-nur-an-sichtbare\|ADR 0010]] | Entwickler |
| Prüfen | Review #88: Nr. 1, 2, 3, 6, 7 beheben, Nr. 4 (leere Sichtbaren-Liste nach gescheitertem ersten Abgleich) und Nr. 5 (wartende `hallo` nie aufgeräumt) liegen lassen | Nr. 4 sehr selten und dann ist der ganze Raum gestört, Nr. 5 nur bei gezieltem Angriff schädlich | Entwickler |
| Bauen | Erst Spieleabend, dann Teil 2 des Online-Modus oder Restpunkte | Echter Test zeigt, was wirklich fehlt | Entwickler |
| Technik | Nachgeholte `hallo` per `WeakSet` markieren und beim Verarbeiten prüfen, ob sie noch warten, statt die Warteschlange umzubauen | Kleinster Eingriff, der den Fall „altes hallo überholt neues“ löst | Entwickler |
| Bauen | ADR 0004 und 0008 bekommen nur einen Verweis auf 0009/0010, ihr Status bleibt `akzeptiert` | Sie werden nicht ersetzt, nur genauer gefasst | Entwickler |
| Bauen | PR #88 nach dem Umsetzen der abgestimmten Funde ohne zweites Review gemergt | Funde waren mit dem Entwickler abgestimmt, CI grün | Entwickler |

## Befehle: Supabase und Production prüfen

```bash
(set -a; source .env.local; /usr/bin/curl -s -o /dev/null -w '%{http_code}\n' "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/health" -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
gh api repos/Matzee3007/musik-app/commits/main/status --jq '.statuses[] | "\(.context): \(.state)"'
```

- Der erste Befehl fragt den Gesundheitscheck von Supabase ab, ohne URL und Schlüssel anzuzeigen: `200` heißt, das
  Projekt ist nicht pausiert.
- Der zweite zeigt, ob Vercel den letzten Stand von `main` erfolgreich nach Production gebracht hat.

## Befehle: Fremde Texte auswerten lassen

```bash
/usr/bin/curl -sL -A 'Mozilla/5.0' -o terms.html 'https://developer.spotify.com/terms'
python3 -I html2text.py terms.html policy.html
grep -c -F 'Do not create a game, including trivia quizzes' policy.txt
```

- `curl` lädt die Seite in einen eigenen Ordner im Scratchpad, ein kleines Skript wandelt das HTML in Text um. Den
  Text liest nur der Agent `quellen-leser` (Regel „Fremde Inhalte lesen lassen“).
- `grep -c -F` zählt, wie oft ein Satz wörtlich vorkommt. So prüft die Hauptsitzung die Zitate aus dem Bericht, ohne
  den ganzen Text zu lesen.

## Befehle: Review und Sicherheitshinweis

```bash
gh pr checks 88 --watch --interval 20
gh api repos/Matzee3007/musik-app/dependabot/alerts/1 --jq '{paket: .dependency.package.name, scope: .dependency.scope, schwere: .security_advisory.severity}'
```

- `gh pr checks --watch` wartet, bis alle Prüfungen des PRs fertig sind.
- Der zweite Befehl zeigt den Sicherheitshinweis, den GitHub beim Push meldete: `minimatch`, mittlere Schwere, nur
  Entwicklungs-Abhängigkeit (über ESLint), also nicht in der App bei den Spielern.

## Neu gelernt

### Spotify Developer Policy

Die Regeln, die Spotify für Apps mit Web API und Web Playback SDK aufstellt. Sie verbieten wörtlich Spiele
„including trivia quizzes“, Ton „from a single source to several simultaneous listeners“ und Abspielen ohne Cover und
Metadaten. Eine Ausnahme für private Nutzung gibt es nicht. Das wahrscheinlichste Risiko ist eine Sperre der
Client-ID.

### Öffentlicher Kanal und fälschbare Absender

Einem öffentlichen Kanal von Supabase Realtime kann jeder mit dem publishable key beitreten, und der steht im
JavaScript der Seite. Jede Nachricht darin ist fälschbar, auch das Feld `von`. Eine Prüfung „nur an Sichtbare“ hält
deshalb nur einfache Lauscher fern. Echten Schutz gäbe es nur mit Anmeldung und einem privaten Kanal.

### Warteschlange und nachgeholte Signale

WebRTC-Signale müssen der Reihe nach verarbeitet werden. Ein aufgeschobenes `hallo` geht deshalb über dieselbe Reihe
(`einreihen`). Steht dort schon ein neueres `hallo` desselben Geräts, darf das alte nicht mehr gelten, sonst schließt
es die frische Verbindung. Ein `WeakSet` merkt sich, welche Signale nachgeholt sind, ohne dass jemand es aufräumen
muss.

## Fehler und Lösungen

### `'sichtbar' is never reassigned. Use 'const' instead  prefer-const`

- **Wo:** Prettier-Hook nach einem Edit an `lib/raum/ton.ts`, mitten in einer Folge von Edits.
- **Ursache:** Der Hook prüfte einen Zwischenstand: Die Zeile, die `sichtbar` neu zuweist, kam erst mit dem
  nächsten Edit.
- **Lösung:** Restliche Edits ausführen, kein eigener Fix nötig.
- **Prüfen:** `npm run check` mit Exit-Code 0.

## Aus dem Chat

-

## Offene Fragen

- Wie lief der Online-Spieleabend? Bekam jeder Ton, riss er bei jemandem immer wieder ab, passten Tisch und Karte auf
  die Bildschirme?
- `minimatch` (Dependabot-Hinweis Nr. 1, laut letzter Übergabe auch 10 moderate Meldungen von `npm audit`, in dieser
  Session nicht neu gezählt) liegen lassen? Noch nicht entschieden.

## Nächste Schritte

1. Ergebnis des Spieleabends auswerten, Fehler mit `fehler-diagnose` eingrenzen.
2. Teil 2 des Online-Modus mit `plan-schreiben` planen (Notizen in der Auflösung).
3. Review-Funde Nr. 4 und 5 aus PR #88 bei Gelegenheit.
