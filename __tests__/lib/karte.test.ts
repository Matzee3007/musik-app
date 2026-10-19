import { expect, test } from "vitest";
import { KATEGORIEN } from "@/lib/kategorien";
import { feldSetzen, karteAusteilen } from "@/lib/karte";
import { zufallsfolge } from "../hilfen/zufallsfolge";

const ids = KATEGORIEN.map((k) => k.id);

test("Karte hat 25 freie Felder, jede Kategorie genau fünfmal", () => {
  const karte = karteAusteilen(ids, zufallsfolge(0.3, 0.8, 0.1));
  expect(karte).toHaveLength(25);
  expect(karte.every((f) => !f.abgehakt)).toBe(true);
  for (const id of ids) {
    expect(karte.filter((f) => f.kategorie === id)).toHaveLength(5);
  }
});

test("anderer Zufall ergibt eine andere Karte", () => {
  expect(karteAusteilen(ids, () => 0)).not.toEqual(
    karteAusteilen(ids, zufallsfolge(0.9, 0.2, 0.6)),
  );
});

test("feldSetzen hakt ein Feld ab und lässt die alte Karte unverändert", () => {
  const karte = karteAusteilen(ids, () => 0);
  const neu = feldSetzen(karte, 7, true);
  expect(neu[7].abgehakt).toBe(true);
  expect(karte[7].abgehakt).toBe(false);
  expect(feldSetzen(neu, 7, false)[7].abgehakt).toBe(false);
});
