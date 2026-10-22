import { expect, test } from "vitest";
import { bingoLinie, hatBingo } from "@/lib/bingo";
import { KATEGORIEN } from "@/lib/kategorien";
import { feldSetzen, karteAusteilen, type Karte } from "@/lib/karte";

function abgehakt(...indizes: number[]): Karte {
  return indizes.reduce(
    (karte, i) => feldSetzen(karte, i, true),
    karteAusteilen(KATEGORIEN.map((k) => k.id)),
  );
}

test("leere Karte hat kein Bingo", () => {
  expect(hatBingo(abgehakt())).toBe(false);
});

test("waagerecht: Zeile 2", () => {
  expect(hatBingo(abgehakt(10, 11, 12, 13, 14))).toBe(true);
});

test("senkrecht: Spalte 4", () => {
  expect(hatBingo(abgehakt(4, 9, 14, 19, 24))).toBe(true);
});

test("Diagonale links oben nach rechts unten", () => {
  expect(hatBingo(abgehakt(0, 6, 12, 18, 24))).toBe(true);
});

test("Diagonale rechts oben nach links unten", () => {
  expect(hatBingo(abgehakt(4, 8, 12, 16, 20))).toBe(true);
});

test("vier in einer Reihe sind kein Bingo", () => {
  expect(hatBingo(abgehakt(0, 1, 2, 3))).toBe(false);
});

test("Reihe über den Zeilenumbruch ist kein Bingo", () => {
  expect(hatBingo(abgehakt(3, 4, 5, 6, 7))).toBe(false);
});

test("bingoLinie liefert die volle Reihe", () => {
  expect(bingoLinie(abgehakt(3, 0, 6, 12, 18, 24))).toEqual([0, 6, 12, 18, 24]);
});

test("bingoLinie ohne Bingo ist null", () => {
  expect(bingoLinie(abgehakt(0, 6, 12, 18))).toBeNull();
});
