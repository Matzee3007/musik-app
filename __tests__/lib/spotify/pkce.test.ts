import { expect, test } from "vitest";
import { anmeldeUrl, codeChallenge, zufallsText } from "@/lib/spotify/pkce";

test("codeChallenge ergibt den Testwert aus RFC 7636", async () => {
  expect(
    await codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
  ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

test("zufallsText hat die Länge und nur erlaubte Zeichen", () => {
  const text = zufallsText(64);
  expect(text).toMatch(/^[A-Za-z0-9\-._~]{64}$/);
  expect(zufallsText(64)).not.toBe(text);
});

test("anmeldeUrl führt zu Spotify mit PKCE und allen Scopes", () => {
  const url = new URL(
    anmeldeUrl({
      clientId: "abc",
      redirectUri: "http://127.0.0.1:3000/callback",
      challenge: "xyz",
      state: "s1",
    }),
  );
  expect(url.origin + url.pathname).toBe(
    "https://accounts.spotify.com/authorize",
  );
  expect(Object.fromEntries(url.searchParams)).toEqual({
    client_id: "abc",
    response_type: "code",
    redirect_uri: "http://127.0.0.1:3000/callback",
    code_challenge_method: "S256",
    code_challenge: "xyz",
    state: "s1",
    scope:
      "playlist-read-private playlist-read-collaborative streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state",
  });
});
