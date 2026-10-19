import { afterEach, expect, test, vi } from "vitest";
import { antwort } from "../hilfen/antwort";
import { MusicBrainzBeschaeftigt } from "@/lib/musicbrainz";
import type { Abruf } from "@/lib/spotify/abruf";
import type { PlaylistSong } from "@/lib/spotify/playlist-songs";
import {
  gespeicherteJahre,
  jahreVon,
  jahrUeberServer,
  korrekturSpeichern,
  spielSongs,
  vorbereiten,
} from "@/lib/vorbereiten";

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const song = (id: string, isrc: string | null = `ISRC${id}`): PlaylistSong => ({
  id,
  titel: `Titel ${id}`,
  interpret: "Queen",
  isrc,
  spotifyJahr: 2011,
});
const ohnePause = vi.fn(async () => {});

test("vorbereiten fragt jeden Song einmal mit Pause und meldet den Fortschritt", async () => {
  const jahrAbfragen = vi.fn(async () => 1975);
  const onFortschritt = vi.fn();
  await vorbereiten([song("t1"), song("t2")], {
    jahrAbfragen,
    warten: ohnePause,
    onFortschritt,
  });
  expect(jahrAbfragen.mock.calls).toEqual([["ISRCt1"], ["ISRCt2"]]);
  expect(ohnePause.mock.calls).toEqual([[1100]]);
  expect(onFortschritt.mock.calls).toEqual([
    [0, 2],
    [1, 2],
    [2, 2],
  ]);
  expect(gespeicherteJahre()).toEqual({
    t1: { musicbrainz: 1975, korrigiert: null },
    t2: { musicbrainz: 1975, korrigiert: null },
  });
});

test("eine schon vorbereitete Playlist fragt MusicBrainz nicht noch einmal", async () => {
  await vorbereiten([song("t1")], {
    jahrAbfragen: async () => 1975,
    warten: ohnePause,
  });
  const jahrAbfragen = vi.fn(async () => 1975);
  const onFortschritt = vi.fn();
  await vorbereiten([song("t1"), song("t2")], {
    jahrAbfragen,
    warten: ohnePause,
    onFortschritt,
  });
  expect(jahrAbfragen.mock.calls).toEqual([["ISRCt2"]]);
  expect(onFortschritt.mock.calls).toEqual([
    [0, 1],
    [1, 1],
  ]);
});

test("ohne ISRC keine Anfrage, der Song gilt als nicht gefunden", async () => {
  const jahrAbfragen = vi.fn(async () => 1975);
  await vorbereiten([song("t1", null)], { jahrAbfragen, warten: ohnePause });
  expect(jahrAbfragen).not.toHaveBeenCalled();
  expect(gespeicherteJahre().t1).toEqual({
    musicbrainz: null,
    korrigiert: null,
  });
});

// MusicBrainz füllt seinen gemeinsamen Topf alle 2 Sekunden. Eine Pause von genau 2 s trifft immer wieder
// die leere Phase (gemessen 2026-10-19: neuer Versuch nach 2 s 3 von 5, nach 1 s 5 von 5 erfolgreich).
test("überlastetes MusicBrainz: fünf Versuche mit 1 s Pause, dann Fehler, Fertiges bleibt gespeichert", async () => {
  const jahrAbfragen = vi.fn(async (isrc: string) => {
    if (isrc === "ISRCt2") throw new MusicBrainzBeschaeftigt();
    return 1975;
  });
  await expect(
    vorbereiten([song("t1"), song("t2")], { jahrAbfragen, warten: ohnePause }),
  ).rejects.toBeInstanceOf(MusicBrainzBeschaeftigt);
  expect(jahrAbfragen.mock.calls).toEqual([
    ["ISRCt1"],
    ["ISRCt2"],
    ["ISRCt2"],
    ["ISRCt2"],
    ["ISRCt2"],
    ["ISRCt2"],
  ]);
  expect(ohnePause.mock.calls).toEqual([
    [1100],
    [1000],
    [1000],
    [1000],
    [1000],
  ]);
  expect(Object.keys(gespeicherteJahre())).toEqual(["t1"]);
});

test("ist MusicBrainz nur kurz überlastet, geht es nach einem neuen Versuch weiter", async () => {
  let versuche = 0;
  const jahrAbfragen = vi.fn(async () => {
    if (++versuche === 1) throw new MusicBrainzBeschaeftigt();
    return 1975;
  });
  await vorbereiten([song("t1")], { jahrAbfragen, warten: ohnePause });
  expect(gespeicherteJahre().t1.musicbrainz).toBe(1975);
});

test("Korrektur speichern und zurücknehmen, spielSongs nimmt das Jahr fürs Spiel", async () => {
  await vorbereiten([song("t1")], {
    jahrAbfragen: async () => 1975,
    warten: ohnePause,
  });
  korrekturSpeichern("t1", 1974);
  expect(spielSongs([song("t1")], gespeicherteJahre())).toEqual([
    { id: "t1", titel: "Titel t1", interpret: "Queen", jahr: 1974 },
  ]);
  korrekturSpeichern("t1", null);
  expect(jahreVon(song("t1"), gespeicherteJahre())).toEqual({
    spotify: 2011,
    musicbrainz: 1975,
    korrigiert: null,
  });
  expect(spielSongs([song("t1")], gespeicherteJahre())[0].jahr).toBe(1975);
});

test("ein noch nicht vorbereiteter Song spielt mit dem Spotify-Jahr", () => {
  expect(jahreVon(song("neu"), {})).toEqual({
    spotify: 2011,
    musicbrainz: null,
    korrigiert: null,
  });
});

test("jahrUeberServer fragt die eigene Route und meldet 503 als beschäftigt", async () => {
  const abruf = vi.fn<Abruf>(async () => antwort({ jahr: 1975 }));
  expect(await jahrUeberServer("GBUM71029604", abruf)).toBe(1975);
  expect(abruf.mock.calls[0][0]).toBe(
    "/api/erscheinungsjahr?isrc=GBUM71029604",
  );
  await expect(
    jahrUeberServer(
      "X",
      vi.fn<Abruf>(async () => antwort({}, 503)),
    ),
  ).rejects.toBeInstanceOf(MusicBrainzBeschaeftigt);
  await expect(
    jahrUeberServer(
      "X",
      vi.fn<Abruf>(async () => antwort({}, 500)),
    ),
  ).rejects.toThrow("500");
});

test("ohne eigene Abfrage fragt vorbereiten die Route", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => antwort({ jahr: 1975 })),
  );
  await vorbereiten([song("t1")], { warten: ohnePause });
  expect(gespeicherteJahre().t1.musicbrainz).toBe(1975);
});
