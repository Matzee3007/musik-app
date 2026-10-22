import type { KategorieId } from "@/lib/kategorien";
import type { Runde } from "@/lib/spiel";

// Was der Tisch per Nachricht schickt (ADR 0006). spiel ist die Kennung des Spiels, neu bei jedem
// neuen Spiel. bingo nennt alle Spieler mit Bingo in diesem Spiel.
export type TischStand = {
  spiel: string;
  runde: { nummer: number; kategorie: KategorieId; aufgeloest: boolean } | null;
  bingo: string[];
};

// Was ein Handy per Nachricht schickt.
export type SpielerStand = { spiel: string; abgehakt: number; bingo: boolean };

// Je Spielername der zuletzt gemeldete Stand.
export type SpielerStaende = Record<string, SpielerStand>;

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
