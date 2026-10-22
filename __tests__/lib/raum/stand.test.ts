import { expect, test } from "vitest";
import { KATEGORIEN } from "@/lib/kategorien";
import type { Anwesend } from "@/lib/raum/spieler";
import { bingoNamen, tischStand, tischStandLesen } from "@/lib/raum/stand";
import { SONGLISTE } from "@/lib/songliste";

test("tischStand nimmt die Kategorie-Id und lässt den Song weg", () => {
  const runde = {
    nummer: 2,
    kategorie: KATEGORIEN[1],
    song: SONGLISTE[0],
    aufgeloest: true,
    abgehaktesFeld: null,
  };
  expect(tischStand("s1", runde, [])).toEqual({
    spiel: "s1",
    runde: { nummer: 2, kategorie: "interpret", aufgeloest: true },
    bingo: [],
  });
  expect(tischStand("s1", null, ["Anna"])).toEqual({
    spiel: "s1",
    runde: null,
    bingo: ["Anna"],
  });
});

const stand = { spiel: "s1", runde: null, bingo: [] };

test("tischStandLesen liefert den Stand des Tischs", () => {
  const anwesende: Anwesend[] = [
    { schluessel: "a", rolle: "spieler", name: "Anna" },
    { schluessel: "t", rolle: "tisch", stand },
  ];
  expect(tischStandLesen(anwesende)).toEqual(stand);
});

test("tischStandLesen liefert null ohne Tisch oder ohne Stand", () => {
  expect(tischStandLesen([])).toBeNull();
  expect(tischStandLesen([{ schluessel: "t", rolle: "tisch" }])).toBeNull();
});

function spieler(
  schluessel: string,
  name: string,
  spiel: string,
  bingo: boolean,
): Anwesend {
  return {
    schluessel,
    rolle: "spieler",
    name,
    stand: { spiel, abgehakt: 5, bingo },
  };
}

test("bingoNamen nimmt neue Bingos dieses Spiels dazu und behält gegangene", () => {
  const anwesende = [
    spieler("b", "Ben", "s1", true),
    spieler("c", "Cem", "alt", true),
    spieler("d", "Dana", "s1", false),
  ];
  expect(bingoNamen(["Anna"], anwesende, "s1")).toEqual(["Anna", "Ben"]);
});

test("bingoNamen nennt jeden nur einmal", () => {
  const ben = spieler("b", "Ben", "s1", true);
  const benNeuGeladen = spieler("b2", "Ben", "s1", true);
  expect(bingoNamen([], [ben, benNeuGeladen], "s1")).toEqual(["Ben"]);
  expect(bingoNamen(["Ben"], [ben], "s1")).toEqual(["Ben"]);
});
