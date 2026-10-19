import { afterEach, expect, test, vi } from "vitest";
import { antwort } from "../hilfen/antwort";
import { GET } from "@/app/api/erscheinungsjahr/route";

afterEach(() => {
  vi.unstubAllGlobals();
});

const anfrage = (isrc: string) =>
  new Request(`http://127.0.0.1:3000/api/erscheinungsjahr?isrc=${isrc}`);

test("liefert das Jahr zum ISRC", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      antwort({ recordings: [{ "first-release-date": "1975-11-21" }] }),
    ),
  );
  const r = await GET(anfrage("GBUM71029604"));
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ jahr: 1975 });
});

test("lehnt alles ab, was kein ISRC ist, ohne MusicBrainz zu fragen", async () => {
  const abruf = vi.fn();
  vi.stubGlobal("fetch", abruf);
  for (const isrc of ["../../artist", "", "gbum71029604", "GBUM7102960"]) {
    expect((await GET(anfrage(isrc))).status).toBe(400);
  }
  expect(
    (await GET(new Request("http://127.0.0.1:3000/api/erscheinungsjahr")))
      .status,
  ).toBe(400);
  expect(abruf).not.toHaveBeenCalled();
});

test("reicht ein überlastetes MusicBrainz als 503 weiter", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => antwort({ error: "busy" }, 503)),
  );
  const r = await GET(anfrage("GBUM71029604"));
  expect(r.status).toBe(503);
  expect(await r.json()).toEqual({ fehler: "beschäftigt" });
});
