import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import HandySpiel from "@/app/ui/handy-spiel";
import type { HandyKarte } from "@/lib/raum/handy-karte";
import { handyKarteSpeichern, notizenAn } from "@/lib/raum/speicher";
import type { Anwesend } from "@/lib/raum/spieler";
import type { TischStand } from "@/lib/raum/stand";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Runde 3, Titel, noch nicht aufgelöst.
const runde3: TischStand = {
  spiel: "s1",
  runde: { nummer: 3, kategorie: "titel", aufgeloest: false },
  bingo: [],
};
const aufgeloest: TischStand = {
  ...runde3,
  runde: { ...runde3.runde!, aufgeloest: true },
};

function mitTisch(stand?: TischStand): Anwesend[] {
  return [{ schluessel: "t", rolle: "tisch", ...(stand && { stand }) }];
}

// Rendert das Handy von Anna; neu() zeigt einen neuen Stand wie nach einem Presence-Abgleich.
function spielen(anwesende: Anwesend[]) {
  const raum = nachgebauterRaum();
  const kanal = raum.oeffnen("ABCD", "a");
  const { rerender } = render(
    <HandySpiel code="ABCD" name="Anna" kanal={kanal} anwesende={anwesende} />,
  );
  return {
    raum,
    neu(anwesende: Anwesend[]) {
      rerender(
        <HandySpiel
          code="ABCD"
          name="Anna"
          kanal={kanal}
          anwesende={anwesende}
        />,
      );
    },
  };
}

function felder() {
  return screen.getAllByRole("button", { name: /^Feld / });
}

// Abgehakte Felder sind nicht grau (sie lassen sich zurücknehmen), aber auch nicht frei.
function freieFelder() {
  return felder().filter(
    (f) =>
      !f.hasAttribute("aria-disabled") &&
      f.getAttribute("aria-pressed") !== "true",
  );
}

test("Tisch ohne Stand: Warte auf das Spiel", () => {
  spielen(mitTisch());
  expect(screen.getByText("Du bist im Raum ABCD als Anna.")).toBeDefined();
  expect(screen.getByText("Warte auf das Spiel …")).toBeDefined();
  expect(screen.queryAllByRole("button", { name: /^Feld / })).toEqual([]);
});

test("ohne Tisch: Der Tisch ist gerade nicht verbunden.", () => {
  spielen([]);
  expect(
    screen.getByText("Der Tisch ist gerade nicht verbunden."),
  ).toBeDefined();
});

test("vor der Auflösung sind alle Felder grau", () => {
  spielen(mitTisch(runde3));
  expect(felder()).toHaveLength(25);
  expect(freieFelder()).toEqual([]);
});

test("nach der Auflösung sind nur die Felder der Kategorie frei", () => {
  spielen(mitTisch(aufgeloest));
  const frei = freieFelder();
  expect(frei).toHaveLength(5);
  expect(frei.every((f) => f.getAttribute("aria-label") === "Feld Titel")).toBe(
    true,
  );
});

test("abhaken meldet die Zahl an den Tisch", () => {
  const { raum } = spielen(mitTisch(aufgeloest));
  expect(raum.angemeldet.at(-1)).toMatchObject({
    rolle: "spieler",
    name: "Anna",
    stand: { spiel: "s1", abgehakt: 0, bingo: false },
  });
  fireEvent.click(freieFelder()[0]);
  expect(raum.angemeldet.at(-1)).toMatchObject({
    stand: { spiel: "s1", abgehakt: 1, bingo: false },
  });
  expect(freieFelder()).toEqual([]);
});

function abgehakteFelder() {
  return felder().filter((f) => f.getAttribute("aria-pressed") === "true");
}

test("Karte und Haken überstehen das Neuladen", () => {
  spielen(mitTisch(aufgeloest));
  fireEvent.click(freieFelder()[0]);
  const vorher = felder().map((f) => f.getAttribute("aria-label"));
  cleanup();

  spielen(mitTisch(aufgeloest));
  expect(felder().map((f) => f.getAttribute("aria-label"))).toEqual(vorher);
  expect(abgehakteFelder()).toHaveLength(1);
  expect(freieFelder()).toEqual([]);
});

test("neues Spiel teilt eine neue Karte aus", () => {
  const { neu } = spielen(mitTisch(aufgeloest));
  fireEvent.click(freieFelder()[0]);
  neu(mitTisch({ ...aufgeloest, spiel: "s2" }));
  expect(abgehakteFelder()).toEqual([]);
  expect(freieFelder()).toHaveLength(5);
});

test("zurücknehmen fragt nach und gibt die Runde wieder frei", () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  spielen(mitTisch(aufgeloest));
  fireEvent.click(freieFelder()[0]);
  fireEvent.click(abgehakteFelder()[0]);
  expect(window.confirm).toHaveBeenCalledWith("Abhaken zurücknehmen?");
  expect(abgehakteFelder()).toEqual([]);
  expect(freieFelder()).toHaveLength(5);
});

// Felder 0 bis 4 sind abgehakt: die erste Zeile.
function karteMitZeile(): HandyKarte {
  return {
    spiel: "s1",
    karte: Array.from({ length: 25 }, (_, i) => ({
      kategorie: "titel",
      abgehakt: i < 5,
    })),
    abgehakt: { runde: 3, feld: 4 },
  };
}

test("eigenes Bingo zeigt Bingo! und hebt die Reihe hervor", () => {
  handyKarteSpeichern(karteMitZeile());
  const { raum } = spielen(mitTisch(aufgeloest));
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  const reihe = felder().filter((f) => f.dataset.bingo === "true");
  expect(reihe).toHaveLength(5);
  expect(raum.angemeldet.at(-1)).toMatchObject({
    stand: { abgehakt: 5, bingo: true },
  });
});

test("Bingo eines anderen zeigt seinen Namen, zurücknehmen geht nicht mehr", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  const { neu } = spielen(mitTisch(aufgeloest));
  fireEvent.click(freieFelder()[0]);
  neu(mitTisch({ ...aufgeloest, bingo: ["Ben"] }));
  expect(screen.getByRole("heading", { name: "Bingo! Ben" })).toBeDefined();
  fireEvent.click(abgehakteFelder()[0]);
  expect(confirm).not.toHaveBeenCalled();
  expect(abgehakteFelder()).toHaveLength(1);
});

test("Notizfläche leert sich bei neuer Runde", () => {
  const { neu } = spielen(mitTisch(runde3));
  fireEvent.change(screen.getByLabelText("Notizen"), {
    target: { value: "Queen" },
  });
  neu(mitTisch(aufgeloest));
  expect(screen.getByLabelText<HTMLTextAreaElement>("Notizen").value).toBe(
    "Queen",
  );
  neu(mitTisch({ ...runde3, runde: { ...runde3.runde!, nummer: 4 } }));
  expect(screen.getByLabelText<HTMLTextAreaElement>("Notizen").value).toBe("");
});

test("Notizen aus wird gemerkt", () => {
  spielen(mitTisch(runde3));
  fireEvent.click(screen.getByRole("button", { name: "Notizen aus" }));
  expect(screen.queryByLabelText("Notizen")).toBeNull();
  expect(notizenAn()).toBe(false);
  cleanup();

  spielen(mitTisch(runde3));
  expect(screen.queryByLabelText("Notizen")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Notizen an" }));
  expect(screen.getByLabelText("Notizen")).toBeDefined();
});
