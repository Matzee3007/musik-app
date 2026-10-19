import { expect, test, vi } from "vitest";
import { antwort } from "../../hilfen/antwort";
import type { Abruf } from "@/lib/spotify/abruf";
import { trackAbspielen } from "@/lib/spotify/abspielen";

test("trackAbspielen startet den Song auf dem Gerät des Tisches", async () => {
  const abruf = vi.fn<Abruf>(async () => new Response(null, { status: 204 }));
  await trackAbspielen(
    { deviceId: "d1", trackId: "t1", accessToken: "a1" },
    abruf,
  );
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://api.spotify.com/v1/me/player/play?device_id=d1");
  expect(init?.method).toBe("PUT");
  expect(init?.headers).toEqual({
    Authorization: "Bearer a1",
    "Content-Type": "application/json",
  });
  expect(JSON.parse(init?.body as string)).toEqual({
    uris: ["spotify:track:t1"],
    position_ms: 0,
  });
});

test("ohne Premium antwortet Spotify 403, das wird ein SpotifyFehler", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ error: { status: 403, reason: "PREMIUM_REQUIRED" } }, 403),
  );
  await expect(
    trackAbspielen({ deviceId: "d1", trackId: "t1", accessToken: "a1" }, abruf),
  ).rejects.toMatchObject({ name: "SpotifyFehler", status: 403 });
});
