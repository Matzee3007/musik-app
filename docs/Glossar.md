---
titel: Glossar
status: aktiv
erstellt: 2026-10-18
tags: [glossar, fachbegriffe]
---

# Glossar

Fachbegriffe der Musik-App, eines Nachbaus von Hitster Bingo als Web-App für Spieleabende mit Freunden.
Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]]. Technische Abkürzungen stehen in `~/claude-ecosystem/docs/Abkürzungen.md`.

## Begriffe

**Raum**:
Der virtuelle Ort eines Spieleabends, dem die Spieler mit einem Raum-Code von ihrem Handy aus beitreten.
_Nicht verwenden_: Lobby, Session

**Ausschnitt**:
Der Teil eines Songs, der in einer Runde abgespielt wird, wahlweise eine einstellbare Länge oder der ganze Song.
_Nicht verwenden_: Preview, Vorschau

## Ablauf

**Spieleabend**:
Mehrere Spiele mit denselben Leuten im selben Raum; über ihn zählt das Scoreboard die Siege.

**Spiel**:
Alle Runden vom Austeilen der Karten bis zum Bingo.
_Nicht verwenden_: Partie, Runde

**Runde**:
Ein Durchgang aus Rad drehen, einem Song, Aufschreiben und Auflösung.
_Nicht verwenden_: Zug, Song (für den Durchgang)

**Auflösung**:
Der Moment, in dem der Tisch nach „Lösung anzeigen“ die Lösung der Runde zeigt: die Lösung der gedrehten Kategorie
hervorgehoben, die übrigen Angaben zum Song als Zusatzinfo.
_Nicht verwenden_: Reveal, Aufdecken

**Stapel**:
Die Songs, die in diesem Spiel noch nicht gelaufen sind; ist er leer, mischt der DJ neu oder wählt eine andere
Playlist.
_Nicht verwenden_: Queue, Warteschlange

**Bingo**:
Fünf abgehakte Felder in einer Reihe auf einer Karte, waagerecht, senkrecht oder diagonal; wer es zuerst hat, gewinnt
das Spiel.

**Stechen**:
Eine einstellbare Verlängerung, wenn mehrere Spieler in derselben Runde Bingo haben: Nur sie spielen weiter, und wer
als Einziger richtig liegt, gewinnt. Standard ist, dass alle mit Bingo gemeinsam gewinnen.

**Vorbereiten**:
Eine Playlist einmalig laden, die Erscheinungsjahre ihrer Songs ermitteln und speichern; danach ist sie spielbereit.
Songs, die sich nicht abspielen lassen (Podcast-Folgen, lokale Dateien), werden dabei übersprungen.

**Demo**:
Ein Spiel ohne Spotify-Anmeldung mit der festen Songliste aus Phase 1 und ohne Musik, zum Ausprobieren und Testen.
_Nicht verwenden_: Offline-Modus, Testmodus

## Rollen und Geräte

**Tisch**:
Das gemeinsame Gerät (meist der Laptop), das Rad, Musik und Auflösung zeigt; es hat keine Karte.
_Nicht verwenden_: Host, Spielbrett

**DJ**:
Die Person, die den Raum eröffnet, sich bei Spotify anmeldet und den Tisch bedient; sie kann zusätzlich als Spieler
beitreten.
_Nicht verwenden_: Spielleiter, Admin

**Spieler**:
Eine Person, die mit Karte und Notizfläche auf dem eigenen Handy mitspielt.
_Nicht verwenden_: Mitspieler, User

## Karte und Kategorien

**Erscheinungsjahr**:
Das Jahr, in dem die Aufnahme eines Songs zum ersten Mal veröffentlicht wurde, ermittelt über MusicBrainz und vom DJ
korrigierbar; nicht das Jahr des Albums, auf dem der Song bei Spotify liegt.
_Nicht verwenden_: Original-Jahr, Album-Jahr

**Kategorie**:
Die Art der Frage einer Runde, z. B. Titel oder Jahr ±3, mit eigener Farbe; das Rad wählt sie zufällig.

**Karte**:
Das 5×5-Raster eines Spielers, auf dem jede der fünf Kategorien genau fünfmal zufällig verteilt ist; jede Karte ist
anders.
_Nicht verwenden_: Scorecard, Bingo-Karte (im Code)

**Feld**:
Ein Kästchen der Karte in der Farbe einer Kategorie; wer in einer Runde richtig liegt, hakt ein freies Feld dieser
Kategorie nach eigener Wahl ab.

**Notizfläche**:
Ein Textfeld auf dem Handy des Spielers, in das er seine Antwort tippt; es lässt sich abschalten, wenn auf Papier
geschrieben wird.
_Nicht verwenden_: Antwortfeld, Eingabe
