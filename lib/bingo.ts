import type { Karte } from "@/lib/karte";

const NULL_BIS_VIER = [0, 1, 2, 3, 4];

// Die 12 Linien einer 5×5-Karte als Feld-Indizes.
const LINIEN: number[][] = [
  ...NULL_BIS_VIER.map((zeile) => NULL_BIS_VIER.map((s) => zeile * 5 + s)),
  ...NULL_BIS_VIER.map((spalte) => NULL_BIS_VIER.map((z) => z * 5 + spalte)),
  NULL_BIS_VIER.map((i) => i * 6),
  NULL_BIS_VIER.map((i) => (i + 1) * 4),
];

export function hatBingo(karte: Karte): boolean {
  return bingoLinie(karte) !== null;
}

// Die erste volle Linie, damit das Handy sie hervorheben kann.
export function bingoLinie(karte: Karte): number[] | null {
  return LINIEN.find((linie) => linie.every((i) => karte[i].abgehakt)) ?? null;
}
