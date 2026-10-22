import type { KategorieId } from "@/lib/kategorien";
import type { Anwesend } from "@/lib/raum/spieler";
import type { Runde } from "@/lib/spiel";

// Was der Tisch in seinem Presence-Eintrag zeigt (ADR 0005). spiel ist die Kennung des Spiels, neu bei jedem
// neuen Spiel. bingo nennt alle Spieler mit Bingo in diesem Spiel.
export type TischStand = {
  spiel: string;
  runde: { nummer: number; kategorie: KategorieId; aufgeloest: boolean } | null;
  bingo: string[];
};

// Was ein Handy in seinem Presence-Eintrag zeigt.
export type SpielerStand = { spiel: string; abgehakt: number; bingo: boolean };

// Die Runde ohne Song: Die Handys sollen die Lösung nicht sehen.
export function tischStand(
  spiel: string,
  runde: Runde | null,
  bingo: string[],
): TischStand {
  return {
    spiel,
    runde: runde && {
      nummer: runde.nummer,
      kategorie: runde.kategorie.id,
      aufgeloest: runde.aufgeloest,
    },
    bingo,
  };
}

export function tischStandLesen(
  anwesende: readonly Anwesend[],
): TischStand | null {
  for (const a of anwesende) {
    if (a.rolle === "tisch" && a.stand) return a.stand;
  }
  return null;
}

// Wer einmal Bingo hatte, bleibt in der Liste, auch wenn er danach die Verbindung verliert.
export function bingoNamen(
  bisher: readonly string[],
  anwesende: readonly Anwesend[],
  spiel: string,
): string[] {
  const namen = [...bisher];
  for (const a of anwesende) {
    if (
      a.rolle === "spieler" &&
      a.stand?.spiel === spiel &&
      a.stand.bingo &&
      !namen.includes(a.name)
    ) {
      namen.push(a.name);
    }
  }
  return namen;
}

// Presence-Einträge kommen von anderen Geräten, etwa einer älteren Fassung der App: Form prüfen, bevor
// ein Stand zählt.
export function istTischStand(wert: unknown): wert is TischStand {
  const s = wert as TischStand | null;
  const r = s?.runde;
  return (
    typeof s?.spiel === "string" &&
    Array.isArray(s.bingo) &&
    s.bingo.every((n) => typeof n === "string") &&
    (r === null ||
      (typeof r?.nummer === "number" &&
        typeof r.kategorie === "string" &&
        typeof r.aufgeloest === "boolean"))
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
