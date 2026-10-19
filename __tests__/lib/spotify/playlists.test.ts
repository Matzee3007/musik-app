import { expect, test, vi } from "vitest";
import { antwort } from "../../hilfen/antwort";
import type { Abruf } from "@/lib/spotify/abruf";
import { eigenePlaylists } from "@/lib/spotify/playlists";

const seite = (playlists: object[], next: string | null) =>
  antwort({ items: playlists, next });
const eigene = (id: string, total: number) => ({
  id,
  name: `Liste ${id}`,
  items: { total },
});

test("eigenePlaylists fragt mit dem Token und liefert Name und Anzahl Songs", async () => {
  const abruf = vi.fn<Abruf>(async () => seite([eigene("p1", 120)], null));
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 120 },
  ]);
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://api.spotify.com/v1/me/playlists?limit=50");
  expect(init?.headers).toEqual({ Authorization: "Bearer a1" });
});

test("eigenePlaylists lässt fremde Playlists weg, bei denen Spotify die Songs verschweigt", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    seite([{ id: "fremd", name: "Hitster" }, eigene("p1", 7)], null),
  );
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 7 },
  ]);
});

test("eigenePlaylists folgt allen Seiten, auch über 50 Playlists", async () => {
  const zweite = "https://api.spotify.com/v1/me/playlists?offset=50&limit=50";
  const abruf = vi
    .fn<Abruf>()
    .mockResolvedValueOnce(seite([eigene("p1", 120)], zweite))
    .mockResolvedValueOnce(seite([eigene("p2", 7)], null));
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 120 },
    { id: "p2", name: "Liste p2", anzahlSongs: 7 },
  ]);
  expect(abruf).toHaveBeenCalledTimes(2);
  expect(abruf.mock.calls[1][0]).toBe(zweite);
  expect(abruf.mock.calls[1][1]?.headers).toEqual({
    Authorization: "Bearer a1",
  });
});

test("abgelaufenes Token ergibt SpotifyFehler 401", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort(
      { error: { status: 401, message: "The access token expired" } },
      401,
    ),
  );
  await expect(eigenePlaylists("a1", abruf)).rejects.toMatchObject({
    name: "SpotifyFehler",
    status: 401,
  });
});
