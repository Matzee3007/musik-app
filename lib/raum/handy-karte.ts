import { hatBingo } from "@/lib/bingo";
import { feldSetzen, karteNeu, type Karte } from "@/lib/karte";
import { KATEGORIEN } from "@/lib/kategorien";
import type { SpielerStand, TischStand } from "@/lib/raum/stand";
import type { Zufall } from "@/lib/zufall";

// Die Karte eines Spielers am Handy. abgehakt merkt sich, in welcher Runde welches Feld abgehakt wurde:
// pro Runde höchstens eins, auch über Neuladen hinweg.
export type HandyKarte = {
  spiel: string;
  karte: Karte;
  abgehakt: { runde: number; feld: number } | null;
};

export function feldFrei(
  handy: HandyKarte,
  stand: TischStand,
  index: number,
): boolean {
  const { runde } = stand;
  const feld = handy.karte[index];
  if (!runde?.aufgeloest || !feld || feld.abgehakt) return false;
  if (handy.abgehakt?.runde === runde.nummer) return false;
  return feld.kategorie === runde.kategorie;
}

// Unverändert, wenn das Feld nicht frei ist.
export function abhaken(
  handy: HandyKarte,
  stand: TischStand,
  index: number,
): HandyKarte {
  if (!feldFrei(handy, stand, index)) return handy;
  return {
    ...handy,
    karte: feldSetzen(handy.karte, index, true),
    abgehakt: { runde: stand.runde!.nummer, feld: index },
  };
}

// Nach einem Bingo im Spiel nicht mehr. Die eigene Karte zählt auch, denn der Tisch meldet das eigene Bingo
// erst mit Verzögerung zurück, hat es dann aber schon festgehalten.
export function darfZuruecknehmen(
  handy: HandyKarte,
  stand: TischStand,
): boolean {
  return stand.bingo.length === 0 && !hatBingo(handy.karte);
}

// Unverändert, wenn es nicht erlaubt ist oder das Feld nicht abgehakt ist. War es das Feld dieser Runde,
// darf in ihr wieder eins abgehakt werden.
export function zuruecknehmen(
  handy: HandyKarte,
  stand: TischStand,
  index: number,
): HandyKarte {
  if (!darfZuruecknehmen(handy, stand) || !handy.karte[index]?.abgehakt)
    return handy;
  return {
    ...handy,
    karte: feldSetzen(handy.karte, index, false),
    abgehakt: handy.abgehakt?.feld === index ? null : handy.abgehakt,
  };
}

// Die gemerkte Karte, wenn sie zum laufenden Spiel gehört, sonst eine neue: beim Beitritt mitten im
// Spiel und bei jedem neuen Spiel.
export function karteFuer(
  gemerkt: HandyKarte | null,
  spiel: string,
  zufall: Zufall = Math.random,
): HandyKarte {
  if (gemerkt?.spiel === spiel) return gemerkt;
  return {
    spiel,
    karte: karteNeu(zufall),
    abgehakt: null,
  };
}

export function spielerStand(handy: HandyKarte): SpielerStand {
  return {
    spiel: handy.spiel,
    abgehakt: handy.karte.filter((f) => f.abgehakt).length,
    bingo: hatBingo(handy.karte),
  };
}

// Form einer gespeicherten Karte, bevor das Handy ihr traut.
export function istHandyKarte(wert: unknown): wert is HandyKarte {
  const h = wert as HandyKarte | null;
  const a = h?.abgehakt;
  return (
    typeof h?.spiel === "string" &&
    Array.isArray(h.karte) &&
    h.karte.length === 25 &&
    h.karte.every(
      (f) =>
        KATEGORIEN.some((k) => k.id === f?.kategorie) &&
        typeof f.abgehakt === "boolean",
    ) &&
    (a === null || (typeof a?.runde === "number" && typeof a.feld === "number"))
  );
}
