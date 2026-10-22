import { expect, test } from "vitest";
import { KATEGORIEN } from "@/lib/kategorien";
import {
  abhaken,
  feldFrei,
  karteFuer,
  spielerStand,
  zuruecknehmen,
  type HandyKarte,
} from "@/lib/raum/handy-karte";
import type { TischStand } from "@/lib/raum/stand";

// Ungemischt: Felder 0 bis 4 sind Titel, 5 bis 9 Interpret, 10 bis 14 Jahrzehnt usw.
const handy: HandyKarte = {
  spiel: "s1",
  karte: KATEGORIEN.flatMap((k) =>
    Array.from({ length: 5 }, () => ({ kategorie: k.id, abgehakt: false })),
  ),
  abgehakt: null,
};

// Runde 3, Titel, aufgelöst.
const stand: TischStand = {
  spiel: "s1",
  runde: { nummer: 3, kategorie: "titel", aufgeloest: true },
  bingo: [],
};

test("vor der Auflösung ist kein Feld frei", () => {
  const vorher = { ...stand, runde: { ...stand.runde!, aufgeloest: false } };
  expect(feldFrei(handy, vorher, 0)).toBe(false);
});

test("ohne Runde ist kein Feld frei", () => {
  expect(feldFrei(handy, { ...stand, runde: null }, 0)).toBe(false);
});

test("nach der Auflösung sind nur die Felder der gedrehten Kategorie frei", () => {
  expect(feldFrei(handy, stand, 0)).toBe(true);
  expect(feldFrei(handy, stand, 4)).toBe(true);
  expect(feldFrei(handy, stand, 5)).toBe(false);
});

test("abhaken merkt sich die Runde, ein zweites Feld geht nicht", () => {
  const nach = abhaken(handy, stand, 0);
  expect(nach.karte[0].abgehakt).toBe(true);
  expect(nach.abgehakt).toEqual({ runde: 3, feld: 0 });
  expect(feldFrei(nach, stand, 1)).toBe(false);
  expect(abhaken(nach, stand, 1)).toBe(nach);
});

test("in der nächsten Runde ist wieder ein Feld frei, das abgehakte nicht", () => {
  const nach = abhaken(handy, stand, 0);
  const runde4 = { ...stand, runde: { ...stand.runde!, nummer: 4 } };
  expect(feldFrei(nach, runde4, 0)).toBe(false);
  expect(feldFrei(nach, runde4, 1)).toBe(true);
});

test("abhaken eines Felds, das nicht frei ist, ändert nichts", () => {
  expect(abhaken(handy, stand, 5)).toBe(handy);
});

test("zuruecknehmen des Felds dieser Runde gibt die Runde wieder frei", () => {
  const zurueck = zuruecknehmen(abhaken(handy, stand, 0), stand, 0);
  expect(zurueck.karte[0].abgehakt).toBe(false);
  expect(zurueck.abgehakt).toBeNull();
  expect(feldFrei(zurueck, stand, 1)).toBe(true);
});

test("zuruecknehmen eines Felds aus einer früheren Runde lässt diese Runde gesperrt", () => {
  const runde4 = { ...stand, runde: { ...stand.runde!, nummer: 4 } };
  const beide = abhaken(abhaken(handy, stand, 0), runde4, 1);
  const zurueck = zuruecknehmen(beide, runde4, 0);
  expect(zurueck.karte[0].abgehakt).toBe(false);
  expect(zurueck.abgehakt).toEqual({ runde: 4, feld: 1 });
});

test("zuruecknehmen nach einem Bingo im Spiel geht nicht", () => {
  const nach = abhaken(handy, stand, 0);
  expect(zuruecknehmen(nach, { ...stand, bingo: ["Ben"] }, 0)).toBe(nach);
});

test("zuruecknehmen eines nicht abgehakten Felds ändert nichts", () => {
  expect(zuruecknehmen(handy, stand, 0)).toBe(handy);
});

test("karteFuer behält die Karte desselben Spiels", () => {
  expect(karteFuer(handy, "s1")).toBe(handy);
});

test("karteFuer teilt ohne Karte oder für ein anderes Spiel neu aus", () => {
  const neu = karteFuer(abhaken(handy, stand, 0), "s2", () => 0);
  expect(neu.spiel).toBe("s2");
  expect(neu.karte).toHaveLength(25);
  expect(neu.karte.every((f) => !f.abgehakt)).toBe(true);
  expect(neu.abgehakt).toBeNull();
  expect(karteFuer(null, "s1").spiel).toBe("s1");
});

test("spielerStand zählt die Haken und erkennt Bingo", () => {
  expect(spielerStand(abhaken(handy, stand, 0))).toEqual({
    spiel: "s1",
    abgehakt: 1,
    bingo: false,
  });
  // Felder 0 bis 4 sind die erste Zeile.
  const zeile = {
    ...handy,
    karte: handy.karte.map((f, i) => ({ ...f, abgehakt: i < 5 })),
  };
  expect(spielerStand(zeile)).toEqual({
    spiel: "s1",
    abgehakt: 5,
    bingo: true,
  });
});
