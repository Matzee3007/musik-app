"use client";

import { useRef, useState } from "react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
import Tisch from "@/app/ui/tisch";
import {
  AUSSCHNITTE,
  STANDARD_AUSSCHNITT,
  ausschnittMs,
  ausschnittName,
  type Ausschnitt,
} from "@/lib/ausschnitt";
import { hatBingo } from "@/lib/bingo";
import type { Song } from "@/lib/song";
import {
  abhakenZuruecknehmen,
  feldAbhaken,
  jahrKorrigieren,
  loesungAnzeigen,
  rundeStarten,
  spielStarten,
  stapelNeuMischen,
  type Spiel,
} from "@/lib/spiel";
import { PlayerFehler, type Abspieler } from "@/lib/spotify/player";
import type { Zufall } from "@/lib/zufall";

export default function SpielAnsicht({
  songs,
  zufall = Math.random,
  sofort = false,
  abspieler,
  onJahrKorrigiert,
}: {
  songs: readonly Song[];
  zufall?: Zufall;
  // Ohne eigenen Knopf starten, wenn schon vorher geklickt wurde (z. B. in der Songliste).
  sofort?: boolean;
  // Mit Spotify läuft zu jeder Runde der Song, ohne (Demo) nicht.
  abspieler?: Abspieler;
  // Nur mit Spotify: Eine Korrektur aus der Auflösung wird dauerhaft gespeichert.
  onJahrKorrigiert?: (songId: string, jahr: number) => void;
}) {
  // Startet sonst erst nach dem Klick: Zufall beim ersten Rendern gäbe auf Server und
  // Browser verschiedene Karten (Hydration-Fehler). Mit sofort erscheint die Ansicht erst nach
  // einem Klick, nie beim ersten Rendern auf dem Server.
  // Eigene Liste für "Von vorn" und "Neues Spiel", damit Korrekturen aus der Auflösung erhalten bleiben.
  const [spielSongs, setSpielSongs] = useState(songs);
  const [spiel, setSpiel] = useState<Spiel | null>(() =>
    sofort ? spielStarten(songs, zufall) : null,
  );

  const [musik, setMusik] = useState<{
    laeuft: boolean;
    vorbei: boolean;
    dauerMs: number | null;
    // Zählt jeden Start (Song, Nochmal, Weiterhören), damit die Musikspur neu beginnt.
    start: number;
    // Der Start ist gescheitert (z. B. kein Netz), die Musik steht.
    fehler: boolean;
  } | null>(null);
  // Ein Befehl an Spotify ist gescheitert, das Spiel geht weiter. Gilt bis zum nächsten Start.
  const [meldung, setMeldung] = useState<string | null>(null);
  // Gilt ab dem nächsten Song, der laufende behält seine Länge.
  const [ausschnitt, setAusschnitt] = useState<Ausschnitt>(STANDARD_AUSSCHNITT);
  // Beendet den Ausschnitt: Song pausieren, Musikspur anhalten.
  const zeitgeber = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Nummer des letzten Starts. Ein später Fehler eines Befehls von einem älteren Start zählt nicht mehr.
  const startNr = useRef(0);

  // Neuer Start: Musikspur von vorn, eine alte Meldung verschwindet.
  function neuerStart(): number {
    startNr.current += 1;
    setMeldung(null);
    return startNr.current;
  }

  // Die Musikspur läuft, nach dauerMs pausiert der Song (null: läuft ganz).
  function ausschnittLaeuft(dauerMs: number | null): number {
    // Ein Zeitgeber vom vorigen Song darf den neuen nicht anhalten.
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    const nr = neuerStart();
    setMusik({
      laeuft: true,
      vorbei: false,
      dauerMs,
      start: nr,
      fehler: false,
    });
    if (dauerMs !== null) {
      zeitgeber.current = setTimeout(() => {
        abspieler?.pausieren().catch(spotifyFehler(nr, false));
        setMusik((m) => m && { ...m, laeuft: false, vorbei: true });
      }, dauerMs);
    }
    return nr;
  }

  // Fehlerbehandlung für einen Befehl, der zum Start nr gehört. Ist ein Start gescheitert, steht die Musik.
  function spotifyFehler(nr: number, start: boolean) {
    return (fehler: unknown) => {
      if (nr !== startNr.current) return;
      setMeldung(
        fehler instanceof PlayerFehler
          ? fehler.message
          : "Spotify nicht erreichbar.",
      );
      if (!start) return;
      if (zeitgeber.current) clearTimeout(zeitgeber.current);
      setMusik((m) => m && { ...m, laeuft: false, vorbei: true, fehler: true });
    };
  }

  function songStarten() {
    if (!abspieler || !spiel?.runde) return;
    const nr = ausschnittLaeuft(ausschnittMs(ausschnitt));
    abspieler.abspielen(spiel.runde.song.id).catch(spotifyFehler(nr, true));
  }

  // Derselbe Song, derselbe Ausschnitt von vorn. Ist der Start gescheitert, lief vielleicht nie
  // ein Song, dann neu abspielen statt nur an den Anfang springen.
  function nochmal() {
    if (!abspieler || !spiel?.runde) return;
    const nr = ausschnittLaeuft(musik?.dauerMs ?? null);
    const befehl = musik?.fehler
      ? abspieler.abspielen(spiel.runde.song.id)
      : abspieler.vonVorn();
    befehl.catch(spotifyFehler(nr, true));
  }

  function jahrKorrigiert(jahr: number) {
    if (!spiel?.runde) return;
    const songId = spiel.runde.song.id;
    setSpiel(jahrKorrigieren(spiel, songId, jahr));
    setSpielSongs((alt) =>
      alt.map((s) => (s.id === songId ? { ...s, jahr } : s)),
    );
    onJahrKorrigiert?.(songId, jahr);
  }

  // Beim Drehen hört ein noch laufender Song sofort auf, der nächste startet, wenn das Rad steht.
  function radDrehen() {
    if (!spiel) return;
    setSpiel(rundeStarten(spiel, zufall));
    if (musik?.laeuft) musikAnhalten();
  }

  // Beim Aufdecken hört die Musik auf, "Weiterhören" in der Auflösung spielt sie weiter.
  function loesungZeigen() {
    if (!spiel) return;
    setSpiel(loesungAnzeigen(spiel));
    if (!musik?.laeuft) return;
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    abspieler?.pausieren().catch(spotifyFehler(startNr.current, false));
    setMusik({ ...musik, laeuft: false, vorbei: true });
  }

  // Bei Bingo ist das Spiel vorbei, die Musik hört auf.
  function musikAnhalten() {
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    abspieler?.pausieren().catch(spotifyFehler(startNr.current, false));
    setMusik(null);
  }

  function weiterhoeren() {
    const nr = neuerStart();
    abspieler?.fortsetzen().catch(spotifyFehler(nr, true));
    setMusik({
      laeuft: true,
      vorbei: false,
      dauerMs: null,
      start: nr,
      fehler: false,
    });
  }

  if (!spiel) {
    return (
      <button
        className="rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background"
        onClick={() => setSpiel(spielStarten(spielSongs, zufall))}
      >
        Spiel starten
      </button>
    );
  }

  const spielfeld = (
    <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
      <Tisch
        runde={spiel.runde}
        stapelLeer={spiel.stapel.length === 0}
        bingo={hatBingo(spiel.karte)}
        onRadDrehen={radDrehen}
        onLoesungAnzeigen={loesungZeigen}
        onVonVorn={() => setSpiel(stapelNeuMischen(spiel, spielSongs, zufall))}
        onNeuesSpiel={() => setSpiel(spielStarten(spielSongs, zufall))}
        onRadSteht={songStarten}
        onJahrKorrigieren={onJahrKorrigiert && jahrKorrigiert}
        meldung={meldung}
        musik={
          musik
            ? { ...musik, onNochmal: nochmal, onWeiterhoeren: weiterhoeren }
            : undefined
        }
      />
      <KarteAnsicht
        karte={spiel.karte}
        onFeldKlick={(index) => {
          if (!spiel.karte[index].abgehakt) {
            const neu = feldAbhaken(spiel, index);
            setSpiel(neu);
            if (hatBingo(neu.karte)) musikAnhalten();
          } else if (window.confirm("Abhaken zurücknehmen?")) {
            setSpiel(abhakenZuruecknehmen(spiel, index));
          }
        }}
      />
    </div>
  );

  if (!abspieler) return spielfeld;
  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-4">
      <label className="flex items-center gap-2">
        Ausschnitt
        <select
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700"
          value={String(ausschnitt)}
          onChange={(e) =>
            setAusschnitt(
              AUSSCHNITTE.find((a) => String(a) === e.target.value)!,
            )
          }
        >
          {AUSSCHNITTE.map((a) => (
            <option key={a} value={String(a)}>
              {ausschnittName(a)}
            </option>
          ))}
        </select>
      </label>
      {spielfeld}
    </div>
  );
}
