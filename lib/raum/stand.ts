import { KATEGORIEN, type KategorieId } from "@/lib/kategorien";
import type { Song } from "@/lib/song";
import type { Runde } from "@/lib/spiel";

// Was ein Spieler im Online-Modus nach der Auflösung vom Song sieht.
export type SongAngaben = Pick<Song, "titel" | "interpret" | "jahr" | "cover">;

// Was der Tisch per Nachricht schickt (ADR 0006). spiel ist die Kennung des Spiels, neu bei jedem
// neuen Spiel. bingo nennt alle Spieler mit Bingo in diesem Spiel. Im Online-Modus (ADR 0008) sehen die Spieler
// den Tisch selbst: online ist gesetzt, nach der Auflösung kommt song mit. Ältere Fassungen schicken beides nicht.
export type TischStand = {
  spiel: string;
  online?: true;
  runde: {
    nummer: number;
    kategorie: KategorieId;
    aufgeloest: boolean;
    song?: SongAngaben;
  } | null;
  bingo: string[];
};

// Was ein Handy per Nachricht schickt.
export type SpielerStand = { spiel: string; abgehakt: number; bingo: boolean };

// Je Spielername der zuletzt gemeldete Stand.
export type SpielerStaende = Record<string, SpielerStand>;

// Die Runde ohne Song: Lokal brauchen die Handys die Lösung nicht, online erst nach der Auflösung.
export function tischStand(
  spiel: string,
  runde: Runde | null,
  bingo: string[],
  online = false,
): TischStand {
  return {
    spiel,
    ...(online && { online: true }),
    runde: runde && {
      nummer: runde.nummer,
      kategorie: runde.kategorie.id,
      aufgeloest: runde.aufgeloest,
      ...(online &&
        runde.aufgeloest && {
          song: {
            titel: runde.song.titel,
            interpret: runde.song.interpret,
            jahr: runde.song.jahr,
            cover: runde.song.cover,
          },
        }),
    },
    bingo,
  };
}

// Die Runde für den Tisch eines Spielers im Online-Modus. Vor der Auflösung ist der Song leer, der Tisch zeigt ihn
// dann nicht.
export function rundeAusStand(stand: TischStand): Runde | null {
  const { runde } = stand;
  if (!runde) return null;
  return {
    nummer: runde.nummer,
    kategorie: KATEGORIEN.find((k) => k.id === runde.kategorie)!,
    song: { id: "", titel: "", interpret: "", jahr: 0, ...runde.song },
    aufgeloest: runde.aufgeloest,
    abgehaktesFeld: null,
  };
}

// Wer einmal Bingo hatte, bleibt in der Liste, auch wenn er danach die Verbindung verliert.
export function bingoNamen(
  bisher: readonly string[],
  staende: SpielerStaende,
  spiel: string,
): string[] {
  const namen = [...bisher];
  for (const [name, stand] of Object.entries(staende)) {
    if (stand.spiel === spiel && stand.bingo && !namen.includes(name)) {
      namen.push(name);
    }
  }
  return namen;
}

// Nachrichten kommen von anderen Geräten, etwa einer älteren Fassung der App: Form prüfen, bevor ein Stand
// zählt.
export function istTischStand(wert: unknown): wert is TischStand {
  const s = wert as TischStand | null;
  const r = s?.runde;
  return (
    typeof s?.spiel === "string" &&
    (s.online === undefined || s.online === true) &&
    Array.isArray(s.bingo) &&
    s.bingo.every((n) => typeof n === "string") &&
    (r === null ||
      (typeof r?.nummer === "number" &&
        KATEGORIEN.some((k) => k.id === r.kategorie) &&
        typeof r.aufgeloest === "boolean" &&
        (r.song === undefined || istSongAngaben(r.song))))
  );
}

function istSongAngaben(wert: unknown): wert is SongAngaben {
  const s = wert as SongAngaben | null;
  return (
    typeof s?.titel === "string" &&
    typeof s.interpret === "string" &&
    typeof s.jahr === "number" &&
    (s.cover === undefined || typeof s.cover === "string")
  );
}

export function istSpielerStand(wert: unknown): wert is SpielerStand {
  const s = wert as SpielerStand | null;
  return (
    typeof s?.spiel === "string" &&
    typeof s.abgehakt === "number" &&
    typeof s.bingo === "boolean"
  );
}
