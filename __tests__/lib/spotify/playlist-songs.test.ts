import { expect, test, vi } from "vitest";
import { antwort } from "../../hilfen/antwort";
import type { Abruf } from "@/lib/spotify/abruf";
import { playlistSongs } from "@/lib/spotify/playlist-songs";

const track = (id: string, extra: object = {}) => ({
  is_local: false,
  item: {
    type: "track",
    id,
    name: `Titel ${id}`,
    artists: [{ name: "Queen" }, { name: "David Bowie" }],
    album: { release_date: "2011-01-01" },
    external_ids: { isrc: `ISRC${id}` },
    ...extra,
  },
});

test("playlistSongs liefert Titel, Interpreten, ISRC und Spotify-Jahr", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ items: [track("t1")], next: null }),
  );
  expect(await playlistSongs("p1", "a1", abruf)).toEqual({
    uebersprungen: 0,
    songs: [
      {
        id: "t1",
        titel: "Titel t1",
        interpret: "Queen, David Bowie",
        isrc: "ISRCt1",
        spotifyJahr: 2011,
      },
    ],
  });
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe(
    "https://api.spotify.com/v1/playlists/p1/items?limit=50&market=from_token",
  );
  expect(init?.headers).toEqual({ Authorization: "Bearer a1" });
});

test("playlistSongs folgt allen Seiten", async () => {
  const zweite = "https://api.spotify.com/v1/playlists/p1/items?offset=50";
  const abruf = vi
    .fn<Abruf>()
    .mockResolvedValueOnce(antwort({ items: [track("t1")], next: zweite }))
    .mockResolvedValueOnce(antwort({ items: [track("t2")], next: null }));
  const { songs } = await playlistSongs("p1", "a1", abruf);
  expect(songs.map((s) => s.id)).toEqual(["t1", "t2"]);
  expect(abruf.mock.calls[1][0]).toBe(zweite);
  expect(abruf.mock.calls[1][1]?.headers).toEqual({
    Authorization: "Bearer a1",
  });
});

test("ohne ISRC und mit Jahr ohne Tag bleibt der Song dabei", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({
      items: [
        track("t1", { album: { release_date: "1975" }, external_ids: {} }),
      ],
      next: null,
    }),
  );
  const { songs } = await playlistSongs("p1", "a1", abruf);
  expect(songs[0]).toMatchObject({ isrc: null, spotifyJahr: 1975 });
});

test("überspringt lokale Dateien, Podcast-Folgen und nicht spielbare Songs und zählt sie", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({
      next: null,
      items: [
        track("t1"),
        { ...track("lokal"), is_local: true },
        { is_local: false, item: { type: "episode", id: "e1" } },
        track("gesperrt", { is_playable: false }),
        { is_local: false, item: null },
        track("t2", { is_playable: true }),
      ],
    }),
  );
  const { songs, uebersprungen } = await playlistSongs("p1", "a1", abruf);
  expect(songs.map((s) => s.id)).toEqual(["t1", "t2"]);
  expect(uebersprungen).toBe(4);
});

test("abgelaufenes Token ergibt SpotifyFehler 401", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ error: { status: 401 } }, 401),
  );
  await expect(playlistSongs("p1", "a1", abruf)).rejects.toMatchObject({
    name: "SpotifyFehler",
    status: 401,
  });
});
