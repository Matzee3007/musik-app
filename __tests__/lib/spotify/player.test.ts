import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Abruf } from "@/lib/spotify/abruf";

const SDK = "https://sdk.scdn.co/spotify-player.js";

// Jeder Test lädt player.ts frisch, weil sdkLaden sein Ergebnis für das ganze Modul merkt.
async function player() {
  return import("@/lib/spotify/player");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  NachgebauterPlayer.meldung = ["ready", { device_id: "d1" }];
  delete window.Spotify;
  delete window.onSpotifyWebPlaybackSDKReady;
  document.querySelectorAll("script").forEach((s) => s.remove());
});

// Nachgebauter Spotify.Player: meldet beim Verbinden das Ereignis aus `meldung`.
class NachgebauterPlayer {
  static letzter: NachgebauterPlayer;
  static meldung: [string, object] = ["ready", { device_id: "d1" }];
  hoerer: Record<string, (daten: object) => void> = {};
  aufrufe: string[] = [];
  constructor(
    public optionen: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
    },
  ) {
    NachgebauterPlayer.letzter = this;
  }
  addListener(ereignis: string, f: (daten: object) => void) {
    this.hoerer[ereignis] = f;
    return true;
  }
  async connect() {
    const [ereignis, daten] = NachgebauterPlayer.meldung;
    queueMicrotask(() => this.hoerer[ereignis]?.(daten));
    return true;
  }
  async activateElement() {
    this.aufrufe.push("activateElement");
  }
  async pause() {
    this.aufrufe.push("pause");
  }
  async resume() {
    this.aufrufe.push("resume");
  }
  async seek(ms: number) {
    this.aufrufe.push(`seek ${ms}`);
  }
  disconnect() {
    this.aufrufe.push("disconnect");
  }
}

test("sdkLaden fügt das Skript nur einmal ein und wartet auf das SDK", async () => {
  const { sdkLaden } = await player();
  let fertig = false;
  const beide = Promise.all([sdkLaden(), sdkLaden()]).then(() => {
    fertig = true;
  });
  expect(document.querySelectorAll(`script[src="${SDK}"]`)).toHaveLength(1);
  await Promise.resolve();
  expect(fertig).toBe(false);
  window.onSpotifyWebPlaybackSDKReady!();
  await beide;
  expect(fertig).toBe(true);
});

test("playerVerbinden wartet auf das Gerät und spielt Songs dort ab", async () => {
  const { playerVerbinden, sdkLaden } = await player();
  const geladen = sdkLaden();
  window.Spotify = { Player: NachgebauterPlayer } as never;
  window.onSpotifyWebPlaybackSDKReady!();
  await geladen;
  const abruf = vi.fn<Abruf>(async () => new Response(null, { status: 204 }));
  const abspieler = await playerVerbinden({
    tokenHolen: async () => "a1",
    abruf,
  });
  expect(NachgebauterPlayer.letzter.optionen.name).toBe("Musik-App Tisch");
  const token = await new Promise((fertig) =>
    NachgebauterPlayer.letzter.optionen.getOAuthToken(fertig),
  );
  expect(token).toBe("a1");
  await abspieler.abspielen("t1");
  expect(abruf.mock.calls[0][0]).toBe(
    "https://api.spotify.com/v1/me/player/play?device_id=d1",
  );
});

async function verbindenMit(meldung: [string, object]) {
  const { playerVerbinden, sdkLaden } = await player();
  const geladen = sdkLaden();
  window.Spotify = { Player: NachgebauterPlayer } as never;
  window.onSpotifyWebPlaybackSDKReady!();
  await geladen;
  NachgebauterPlayer.meldung = meldung;
  return playerVerbinden({ tokenHolen: async () => "a1" });
}

test.each([
  ["account_error", "Spotify Premium nötig."],
  ["initialization_error", "Dieser Browser kann Spotify nicht abspielen."],
  ["authentication_error", "Spotify-Anmeldung abgelaufen."],
])("%s ergibt eine Meldung für den DJ", async (ereignis, meldung) => {
  const { PlayerFehler } = await player();
  const verbinden = verbindenMit([ereignis, { message: "intern" }]);
  await expect(verbinden).rejects.toThrow(meldung);
  await expect(verbinden).rejects.toBeInstanceOf(PlayerFehler);
});

test("der Abspieler steuert den Player, von vorn heißt an den Anfang und weiter", async () => {
  const abspieler = await verbindenMit(["ready", { device_id: "d1" }]);
  await abspieler.aktivieren();
  await abspieler.pausieren();
  await abspieler.fortsetzen();
  await abspieler.vonVorn();
  abspieler.trennen();
  expect(NachgebauterPlayer.letzter.aufrufe).toEqual([
    "activateElement",
    "pause",
    "resume",
    "seek 0",
    "resume",
    "disconnect",
  ]);
});
