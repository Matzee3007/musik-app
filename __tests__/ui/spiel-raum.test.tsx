import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import type { Anwesend } from "@/lib/raum/spieler";
import type { TischStand } from "@/lib/raum/stand";
import { SONGLISTE } from "@/lib/songliste";
import type { Abspieler } from "@/lib/spotify/player";

afterEach(cleanup);

function klick(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// Klickt den Knopf und meldet, dass das Rad steht (jsdom spielt keine Übergänge ab).
function drehen(knopf: string) {
  klick(knopf);
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
}

// Zufall 0: Das Rad wählt immer Titel.
function spielen(abspieler?: Abspieler) {
  const raum = nachgebauterRaum();
  const onStand = vi.fn<(stand: TischStand) => void>();
  render(
    <SpielAnsicht
      songs={SONGLISTE.slice(0, 5)}
      zufall={() => 0}
      sofort
      abspieler={abspieler}
      raum={{ kanal: raum.oeffnen("ABCD", "t"), onStand }}
    />,
  );
  const stand = () => onStand.mock.lastCall![0];
  return { raum, onStand, stand };
}

function mitBingo(name: string, spiel: string): Anwesend {
  return {
    schluessel: name,
    rolle: "spieler",
    name,
    stand: { spiel, abgehakt: 5, bingo: true },
  };
}

test("im Raum steht keine Karte am Tisch", () => {
  spielen();
  expect(screen.getByRole("region", { name: "Tisch" })).toBeDefined();
  expect(screen.queryByRole("region", { name: "Karte" })).toBeNull();
});

test("Rad drehen und Lösung anzeigen melden den Stand", () => {
  const { stand } = spielen();
  expect(stand()).toEqual({
    spiel: expect.any(String),
    runde: null,
    bingo: [],
  });
  drehen("Rad drehen");
  expect(stand().runde).toEqual({
    nummer: 1,
    kategorie: "titel",
    aufgeloest: false,
  });
  klick("Lösung anzeigen");
  expect(stand().runde?.aufgeloest).toBe(true);
});

test("Bingo eines Spielers zeigt Bingo! Anna", () => {
  const { raum, stand } = spielen();
  act(() => raum.anwesendeSetzen([mitBingo("Anna", stand().spiel)]));
  expect(screen.getByRole("heading", { name: "Bingo! Anna" })).toBeDefined();
  expect(stand().bingo).toEqual(["Anna"]);
});

test("Bingo aus einem anderen Spiel zählt nicht", () => {
  const { raum, stand } = spielen();
  act(() => raum.anwesendeSetzen([mitBingo("Anna", "altes-spiel")]));
  expect(screen.queryByRole("heading", { name: /Bingo/ })).toBeNull();
  expect(stand().bingo).toEqual([]);
});

test("Bingo zweier Spieler", () => {
  const { raum, stand } = spielen();
  const spiel = stand().spiel;
  act(() => raum.anwesendeSetzen([mitBingo("Anna", spiel)]));
  act(() =>
    raum.anwesendeSetzen([mitBingo("Anna", spiel), mitBingo("Ben", spiel)]),
  );
  expect(
    screen.getByRole("heading", { name: "Bingo! Anna, Ben" }),
  ).toBeDefined();
});

test("Bingo bleibt, wenn der Spieler geht", () => {
  const { raum, stand } = spielen();
  act(() => raum.anwesendeSetzen([mitBingo("Anna", stand().spiel)]));
  act(() => raum.anwesendeSetzen([]));
  expect(screen.getByRole("heading", { name: "Bingo! Anna" })).toBeDefined();
});

test("Neues Spiel bekommt eine neue Kennung und leert Bingo", () => {
  const { raum, stand } = spielen();
  const erstes = stand().spiel;
  act(() => raum.anwesendeSetzen([mitBingo("Anna", erstes)]));
  klick("Neues Spiel");
  expect(stand().spiel).not.toBe(erstes);
  expect(stand().bingo).toEqual([]);
  expect(screen.queryByRole("heading", { name: /Bingo/ })).toBeNull();
});

test("Bingo im Raum hält die Musik an", () => {
  const abspieler = {
    aktivieren: vi.fn(async () => {}),
    abspielen: vi.fn(async () => {}),
    pausieren: vi.fn(async () => {}),
    fortsetzen: vi.fn(async () => {}),
    vonVorn: vi.fn(async () => {}),
    trennen: vi.fn(),
  };
  const { raum, stand } = spielen(abspieler);
  drehen("Rad drehen");
  expect(abspieler.abspielen).toHaveBeenCalled();
  act(() => raum.anwesendeSetzen([mitBingo("Anna", stand().spiel)]));
  expect(abspieler.pausieren).toHaveBeenCalled();
});
