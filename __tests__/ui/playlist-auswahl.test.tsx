import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PlaylistAuswahl from "@/app/ui/playlist-auswahl";
import type { Playlist } from "@/lib/spotify/playlists";

afterEach(cleanup);

const partyhits: Playlist = {
  id: "p1",
  name: "Partyhits",
  anzahlSongs: 98,
  cover: "https://i.scdn.co/partyhits",
};
const rock: Playlist = {
  id: "p2",
  name: "Rock Hymnen",
  anzahlSongs: 52,
  cover: null,
};

function zeigen(playlists: Playlist[], geladen = true) {
  const handler = { onWaehlen: vi.fn(), onDemo: vi.fn(), onAbmelden: vi.fn() };
  const { container } = render(
    <PlaylistAuswahl playlists={playlists} geladen={geladen} {...handler} />,
  );
  return { ...handler, container };
}

test("zeigt Titel und je Playlist eine Kachel mit Name und Anzahl", () => {
  zeigen([partyhits, rock]);
  expect(
    screen.getByRole("heading", { name: "Playlist wählen" }),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { name: /Partyhits/ }).textContent,
  ).toContain("98 Songs");
  expect(
    screen.getByRole("button", { name: /Rock Hymnen/ }).textContent,
  ).toContain("52 Songs");
});

test("Kachel mit Cover zeigt das Bild, ohne Cover den ersten Buchstaben", () => {
  const { container } = zeigen([partyhits, rock]);
  const bilder = container.querySelectorAll("img");
  expect(bilder).toHaveLength(1);
  expect(bilder[0].getAttribute("src")).toBe("https://i.scdn.co/partyhits");
  expect(bilder[0].getAttribute("alt")).toBe("");
  expect(
    screen.getByRole("button", { name: /Rock Hymnen/ }).textContent,
  ).toMatch(/^R/);
});

test("Klick auf eine Kachel ruft onWaehlen mit der Playlist", () => {
  const { onWaehlen } = zeigen([partyhits, rock]);
  fireEvent.click(screen.getByRole("button", { name: /Rock Hymnen/ }));
  expect(onWaehlen).toHaveBeenCalledWith(rock);
});

test("geladen ohne Playlists: Hinweis statt leerem Raster", () => {
  const hinweis =
    "Du hast noch keine eigene Playlist mit Songs. Leg in Spotify eine an und lade die Seite neu.";
  zeigen([]);
  expect(screen.getByText(hinweis)).toBeDefined();
  cleanup();
  zeigen([], false);
  expect(screen.queryByText(hinweis)).toBeNull();
});

test("Demo starten und Abmelden rufen ihre Handler", () => {
  const { onDemo, onAbmelden } = zeigen([partyhits]);
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
  expect(onDemo).toHaveBeenCalledOnce();
  expect(onAbmelden).toHaveBeenCalledOnce();
});
