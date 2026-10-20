import { hatBingo } from "@/lib/bingo";
import { feldSetzen, karteAusteilen, type Karte } from "@/lib/karte";
import { KATEGORIEN, type Kategorie } from "@/lib/kategorien";
import { radDrehen } from "@/lib/rad";
import type { Song } from "@/lib/song";
import { mischen, type Zufall } from "@/lib/zufall";

export type Runde = {
  nummer: number;
  kategorie: Kategorie;
  song: Song;
  aufgeloest: boolean;
  // Pro Runde hakt man höchstens ein Feld ab.
  abgehaktesFeld: number | null;
};

export type Spiel = {
  karte: Karte;
  // Die Songs, die in diesem Spiel noch nicht gelaufen sind.
  stapel: Song[];
  runde: Runde | null;
};

// Alle Spielzüge geben das Spiel unverändert zurück, wenn der Zug nicht erlaubt ist.

export function spielStarten(
  songs: readonly Song[],
  zufall: Zufall = Math.random,
): Spiel {
  return {
    karte: karteAusteilen(
      KATEGORIEN.map((k) => k.id),
      zufall,
    ),
    stapel: mischen(songs, zufall),
    runde: null,
  };
}

export function rundeStarten(
  spiel: Spiel,
  zufall: Zufall = Math.random,
): Spiel {
  const { runde, stapel, karte } = spiel;
  if (runde && !runde.aufgeloest) return spiel;
  if (stapel.length === 0 || hatBingo(karte)) return spiel;

  const [song, ...rest] = stapel;
  return {
    ...spiel,
    stapel: rest,
    runde: {
      nummer: (runde?.nummer ?? 0) + 1,
      kategorie: radDrehen(KATEGORIEN, zufall),
      song,
      aufgeloest: false,
      abgehaktesFeld: null,
    },
  };
}

export function loesungAnzeigen(spiel: Spiel): Spiel {
  if (!spiel.runde) return spiel;
  return { ...spiel, runde: { ...spiel.runde, aufgeloest: true } };
}

export function feldAbhaken(spiel: Spiel, index: number): Spiel {
  const { runde, karte } = spiel;
  const feld = karte[index];
  if (!runde?.aufgeloest || runde.abgehaktesFeld !== null) return spiel;
  if (!feld || feld.abgehakt || feld.kategorie !== runde.kategorie.id)
    return spiel;

  return {
    ...spiel,
    karte: feldSetzen(karte, index, true),
    runde: { ...runde, abgehaktesFeld: index },
  };
}

export function abhakenZuruecknehmen(spiel: Spiel, index: number): Spiel {
  const { runde } = spiel;
  return {
    ...spiel,
    karte: feldSetzen(spiel.karte, index, false),
    runde:
      runde?.abgehaktesFeld === index
        ? { ...runde, abgehaktesFeld: null }
        : runde,
  };
}

export function stapelNeuMischen(
  spiel: Spiel,
  songs: readonly Song[],
  zufall: Zufall = Math.random,
): Spiel {
  return { ...spiel, stapel: mischen(songs, zufall) };
}

// Der DJ korrigiert in der Auflösung das Jahr eines Songs, in der Runde und im Stapel.
export function jahrKorrigieren(
  spiel: Spiel,
  songId: string,
  jahr: number,
): Spiel {
  const korrigiert = (song: Song) =>
    song.id === songId ? { ...song, jahr } : song;
  const { runde } = spiel;
  return {
    ...spiel,
    stapel: spiel.stapel.map(korrigiert),
    runde: runde && { ...runde, song: korrigiert(runde.song) },
  };
}
