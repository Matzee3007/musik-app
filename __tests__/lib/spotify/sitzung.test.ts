import { afterEach, expect, test, vi } from "vitest";
import { antwort } from "../../hilfen/antwort";
import type { Abruf } from "@/lib/spotify/abruf";
import { codeChallenge } from "@/lib/spotify/pkce";
import {
  abmelden,
  anmeldungAbschliessen,
  anmeldungStarten,
  gueltigesToken,
} from "@/lib/spotify/sitzung";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

test("anmeldungStarten merkt sich Verifier und State und gibt die Spotify-Adresse zurück", async () => {
  const url = new URL(await anmeldungStarten("abc"));
  const gemerkt = JSON.parse(sessionStorage.getItem("musik-app:anmeldung")!);
  expect(url.searchParams.get("client_id")).toBe("abc");
  expect(url.searchParams.get("state")).toBe(gemerkt.state);
  expect(url.searchParams.get("code_challenge")).toBe(
    await codeChallenge(gemerkt.verifier),
  );
  expect(url.searchParams.get("redirect_uri")).toBe(
    `${window.location.origin}/callback`,
  );
});

function gemerkterState(): string {
  return JSON.parse(sessionStorage.getItem("musik-app:anmeldung")!).state;
}

test("anmeldungAbschliessen tauscht den Code einmal und speichert das Token", async () => {
  await anmeldungStarten("abc");
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }),
  );
  await anmeldungAbschliessen(
    new URLSearchParams({ code: "c1", state: gemerkterState() }),
    "abc",
    abruf,
    0,
  );
  expect(abruf).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem("musik-app:spotify-token")!)).toEqual({
    accessToken: "a1",
    refreshToken: "r1",
    ablauf: 3_600_000,
  });
  expect(sessionStorage.getItem("musik-app:anmeldung")).toBeNull();
});

test("Abbrechen bei Spotify ergibt „Anmeldung abgebrochen“ ohne Tausch", async () => {
  await anmeldungStarten("abc");
  const abruf = vi.fn<Abruf>();
  await expect(
    anmeldungAbschliessen(
      new URLSearchParams({ error: "access_denied", state: gemerkterState() }),
      "abc",
      abruf,
    ),
  ).rejects.toThrow("Anmeldung abgebrochen");
  expect(abruf).not.toHaveBeenCalled();
});

test("fremder State ergibt „Anmeldung ungültig“ ohne Tausch", async () => {
  await anmeldungStarten("abc");
  const abruf = vi.fn<Abruf>();
  await expect(
    anmeldungAbschliessen(
      new URLSearchParams({ code: "c1", state: "fremd" }),
      "abc",
      abruf,
    ),
  ).rejects.toThrow("Anmeldung ungültig");
  expect(abruf).not.toHaveBeenCalled();
});

test("ohne gestartete Anmeldung ergibt die Rückkehr „Anmeldung ungültig“", async () => {
  await expect(
    anmeldungAbschliessen(
      new URLSearchParams({ code: "c1", state: "s1" }),
      "abc",
      vi.fn<Abruf>(),
    ),
  ).rejects.toThrow("Anmeldung ungültig");
});

function tokenSpeichern(ablauf: number) {
  localStorage.setItem(
    "musik-app:spotify-token",
    JSON.stringify({ accessToken: "alt", refreshToken: "r1", ablauf }),
  );
}

test("gueltigesToken erneuert ein abgelaufenes Token und speichert es", async () => {
  tokenSpeichern(0);
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ access_token: "neu", expires_in: 3600 }),
  );
  expect(await gueltigesToken("abc", abruf, 1_000)).toEqual({
    accessToken: "neu",
    refreshToken: "r1",
    ablauf: 3_601_000,
  });
  expect(
    JSON.parse(localStorage.getItem("musik-app:spotify-token")!).accessToken,
  ).toBe("neu");
});

test("gueltigesToken gibt ein gültiges Token ohne Anfrage zurück", async () => {
  tokenSpeichern(3_600_000);
  const abruf = vi.fn<Abruf>();
  expect((await gueltigesToken("abc", abruf, 1_000))?.accessToken).toBe("alt");
  expect(abruf).not.toHaveBeenCalled();
});

test("entzogener Zugriff meldet ab statt zu werfen", async () => {
  tokenSpeichern(0);
  const abruf = vi.fn<Abruf>(async () =>
    antwort({ error: "invalid_grant" }, 400),
  );
  expect(await gueltigesToken("abc", abruf, 1_000)).toBeNull();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});

test("ohne Netz bleibt der DJ angemeldet und der Fehler kommt durch", async () => {
  tokenSpeichern(0);
  const abruf = vi.fn<Abruf>(async () => {
    throw new TypeError("Failed to fetch");
  });
  await expect(gueltigesToken("abc", abruf, 1_000)).rejects.toThrow(
    "Failed to fetch",
  );
  expect(localStorage.getItem("musik-app:spotify-token")).not.toBeNull();
});

test("ohne gespeichertes Token gibt es keins, abmelden löscht es", async () => {
  const abruf = vi.fn<Abruf>();
  expect(await gueltigesToken("abc", abruf)).toBeNull();
  expect(abruf).not.toHaveBeenCalled();
  tokenSpeichern(3_600_000);
  abmelden();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});
