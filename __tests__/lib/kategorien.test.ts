import { expect, test } from "vitest";
import { KATEGORIEN, type KategorieId } from "@/lib/kategorien";
import type { Song } from "@/lib/song";

const bohemian: Song = {
  id: "x",
  titel: "Bohemian Rhapsody",
  interpret: "Queen",
  jahr: 1975,
};
const loesung = (id: KategorieId, song: Song) =>
  KATEGORIEN.find((k) => k.id === id)!.loesung(song);

test("jede Kategorie zeigt ihre Lösung", () => {
  expect(loesung("titel", bohemian)).toBe("Bohemian Rhapsody");
  expect(loesung("interpret", bohemian)).toBe("Queen");
  expect(loesung("jahrzehnt", bohemian)).toBe("1970er");
  expect(loesung("jahr", bohemian)).toBe("1975");
  expect(loesung("jahrPlusMinus3", bohemian)).toBe("1972 bis 1978");
});

test("Jahrzehnt an der Grenze", () => {
  expect(loesung("jahrzehnt", { ...bohemian, jahr: 1999 })).toBe("1990er");
  expect(loesung("jahrzehnt", { ...bohemian, jahr: 2000 })).toBe("2000er");
});

test("fünf Kategorien mit eigener Id, eigenem Namen und eigener Farbe", () => {
  expect(KATEGORIEN.map((k) => k.name)).toEqual([
    "Titel",
    "Interpret",
    "Jahrzehnt",
    "Jahr",
    "Jahr ±3",
  ]);
  expect(new Set(KATEGORIEN.map((k) => k.id)).size).toBe(5);
  expect(new Set(KATEGORIEN.map((k) => k.farbe)).size).toBe(5);
});

test("Kategorien haben die kräftigen Farben", () => {
  expect(Object.fromEntries(KATEGORIEN.map((k) => [k.id, k.farbe]))).toEqual({
    titel: "#3d8bff",
    interpret: "#ff4f9a",
    jahrzehnt: "#ff8a1f",
    jahr: "#1fd18a",
    jahrPlusMinus3: "#9b6bff",
  });
});
