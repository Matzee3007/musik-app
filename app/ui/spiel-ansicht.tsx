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
import type { Abspieler } from "@/lib/spotify/player";
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
  } | null>(null);
  // Gilt ab dem nächsten Song, der laufende behält seine Länge.
  const [ausschnitt, setAusschnitt] = useState<Ausschnitt>(STANDARD_AUSSCHNITT);
  // Beendet den Ausschnitt: Song pausieren, Musikspur anhalten.
  const zeitgeber = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Die Musikspur läuft, nach dauerMs pausiert der Song (null: läuft ganz).
  function ausschnittLaeuft(dauerMs: number | null) {
    // Ein Zeitgeber vom vorigen Song darf den neuen nicht anhalten.
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    setMusik((m) => ({
      laeuft: true,
      vorbei: false,
      dauerMs,
      start: (m?.start ?? 0) + 1,
    }));
    if (dauerMs !== null) {
      zeitgeber.current = setTimeout(() => {
        abspieler?.pausieren();
        setMusik((m) => m && { ...m, laeuft: false, vorbei: true });
      }, dauerMs);
    }
  }

  function songStarten() {
    if (!abspieler || !spiel?.runde) return;
    abspieler.abspielen(spiel.runde.song.id);
    ausschnittLaeuft(ausschnittMs(ausschnitt));
  }

  // Derselbe Song, derselbe Ausschnitt von vorn.
  function nochmal() {
    abspieler?.vonVorn();
    ausschnittLaeuft(musik?.dauerMs ?? null);
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

  // Beim Aufdecken hört die Musik auf, "Weiterhören" in der Auflösung spielt sie weiter.
  function loesungZeigen() {
    if (!spiel) return;
    setSpiel(loesungAnzeigen(spiel));
    if (!musik?.laeuft) return;
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    abspieler?.pausieren();
    setMusik({ ...musik, laeuft: false, vorbei: true });
  }

  // Bei Bingo ist das Spiel vorbei, die Musik hört auf.
  function musikAnhalten() {
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    abspieler?.pausieren();
    setMusik(null);
  }

  function weiterhoeren() {
    abspieler?.fortsetzen();
    setMusik((m) => ({
      laeuft: true,
      vorbei: false,
      dauerMs: null,
      start: (m?.start ?? 0) + 1,
    }));
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
        onRadDrehen={() => setSpiel(rundeStarten(spiel, zufall))}
        onLoesungAnzeigen={loesungZeigen}
        onVonVorn={() => setSpiel(stapelNeuMischen(spiel, spielSongs, zufall))}
        onNeuesSpiel={() => setSpiel(spielStarten(spielSongs, zufall))}
        onRadSteht={songStarten}
        onJahrKorrigieren={onJahrKorrigiert && jahrKorrigiert}
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
