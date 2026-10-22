import { expect, test } from "vitest";
import { KATEGORIEN } from "@/lib/kategorien";
import { bingoNamen, tischStand } from "@/lib/raum/stand";
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

function stand(spiel: string, bingo: boolean) {
  return { spiel, abgehakt: 5, bingo };
}

test("bingoNamen nimmt neue Bingos dieses Spiels dazu und behält gegangene", () => {
  const staende = {
    Ben: stand("s1", true),
    Cem: stand("alt", true),
    Dana: stand("s1", false),
  };
  expect(bingoNamen(["Anna"], staende, "s1")).toEqual(["Anna", "Ben"]);
});

test("bingoNamen nennt jeden nur einmal", () => {
  expect(bingoNamen(["Ben"], { Ben: stand("s1", true) }, "s1")).toEqual([
    "Ben",
  ]);
});
