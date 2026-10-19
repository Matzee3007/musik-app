import { expect, test } from "vitest";
import { mischen } from "@/lib/zufall";
import { zufallsfolge } from "../hilfen/zufallsfolge";

test("mischen mit Zufall 0 ergibt die Fisher-Yates-Reihenfolge", () => {
  expect(mischen([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
});

test("mischen behält alle Elemente und ändert die Eingabe nicht", () => {
  const liste = [1, 2, 3, 4, 5];
  const gemischt = mischen(liste, zufallsfolge(0.7, 0.1, 0.5));
  expect([...gemischt].sort()).toEqual([1, 2, 3, 4, 5]);
  expect(liste).toEqual([1, 2, 3, 4, 5]);
});
