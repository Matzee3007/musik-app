import { expect, test } from "vitest";
import { KATEGORIEN } from "@/lib/kategorien";
import {
  bingoNamen,
  istTischStand,
  rundeAusStand,
  tischStand,
} from "@/lib/raum/stand";
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

// Runde 1, Titel, noch nicht aufgelöst, mit dem ersten Song der Demo.
const runde = {
  nummer: 1,
  kategorie: KATEGORIEN[0],
  song: SONGLISTE[0],
  aufgeloest: false,
  abgehaktesFeld: null,
};
const aufgeloest = { ...runde, aufgeloest: true };
const { titel, interpret, jahr } = SONGLISTE[0];

test("online nach der Auflösung: Stand mit online und den Angaben zum Song", () => {
  const stand = tischStand("s1", aufgeloest, [], true);
  expect(stand.online).toBe(true);
  expect(stand.runde?.song).toEqual({
    titel,
    interpret,
    jahr,
    cover: undefined,
  });
});

test("online vor der Auflösung: kein Song im Stand", () => {
  const stand = tischStand("s1", runde, [], true);
  expect(stand.online).toBe(true);
  expect(stand.runde?.song).toBeUndefined();
});

test("lokal auch nach der Auflösung kein Song und kein online", () => {
  const stand = tischStand("s1", aufgeloest, []);
  expect(stand.runde?.song).toBeUndefined();
  expect("online" in stand).toBe(false);
});

test("istTischStand nimmt Stände mit und ohne online und song, keinen kaputten Song", () => {
  expect(istTischStand({ spiel: "s", runde: null, bingo: [] })).toBe(true);
  expect(istTischStand(tischStand("s1", aufgeloest, [], true))).toBe(true);
  expect(
    istTischStand({
      spiel: "s",
      online: true,
      bingo: [],
      runde: {
        nummer: 1,
        kategorie: "titel",
        aufgeloest: true,
        song: { titel: 3 },
      },
    }),
  ).toBe(false);
  expect(
    istTischStand({ spiel: "s", online: "ja", runde: null, bingo: [] }),
  ).toBe(false);
});

test("rundeAusStand baut die Runde, vor der Auflösung mit leerem Song", () => {
  expect(rundeAusStand({ spiel: "s", runde: null, bingo: [] })).toBeNull();
  const offen = rundeAusStand(tischStand("s1", runde, [], true))!;
  expect(offen.nummer).toBe(1);
  expect(offen.kategorie.id).toBe("titel");
  expect(offen.aufgeloest).toBe(false);
  expect(offen.song.titel).toBe("");
  const fertig = rundeAusStand(tischStand("s1", aufgeloest, [], true))!;
  expect(fertig.song).toMatchObject({ titel, interpret, jahr });
});
