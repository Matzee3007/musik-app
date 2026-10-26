import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
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

const mitTisch: Anwesend[] = [{ schluessel: "t", rolle: "tisch" }];

// Rendert das Handy von Anna, der Tisch schickt stand per Nachricht; neu() schickt einen neuen Stand.
function spielen(stand: TischStand | null = null, anwesende = mitTisch) {
  const raum = nachgebauterRaum();
  const kanal = raum.oeffnen("ABCD", "a");
  render(
    <HandySpiel code="ABCD" name="Anna" kanal={kanal} anwesende={anwesende} />,
  );
  function neu(stand: TischStand) {
    act(() => raum.nachrichtSchicken({ art: "tisch", stand }));
  }
  if (stand) neu(stand);
  return { raum, neu };
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
  spielen();
  expect(screen.getByText("Du bist im Raum ABCD als Anna.")).toBeDefined();
  expect(screen.getByText("Warte auf das Spiel …")).toBeDefined();
  expect(screen.queryAllByRole("button", { name: /^Feld / })).toEqual([]);
});

test("ohne Tisch: Der Tisch ist gerade nicht verbunden.", () => {
  spielen(null, []);
  expect(
    screen.getByText("Der Tisch ist gerade nicht verbunden."),
  ).toBeDefined();
});

test("vor der Auflösung sind alle Felder grau", () => {
  spielen(runde3);
  expect(felder()).toHaveLength(25);
  expect(freieFelder()).toEqual([]);
});

test("nach der Auflösung sind nur die Felder der Kategorie frei", () => {
  spielen(aufgeloest);
  const frei = freieFelder();
  expect(frei).toHaveLength(5);
  expect(frei.every((f) => f.getAttribute("aria-label") === "Feld Titel")).toBe(
    true,
  );
});

test("abhaken schickt den Stand per Broadcast, nicht per Presence", () => {
  const { raum } = spielen(aufgeloest);
  expect(raum.gesendet.at(-1)).toEqual({
    art: "spieler",
    name: "Anna",
    stand: { spiel: "s1", abgehakt: 0, bingo: false },
  });
  fireEvent.click(freieFelder()[0]);
  expect(raum.gesendet.at(-1)).toEqual({
    art: "spieler",
    name: "Anna",
    stand: { spiel: "s1", abgehakt: 1, bingo: false },
  });
  expect(raum.angemeldet).toEqual([]);
  expect(freieFelder()).toEqual([]);
});

test("fragt beim Erscheinen und nach dem Wiederbeitritt nach", () => {
  const { raum } = spielen();
  const anfragen = () =>
    raum.gesendet.filter((n) => n.art === "anfrage").length;
  expect(anfragen()).toBe(1);
  act(() => raum.verbundenMelden());
  expect(anfragen()).toBe(2);
});

test("antwortet auf eine Anfrage mit seinem Stand", () => {
  const { raum, neu } = spielen();
  // Ohne Karte gibt es noch keinen Stand.
  act(() => raum.nachrichtSchicken({ art: "anfrage" }));
  expect(raum.gesendet).toEqual([{ art: "anfrage" }]);

  neu(aufgeloest);
  raum.gesendet.length = 0;
  act(() => raum.nachrichtSchicken({ art: "anfrage" }));
  expect(raum.gesendet).toEqual([
    {
      art: "spieler",
      name: "Anna",
      stand: { spiel: "s1", abgehakt: 0, bingo: false },
    },
  ]);
});

test("Tisch schickt keinen Stand: Warte auf das Spiel", () => {
  const { raum, neu } = spielen(aufgeloest);
  act(() => raum.nachrichtSchicken({ art: "tisch", stand: null }));
  expect(screen.getByText("Warte auf das Spiel …")).toBeDefined();
  neu(aufgeloest);
  expect(felder()).toHaveLength(25);
});

function abgehakteFelder() {
  return felder().filter((f) => f.getAttribute("aria-pressed") === "true");
}

test("Karte und Haken überstehen das Neuladen", () => {
  spielen(aufgeloest);
  fireEvent.click(freieFelder()[0]);
  const vorher = felder().map((f) => f.getAttribute("aria-label"));
  cleanup();

  spielen(aufgeloest);
  expect(felder().map((f) => f.getAttribute("aria-label"))).toEqual(vorher);
  expect(abgehakteFelder()).toHaveLength(1);
  expect(freieFelder()).toEqual([]);
});

test("neues Spiel teilt eine neue Karte aus", () => {
  const { neu } = spielen(aufgeloest);
  fireEvent.click(freieFelder()[0]);
  neu({ ...aufgeloest, spiel: "s2" });
  expect(abgehakteFelder()).toEqual([]);
  expect(freieFelder()).toHaveLength(5);
});

test("zurücknehmen fragt nach und gibt die Runde wieder frei", () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  spielen(aufgeloest);
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
  const { raum } = spielen(aufgeloest);
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  const reihe = felder().filter((f) => f.dataset.bingo === "true");
  expect(reihe).toHaveLength(5);
  expect(raum.gesendet.at(-1)).toMatchObject({
    art: "spieler",
    stand: { abgehakt: 5, bingo: true },
  });
});

test("Bingo eines anderen zeigt seinen Namen, zurücknehmen geht nicht mehr", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  const { neu } = spielen(aufgeloest);
  fireEvent.click(freieFelder()[0]);
  neu({ ...aufgeloest, bingo: ["Ben"] });
  expect(screen.getByRole("heading", { name: "Bingo! Ben" })).toBeDefined();
  fireEvent.click(abgehakteFelder()[0]);
  expect(confirm).not.toHaveBeenCalled();
  expect(abgehakteFelder()).toHaveLength(1);
});

test("Notizfläche leert sich bei neuer Runde", () => {
  const { neu } = spielen(runde3);
  fireEvent.change(screen.getByLabelText("Notizen"), {
    target: { value: "Queen" },
  });
  neu(aufgeloest);
  expect(screen.getByLabelText<HTMLTextAreaElement>("Notizen").value).toBe(
    "Queen",
  );
  neu({ ...runde3, runde: { ...runde3.runde!, nummer: 4 } });
  expect(screen.getByLabelText<HTMLTextAreaElement>("Notizen").value).toBe("");
});

test("Notizen aus wird gemerkt", () => {
  spielen(runde3);
  fireEvent.click(screen.getByRole("button", { name: "Notizen aus" }));
  expect(screen.queryByLabelText("Notizen")).toBeNull();
  expect(notizenAn()).toBe(false);
  cleanup();

  spielen(runde3);
  expect(screen.queryByLabelText("Notizen")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Notizen an" }));
  expect(screen.getByLabelText("Notizen")).toBeDefined();
});

const online: TischStand = { ...runde3, online: true };
const onlineAufgeloest: TischStand = {
  ...online,
  runde: {
    ...runde3.runde!,
    aufgeloest: true,
    song: { titel: "Bohemian Rhapsody", interpret: "Queen", jahr: 1975 },
  },
};

test("online: Rad und Kategorie neben der Karte", () => {
  spielen(online);
  expect(screen.getByRole("img", { name: "Rad" })).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe("Titel");
  expect(felder()).toHaveLength(25);
});

test("online: nach der Auflösung Lösung und Angaben", () => {
  spielen(onlineAufgeloest);
  expect(
    screen.getByRole("heading", { level: 2, name: "Bohemian Rhapsody" }),
  ).toBeDefined();
  expect(screen.getByText("Queen")).toBeDefined();
});

test("online: Bingo eines anderen steht am Tisch", () => {
  spielen({ ...onlineAufgeloest, bingo: ["Matthias"] });
  expect(
    screen.getByRole("heading", { name: "Bingo! Matthias" }),
  ).toBeDefined();
});

test("lokal kein Rad am Handy", () => {
  spielen(runde3);
  expect(screen.queryByRole("img", { name: "Rad" })).toBeNull();
});

test("online ohne Tisch: Der DJ ist gerade nicht verbunden.", () => {
  spielen(online, []);
  expect(screen.getByText("Der DJ ist gerade nicht verbunden.")).toBeDefined();
});

test("online: Ton vom DJ mit Lautstärke, lokal nicht", () => {
  const { raum } = spielen(online);
  expect(screen.getByText("Ton vom DJ: noch nicht geteilt")).toBeDefined();
  expect(screen.getByRole("slider", { name: "Lautstärke" })).toBeDefined();
  expect(raum.gesendet).toContainEqual({
    art: "ton",
    signal: {
      art: "hallo",
      von: expect.any(String),
      versuch: expect.any(String),
    },
  });
  cleanup();
  spielen(runde3);
  expect(screen.queryByText(/Ton vom DJ/)).toBeNull();
});

// Fund aus dem Review von PR #66: Zwischen zwei Spielen (Stand null) brach der Ton ab.
test("online bleibt der Ton vom DJ, auch wenn gerade kein Spiel läuft", () => {
  const { raum } = spielen(online);
  act(() => raum.nachrichtSchicken({ art: "tisch", stand: null }));
  expect(screen.getByText("Ton vom DJ: noch nicht geteilt")).toBeDefined();
});
