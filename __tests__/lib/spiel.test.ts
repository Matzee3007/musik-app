import { describe, expect, test } from "vitest";
import { feldSetzen } from "@/lib/karte";
import {
  abhakenZuruecknehmen,
  feldAbhaken,
  jahrKorrigieren,
  loesungAnzeigen,
  rundeStarten,
  spielStarten,
  stapelNeuMischen,
  type Spiel,
} from "@/lib/spiel";
import { SONGLISTE } from "@/lib/songliste";

const SONGS = SONGLISTE.slice(0, 3);

// Zufall 0: das Rad wählt immer die erste Kategorie, Titel.
function aufgeloesteRunde(spiel = spielStarten(SONGS, () => 0)): Spiel {
  return loesungAnzeigen(rundeStarten(spiel, () => 0));
}

function titelFeld(spiel: Spiel): number {
  return spiel.karte.findIndex((f) => f.kategorie === "titel" && !f.abgehakt);
}

function anderesFeld(spiel: Spiel): number {
  return spiel.karte.findIndex((f) => f.kategorie !== "titel" && !f.abgehakt);
}

describe("Spiel und Runden", () => {
  test("spielStarten teilt eine Karte aus und mischt den Stapel", () => {
    const spiel = spielStarten(SONGS, () => 0);
    expect(spiel.karte).toHaveLength(25);
    expect(spiel.stapel).toHaveLength(3);
    expect(spiel.runde).toBeNull();
  });

  test("rundeStarten dreht das Rad und nimmt den ersten Song vom Stapel", () => {
    const spiel = spielStarten(SONGS, () => 0);
    const neu = rundeStarten(spiel, () => 0);
    expect(neu.runde).toMatchObject({
      nummer: 1,
      song: spiel.stapel[0],
      aufgeloest: false,
      abgehaktesFeld: null,
    });
    expect(neu.runde?.kategorie.id).toBe("titel");
    expect(neu.stapel).toHaveLength(2);
  });

  test("keine neue Runde, solange die laufende nicht aufgelöst ist", () => {
    const spiel = rundeStarten(
      spielStarten(SONGS, () => 0),
      () => 0,
    );
    expect(rundeStarten(spiel, () => 0)).toBe(spiel);
  });

  test("jeder Song läuft nur einmal, bis der Stapel neu gemischt wird", () => {
    let spiel = spielStarten(SONGS, () => 0);
    const gespielt: string[] = [];
    for (let i = 1; i <= 3; i++) {
      spiel = aufgeloesteRunde(spiel);
      expect(spiel.runde?.nummer).toBe(i);
      gespielt.push(spiel.runde!.song.id);
    }
    expect(new Set(gespielt).size).toBe(3);
    expect(rundeStarten(spiel, () => 0)).toBe(spiel);

    const neu = stapelNeuMischen(spiel, SONGS, () => 0);
    expect(neu.stapel).toHaveLength(3);
    expect(neu.karte).toBe(spiel.karte);
  });
});

describe("Abhaken", () => {
  test("vor der Auflösung bleibt das Spiel unverändert", () => {
    const spiel = rundeStarten(
      spielStarten(SONGS, () => 0),
      () => 0,
    );
    expect(feldAbhaken(spiel, titelFeld(spiel))).toBe(spiel);
  });

  test("ein Feld einer anderen Kategorie bleibt frei", () => {
    const spiel = aufgeloesteRunde();
    expect(feldAbhaken(spiel, anderesFeld(spiel))).toBe(spiel);
  });

  test("ein Feld der gedrehten Kategorie wird abgehakt, aber nur eins pro Runde", () => {
    const spiel = aufgeloesteRunde();
    const index = titelFeld(spiel);
    const neu = feldAbhaken(spiel, index);
    expect(neu.karte[index].abgehakt).toBe(true);
    expect(neu.runde?.abgehaktesFeld).toBe(index);
    expect(feldAbhaken(neu, titelFeld(neu))).toBe(neu);
  });

  test("ein Index außerhalb der Karte lässt das Spiel unverändert", () => {
    const spiel = aufgeloesteRunde();
    expect(feldAbhaken(spiel, -1)).toBe(spiel);
    expect(feldAbhaken(spiel, spiel.karte.length)).toBe(spiel);
    expect(abhakenZuruecknehmen(spiel, -1)).toBe(spiel);
    expect(abhakenZuruecknehmen(spiel, spiel.karte.length)).toBe(spiel);
  });

  test("Zurücknehmen gibt das Feld frei und erlaubt neues Abhaken in derselben Runde", () => {
    const spiel = aufgeloesteRunde();
    const index = titelFeld(spiel);
    const zurueck = abhakenZuruecknehmen(feldAbhaken(spiel, index), index);
    expect(zurueck.karte[index].abgehakt).toBe(false);
    expect(zurueck.runde?.abgehaktesFeld).toBeNull();
    expect(feldAbhaken(zurueck, index).karte[index].abgehakt).toBe(true);
  });

  test("nach einem Bingo startet keine neue Runde", () => {
    const spiel = aufgeloesteRunde();
    const karte = [0, 1, 2, 3, 4].reduce(
      (k, i) => feldSetzen(k, i, true),
      spiel.karte,
    );
    const mitBingo = { ...spiel, karte };
    expect(rundeStarten(mitBingo, () => 0)).toBe(mitBingo);
  });
});

describe("Jahr korrigieren", () => {
  test("ändert das Jahr in der Runde und lässt den Rest gleich", () => {
    const spiel = aufgeloesteRunde();
    const song = spiel.runde!.song;
    const neu = jahrKorrigieren(spiel, song.id, 1950);
    expect(neu.runde!.song).toEqual({ ...song, jahr: 1950 });
    expect(neu.karte).toBe(spiel.karte);
    expect(neu.stapel).toEqual(spiel.stapel);
    expect(spiel.runde!.song.jahr).toBe(song.jahr);
  });

  test("ändert auch den Song im Stapel", () => {
    const spiel = spielStarten(SONGS, () => 0);
    const song = spiel.stapel[1];
    const neu = jahrKorrigieren(spiel, song.id, 1950);
    expect(neu.stapel[1]).toEqual({ ...song, jahr: 1950 });
    expect(neu.stapel[0]).toBe(spiel.stapel[0]);
  });
});
