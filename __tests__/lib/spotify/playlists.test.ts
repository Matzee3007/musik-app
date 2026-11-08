import { expect, test, vi } from "vitest";
import { antwort } from "../../hilfen/antwort";
import type { Abruf } from "@/lib/spotify/abruf";
import { eigenePlaylists } from "@/lib/spotify/playlists";

const seite = (playlists: object[], next: string | null) =>
  antwort({ items: playlists, next });
const eigene = (id: string, total: number) => ({
  id,
  name: `Liste ${id}`,
  owner: { id: "dj" },
  items: { total },
});
const ME = "https://api.spotify.com/v1/me";

// /v1/me liefert den DJ, alle anderen Adressen die Playlist-Seiten der Reihe nach.
function spotify(...seiten: Response[]) {
  let i = 0;
  return vi.fn<Abruf>(async (url) =>
    url === ME ? antwort({ id: "dj" }) : seiten[i++],
  );
}
const playlistAufrufe = (abruf: ReturnType<typeof spotify>) =>
  abruf.mock.calls.filter(([url]) => url !== ME);

test("eigenePlaylists fragt mit dem Token und liefert Name und Anzahl Songs", async () => {
  const abruf = spotify(seite([eigene("p1", 120)], null));
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 120, cover: null },
  ]);
  const [url, init] = playlistAufrufe(abruf)[0];
  expect(url).toBe("https://api.spotify.com/v1/me/playlists?limit=50");
  expect(init?.headers).toEqual({ Authorization: "Bearer a1" });
});

test("eigenePlaylists lässt fremde Playlists weg, bei denen Spotify die Songs verschweigt", async () => {
  const abruf = spotify(
    seite([{ id: "fremd", name: "Fremde Playlist" }, eigene("p1", 7)], null),
  );
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 7, cover: null },
  ]);
});

test("eigenePlaylists lässt gefolgte Playlists weg, auch wenn Spotify die Anzahl Songs mitschickt", async () => {
  const abruf = spotify(
    seite(
      [
        eigene("p1", 7),
        {
          id: "geteilt",
          name: "Mit Freunden",
          owner: { id: "freund" },
          collaborative: true,
          items: { total: 30 },
        },
        {
          id: "gefolgt",
          name: "Von Freund",
          owner: { id: "freund" },
          collaborative: false,
          items: { total: 52 },
        },
      ],
      null,
    ),
  );
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 7, cover: null },
    { id: "geteilt", name: "Mit Freunden", anzahlSongs: 30, cover: null },
  ]);
  expect(abruf.mock.calls[0][0]).toBe(ME);
  expect(abruf.mock.calls[0][1]?.headers).toEqual({
    Authorization: "Bearer a1",
  });
});

test("eigenePlaylists folgt allen Seiten, auch über 50 Playlists", async () => {
  const zweite = "https://api.spotify.com/v1/me/playlists?offset=50&limit=50";
  const abruf = spotify(
    seite([eigene("p1", 120)], zweite),
    seite([eigene("p2", 7)], null),
  );
  expect(await eigenePlaylists("a1", abruf)).toEqual([
    { id: "p1", name: "Liste p1", anzahlSongs: 120, cover: null },
    { id: "p2", name: "Liste p2", anzahlSongs: 7, cover: null },
  ]);
  const aufrufe = playlistAufrufe(abruf);
  expect(aufrufe).toHaveLength(2);
  expect(aufrufe[1][0]).toBe(zweite);
  expect(aufrufe[1][1]?.headers).toEqual({
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

test("eigenePlaylists liefert das erste Bild als Cover, ohne Bild null", async () => {
  const abruf = spotify(
    seite(
      [
        { ...eigene("p1", 30), images: [{ url: "https://i.scdn.co/a" }] },
        { ...eigene("p2", 30), images: null },
      ],
      null,
    ),
  );
  expect((await eigenePlaylists("a1", abruf)).map((p) => p.cover)).toEqual([
    "https://i.scdn.co/a",
    null,
  ]);
});
