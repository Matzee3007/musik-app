import { expect, test } from "vitest";
import { KATEGORIEN } from "@/lib/kategorien";
import { radDrehen } from "@/lib/rad";

test("Zufall 0 wählt die erste Kategorie", () => {
  expect(radDrehen(KATEGORIEN, () => 0).id).toBe("titel");
});

test("Zufall knapp unter 1 wählt die letzte Kategorie", () => {
  expect(radDrehen(KATEGORIEN, () => 0.999).id).toBe("jahrPlusMinus3");
});
