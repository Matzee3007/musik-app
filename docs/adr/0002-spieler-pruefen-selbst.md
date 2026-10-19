---
titel: "ADR 0002: Spieler prüfen ihre Antworten selbst"
status: akzeptiert
erstellt: 2026-10-18
tags: [adr, architektur, spielregeln]
---

# ADR (Architecture Decision Record) 0002: Spieler prüfen ihre Antworten selbst

## Kontext

Die erste Fassung der [[projects/musik-app/docs/Projektvision|Projektvision]] sah vor, dass die App jede Antwort prüft: Jahr, Jahrzehnt und ±3 genau,
Titel und Interpret mit Toleranz für Tippfehler, „feat.“ und Zusätze wie „Remastered“. Beim Schärfen der Vision
(2026-10-18) kam dazu, dass Spieler auch auf echtem Papier schreiben können sollen. Die App sieht deren Antworten
dann gar nicht.

## Entscheidung

Die App prüft keine Antworten. Spieler schreiben in eine freie [[projects/musik-app/docs/Glossar|Notizfläche]] oder auf Papier. Nach der
Auflösung am Tisch vergleicht jeder selbst und hakt auf seinem Handy ein Feld ab, wie beim Original. Grenzfälle
entscheidet die Gruppe. Die App prüft nur, ob eine Karte Bingo hat.

## Alternativen

- **App prüft alle Antworten:** Papier wäre nicht möglich, und die Toleranz bei Titel und Interpret ist aufwendig
  und trotzdem nie ganz richtig („Queen“ vs. „Queen & David Bowie“). Das Original kommt ohne aus.
- **App prüft Jahr, Jahrzehnt und ±3, Titel und Interpret die Gruppe:** zwei Arten zu prüfen, und mit Papier
  geht es wieder nicht.

## Konsequenzen

- Keine Antwortprüfung in der Spiellogik, kein Abgleich mit Tippfehler-Toleranz.
- Die App vertraut den Spielern. Wer falsch abhakt, schummelt, wie am echten Tisch.
- Die Auflösung muss alle Angaben gut lesbar zeigen, weil die Spieler daran prüfen.
- Will man später doch prüfen (z. B. für ein Scoreboard mit Punkten je Antwort), braucht es strukturierte Eingaben
  statt der freien Notizfläche.
