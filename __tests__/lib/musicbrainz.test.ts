import { expect, test, vi } from "vitest";
import { antwort } from "../hilfen/antwort";
import {
  erscheinungsjahrLaden,
  jahrAusMusicBrainz,
  MusicBrainzBeschaeftigt,
  USER_AGENT,
} from "@/lib/musicbrainz";
import type { Abruf } from "@/lib/spotify/abruf";

test("jahrAusMusicBrainz liest das Jahr aus first-release-date", () => {
  expect(
    jahrAusMusicBrainz({
      recordings: [{ "first-release-date": "1975-11-21" }],
    }),
  ).toBe(1975);
});

test("jahrAusMusicBrainz nimmt das früheste Jahr und übergeht Aufnahmen ohne Datum", () => {
  expect(
    jahrAusMusicBrainz({
      recordings: [
        { "first-release-date": "1981" },
        { "first-release-date": "" },
        {},
        { "first-release-date": "1977-06" },
      ],
    }),
  ).toBe(1977);
  expect(jahrAusMusicBrainz({ recordings: [{}] })).toBeNull();
  expect(jahrAusMusicBrainz({ recordings: [] })).toBeNull();
});

test("erscheinungsjahrLaden fragt mit User-Agent und liefert das Jahr", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({
      isrc: "GBUM71029604",
      recordings: [{ "first-release-date": "1975-11-21" }],
    }),
  );
  expect(await erscheinungsjahrLaden("GBUM71029604", abruf)).toBe(1975);
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://musicbrainz.org/ws/2/isrc/GBUM71029604?fmt=json");
  expect(init?.headers).toEqual({
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  });
  expect(USER_AGENT).toMatch(/^musik-app\/\S+ \( .+ \)$/);
});

test("unbekannter ISRC ergibt kein Jahr, überlastetes MusicBrainz einen eigenen Fehler", async () => {
  const unbekannt = vi.fn<Abruf>(async () =>
    antwort({ error: "Not Found" }, 404),
  );
  expect(await erscheinungsjahrLaden("X", unbekannt)).toBeNull();
  const busy = vi.fn<Abruf>(async () => antwort({ error: "busy" }, 503));
  await expect(erscheinungsjahrLaden("X", busy)).rejects.toBeInstanceOf(
    MusicBrainzBeschaeftigt,
  );
});

test("andere Fehler fallen auf, statt als nicht gefunden durchzurutschen", async () => {
  const kaputt = vi.fn<Abruf>(async () => antwort({}, 500));
  await expect(erscheinungsjahrLaden("X", kaputt)).rejects.toThrow("500");
});
