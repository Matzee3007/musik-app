import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import Songliste from "@/app/ui/songliste";
import type { PlaylistSong } from "@/lib/spotify/playlist-songs";
import { gespeicherteJahre, vorbereiten } from "@/lib/vorbereiten";

const song = (id: string, isrc: string | null = `ISRC${id}`): PlaylistSong => ({
  id,
  titel: `Titel ${id}`,
  interpret: "Queen",
  isrc,
  spotifyJahr: 2011,
});

// t1: MusicBrainz kennt 1975 (Remaster, nicht markiert), t2: ohne ISRC, also nicht gefunden.
beforeEach(async () => {
  await vorbereiten([song("t1"), song("t2", null)], {
    jahrAbfragen: async () => 1975,
    warten: async () => {},
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("markierte Songs stehen oben und sind gekennzeichnet", () => {
  render(
    <Songliste
      songs={[song("t1"), song("t2", null)]}
      uebersprungen={1}
      onSpielStarten={vi.fn()}
    />,
  );
  expect(screen.getByText("2 Songs bereit, 1 übersprungen")).toBeDefined();
  const zeilen = screen.getAllByRole("row").slice(1);
  expect(within(zeilen[0]).getByText("Titel t2")).toBeDefined();
  expect(within(zeilen[0]).getByText("nicht gefunden")).toBeDefined();
  expect(within(zeilen[1]).getByText("Titel t1")).toBeDefined();
  expect(within(zeilen[1]).getByText("1975")).toBeDefined();
});

function eintragen(feld: HTMLElement, wert: string) {
  fireEvent.change(feld, { target: { value: wert } });
  fireEvent.blur(feld);
}

test("eine gültige Korrektur wird gespeichert und hebt die Markierung auf, Unsinn nicht", () => {
  render(
    <Songliste
      songs={[song("t2", null)]}
      uebersprungen={0}
      onSpielStarten={vi.fn()}
    />,
  );
  const feld = screen.getByRole<HTMLInputElement>("spinbutton", {
    name: "Jahr für Titel t2",
  });
  for (const unsinn of ["75", "abc", "2999"]) {
    eintragen(feld, unsinn);
    expect(gespeicherteJahre().t2.korrigiert).toBeNull();
    // Das Feld zeigt wieder, was gilt, statt den abgelehnten Wert.
    expect(feld.value).toBe("");
  }
  expect(screen.getByText("nicht gefunden")).toBeDefined();
  eintragen(feld, "1999");
  expect(gespeicherteJahre().t2.korrigiert).toBe(1999);
  expect(screen.queryByText("nicht gefunden")).toBeNull();
  eintragen(feld, "");
  expect(gespeicherteJahre().t2.korrigiert).toBeNull();
  expect(screen.getByText("nicht gefunden")).toBeDefined();
});

test("Spiel starten übergibt die Songs mit dem Jahr fürs Spiel", () => {
  const onSpielStarten = vi.fn();
  render(
    <Songliste
      songs={[song("t1"), song("t2", null)]}
      uebersprungen={0}
      onSpielStarten={onSpielStarten}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(onSpielStarten).toHaveBeenCalledWith([
    { id: "t1", titel: "Titel t1", interpret: "Queen", jahr: 1975 },
    { id: "t2", titel: "Titel t2", interpret: "Queen", jahr: 2011 },
  ]);
});

test("ohne spielbare Songs kein Spiel", () => {
  render(<Songliste songs={[]} uebersprungen={3} onSpielStarten={vi.fn()} />);
  expect(screen.getByText("Keine spielbaren Songs")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Spiel starten" })).toBeNull();
});
