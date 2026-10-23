"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
import Knopf from "@/app/ui/knopf";
import Tisch from "@/app/ui/tisch";
import {
  AUSSCHNITTE,
  STANDARD_AUSSCHNITT,
  ausschnittMs,
  ausschnittName,
  type Ausschnitt,
} from "@/lib/ausschnitt";
import { hatBingo } from "@/lib/bingo";
import type { RaumKanal } from "@/lib/raum/kanal";
import { bingoNamen, tischStand, type TischStand } from "@/lib/raum/stand";
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
  raum,
}: {
  songs: readonly Song[];
  zufall?: Zufall;
  // Ohne eigenen Knopf starten, wenn schon vorher geklickt wurde (z. B. in der Songliste).
  sofort?: boolean;
  // Mit Spotify läuft zu jeder Runde der Song, ohne (Demo) nicht.
  abspieler?: Abspieler;
  // Nur mit Spotify: Eine Korrektur aus der Auflösung wird dauerhaft gespeichert.
  onJahrKorrigiert?: (songId: string, jahr: number) => void;
  // Im Raum spielen die Spieler am Handy: Der Tisch meldet seinen Stand, statt der Karte zählen ihre Bingos.
  // onStand(null): Die Spielansicht ist weg, die Handys warten auf das nächste Spiel.
  raum?: { kanal: RaumKanal; onStand: (stand: TischStand | null) => void };
}) {
  // Startet sonst erst nach dem Klick: Zufall beim ersten Rendern gäbe auf Server und
  // Browser verschiedene Karten (Hydration-Fehler). Mit sofort erscheint die Ansicht erst nach
  // einem Klick, nie beim ersten Rendern auf dem Server.
  // Eigene Liste für "Von vorn" und "Neues Spiel", damit Korrekturen aus der Auflösung erhalten bleiben.
  const [spielSongs, setSpielSongs] = useState(songs);
  const [spiel, setSpiel] = useState<Spiel | null>(() =>
    sofort ? spielStarten(songs, zufall) : null,
  );
  // Nur im Raum: Kennung des Spiels und die Spieler mit Bingo darin.
  // Ohne Raum keine Kennung: randomUUID gibt es nur auf sicheren Seiten, nicht unter http im Heimnetz.
  const [spielId, setSpielId] = useState(() =>
    raum ? crypto.randomUUID() : "",
  );
  const [bingo, setBingo] = useState<string[]>([]);

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
  // Der DJ hat angehalten, oder die Musik hört auf. Kommt ein Befehl zum Abspielen erst danach bei Spotify an,
  // hat die Pause ihn überholt: dann noch einmal pausieren.
  const angehalten = useRef(false);

  // Neuer Start oder neue Runde: Musikspur von vorn, eine alte Meldung verschwindet.
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
        pausieren(nr);
        setMusik((m) => m && { ...m, laeuft: false, vorbei: true });
      }, dauerMs);
    }
    return nr;
  }

  // Ein Befehl zum Abspielen. Ist inzwischen angehalten, pausiert der Song gleich wieder.
  function startBefehl(befehl: Promise<void>, nr: number) {
    angehalten.current = false;
    befehl.then(
      () => {
        if (angehalten.current) pausieren(nr);
      },
      spotifyFehler(nr, true),
    );
  }

  function pausieren(nr: number) {
    abspieler?.pausieren().catch(spotifyFehler(nr, false));
  }

  // Das Ende des Ausschnitts entfällt, der Song pausiert.
  function stoppen() {
    if (zeitgeber.current) clearTimeout(zeitgeber.current);
    angehalten.current = true;
    pausieren(startNr.current);
  }

  // Fehlerbehandlung für einen Befehl, der zum Start nr gehört. Ist ein Start gescheitert, steht die Musik.
  function spotifyFehler(nr: number, start: boolean) {
    return (fehler: unknown) => {
      if (nr !== startNr.current) return;
      setMeldung(
        fehler instanceof PlayerFehler
          ? fehler.message
          : "Spotify reagiert nicht.",
      );
      if (!start) return;
      if (zeitgeber.current) clearTimeout(zeitgeber.current);
      setMusik((m) => m && { ...m, laeuft: false, vorbei: true, fehler: true });
    };
  }

  function songStarten() {
    if (!abspieler || !spiel?.runde) return;
    const nr = ausschnittLaeuft(ausschnittMs(ausschnitt));
    startBefehl(abspieler.abspielen(spiel.runde.song.id), nr);
  }

  // Derselbe Song, derselbe Ausschnitt von vorn. Ist der Start gescheitert, lief vielleicht nie
  // ein Song, dann neu abspielen statt nur an den Anfang springen.
  function nochmal() {
    if (!abspieler || !spiel?.runde) return;
    const nr = ausschnittLaeuft(musik?.dauerMs ?? null);
    const befehl = musik?.fehler
      ? abspieler.abspielen(spiel.runde.song.id)
      : abspieler.vonVorn();
    startBefehl(befehl, nr);
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
    neuerStart();
  }

  // Der Song steht, "Weiterhören" spielt ihn weiter. Das Ende des Ausschnitts entfällt.
  function anhalten() {
    if (!musik?.laeuft) return;
    stoppen();
    setMusik({ ...musik, laeuft: false, vorbei: true });
  }

  // Beim Aufdecken hört die Musik auf, "Weiterhören" in der Auflösung spielt sie weiter.
  function loesungZeigen() {
    if (!spiel) return;
    setSpiel(loesungAnzeigen(spiel));
    anhalten();
  }

  // Bei Bingo ist das Spiel vorbei, die Musik hört auf.
  function musikAnhalten() {
    stoppen();
    setMusik(null);
  }

  // Ist der Start gescheitert, lief vielleicht nie ein Song, dann neu abspielen statt fortsetzen.
  function weiterhoeren() {
    if (!abspieler || !spiel?.runde) return;
    const nr = neuerStart();
    const befehl = musik?.fehler
      ? abspieler.abspielen(spiel.runde.song.id)
      : abspieler.fortsetzen();
    startBefehl(befehl, nr);
    setMusik({
      laeuft: true,
      vorbei: false,
      dauerMs: null,
      start: nr,
      fehler: false,
    });
  }

  const kanal = raum?.kanal;
  useEffect(() => {
    if (!kanal) return;
    return kanal.beiNachricht((nachricht) => {
      if (nachricht.art !== "spieler") return;
      // Dieselbe Liste, wenn niemand dazukommt: Sonst schickte jede Nachricht einen neuen Stand an alle.
      setBingo((alt) => {
        const neu = bingoNamen(
          alt,
          { [nachricht.name]: nachricht.stand },
          spielId,
        );
        return neu.length === alt.length ? alt : neu;
      });
    });
  }, [kanal, spielId]);

  const standMelden = useEffectEvent((stand: TischStand | null) =>
    raum?.onStand(stand),
  );
  // Zuletzt gemeldeter Stand als Text, damit nur Änderungen, die die Handys sehen, eine Meldung auslösen.
  const gemeldet = useRef<string | null>(null);
  const runde = spiel?.runde ?? null;
  const gestartet = spiel !== null;
  useEffect(() => {
    if (!gestartet) return;
    // Eine Jahreskorrektur ändert die Runde, aber nicht, was die Handys sehen: dann nichts melden.
    const stand = tischStand(spielId, runde, bingo);
    const text = JSON.stringify(stand);
    if (text === gemeldet.current) return;
    gemeldet.current = text;
    standMelden(stand);
  }, [gestartet, spielId, runde, bingo]);

  // Verschwindet die Spielansicht (z. B. Spotify-Anmeldung abgelaufen), gibt es für die Handys kein Spiel mehr.
  useEffect(
    () => () => {
      gemeldet.current = null;
      standMelden(null);
    },
    [],
  );

  // Bei Bingo ist das Spiel vorbei, die Musik hört auf.
  const imRaumBingo = bingo.length > 0;
  const beiBingoAnhalten = useEffectEvent(() => {
    if (musik) musikAnhalten();
  });
  useEffect(() => {
    if (imRaumBingo) beiBingoAnhalten();
  }, [imRaumBingo]);

  function neuesSpiel() {
    setSpiel(spielStarten(spielSongs, zufall));
    if (raum) setSpielId(crypto.randomUUID());
    setBingo([]);
  }

  if (!spiel) {
    return (
      <Knopf onClick={() => setSpiel(spielStarten(spielSongs, zufall))}>
        Spiel starten
      </Knopf>
    );
  }

  const spielfeld = (
    <div
      className={`grid w-full gap-8 ${raum ? "" : "max-w-5xl md:grid-cols-2"}`}
    >
      <Tisch
        runde={spiel.runde}
        stapelLeer={spiel.stapel.length === 0}
        bingo={raum ? imRaumBingo : hatBingo(spiel.karte)}
        gewinner={raum ? bingo : undefined}
        onRadDrehen={radDrehen}
        onLoesungAnzeigen={loesungZeigen}
        onVonVorn={() => setSpiel(stapelNeuMischen(spiel, spielSongs, zufall))}
        onNeuesSpiel={neuesSpiel}
        onRadSteht={songStarten}
        onJahrKorrigieren={onJahrKorrigiert && jahrKorrigiert}
        meldung={meldung}
        musik={
          musik
            ? {
                ...musik,
                onNochmal: nochmal,
                onWeiterhoeren: weiterhoeren,
                onAnhalten: anhalten,
              }
            : undefined
        }
      />
      {/* Im Raum liegen die Karten auf den Handys. */}
      {!raum && (
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
      )}
    </div>
  );

  if (!abspieler) return spielfeld;
  return (
    // Im Raum ohne Breitenbegrenzung: Rad und Abschnitt zur Runde brauchen die ganze Breite.
    <div
      className={`flex w-full flex-col items-center gap-4 ${raum ? "" : "max-w-5xl"}`}
    >
      <label className="flex items-center gap-2 text-licht/70">
        Ausschnitt
        <select
          className="rounded-lg bg-flaeche px-2 py-1 outline-akzent focus-visible:outline-2"
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
