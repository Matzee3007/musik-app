import { expect, test, vi } from "vitest";
import { antwort } from "../../hilfen/antwort";
import type { Abruf } from "@/lib/spotify/abruf";
import {
  codeTauschen,
  istAbgelaufen,
  tokenErneuern,
  type Token,
} from "@/lib/spotify/token";

test("codeTauschen schickt Code und Verifier und rechnet den Ablauf aus", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }),
  );
  const token = await codeTauschen(
    {
      code: "c1",
      verifier: "v1",
      clientId: "abc",
      redirectUri: "http://127.0.0.1:3000/callback",
    },
    abruf,
    1_000,
  );
  expect(token).toEqual({
    accessToken: "a1",
    refreshToken: "r1",
    ablauf: 3_601_000,
  });
  const [url, init] = abruf.mock.calls[0];
  expect(url).toBe("https://accounts.spotify.com/api/token");
  expect(init?.method).toBe("POST");
  expect(Object.fromEntries(new URLSearchParams(init?.body as string))).toEqual(
    {
      grant_type: "authorization_code",
      code: "c1",
      redirect_uri: "http://127.0.0.1:3000/callback",
      client_id: "abc",
      code_verifier: "v1",
    },
  );
});

test("tokenErneuern behält das alte Refresh-Token, wenn Spotify kein neues schickt", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ access_token: "a2", expires_in: 3600 }),
  );
  expect(await tokenErneuern("r1", "abc", abruf, 0)).toEqual({
    accessToken: "a2",
    refreshToken: "r1",
    ablauf: 3_600_000,
  });
  const [, init] = abruf.mock.calls[0];
  expect(Object.fromEntries(new URLSearchParams(init?.body as string))).toEqual(
    { grant_type: "refresh_token", refresh_token: "r1", client_id: "abc" },
  );
});

test("tokenErneuern wirft SpotifyFehler 400 bei entzogenem Zugriff", async () => {
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ error: "invalid_grant" }, 400),
  );
  await expect(tokenErneuern("r1", "abc", abruf, 0)).rejects.toMatchObject({
    name: "SpotifyFehler",
    status: 400,
  });
});

test("istAbgelaufen gilt schon 60 Sekunden vor dem Ablauf", () => {
  const token: Token = { accessToken: "a", refreshToken: "r", ablauf: 100_000 };
  expect(istAbgelaufen(token, 39_999)).toBe(false);
  expect(istAbgelaufen(token, 40_000)).toBe(true);
});
