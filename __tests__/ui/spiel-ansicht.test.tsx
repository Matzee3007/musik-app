import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import type { Song } from "@/lib/song";
import { SONGLISTE } from "@/lib/songliste";
import type { Zufall } from "@/lib/zufall";

const FUENF_SONGS = SONGLISTE.slice(0, 5);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function starten(songs: readonly Song[], zufall: Zufall = () => 0) {
  render(<SpielAnsicht songs={songs} zufall={zufall} />);
  klick("Spiel starten");
}

function klick(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

test("nach „Spiel starten“ gibt es eine Karte mit 25 freien Feldern und „Rad drehen“", () => {
  starten(FUENF_SONGS);
  const felder = screen.getAllByRole("button", { name: /^Feld / });
  expect(felder).toHaveLength(25);
  expect(felder.every((f) => f.getAttribute("aria-pressed") === "false")).toBe(
    true,
  );
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});
