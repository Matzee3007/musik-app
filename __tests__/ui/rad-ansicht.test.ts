import { expect, test } from "vitest";
import { radWinkel } from "@/app/ui/rad-ansicht";

// Fünf Segmente zu je 72 Grad, die Mitte von Segment i liegt bei i × 72 + 36.
test("nach der Drehung steht die gewählte Kategorie unter dem Zeiger", () => {
  for (const nummer of [1, 2, 3]) {
    for (const index of [0, 1, 2, 3, 4]) {
      expect((radWinkel(nummer, index, 5) + index * 72 + 36) % 360).toBe(0);
    }
  }
});

test("das Rad dreht jede Runde vorwärts, mindestens vier Umdrehungen", () => {
  expect(radWinkel(2, 0, 5) - radWinkel(1, 4, 5)).toBeGreaterThanOrEqual(1440);
});
