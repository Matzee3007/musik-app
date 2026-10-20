// Anbindung des Spotify Web Playback SDK: Der Browser des Tisches wird ein Spotify-Gerät.
// Nur diese Datei kennt das SDK, alles andere nutzt den Abspieler.
import type { Abruf } from "@/lib/spotify/abruf";
import { trackAbspielen } from "@/lib/spotify/abspielen";

const SDK = "https://sdk.scdn.co/spotify-player.js";

// Eigene schmale Typen statt @types/spotify-web-playback-sdk: nur was wir benutzen.
type SpotifyPlayer = {
  addListener(
    ereignis: string,
    hoerer: (daten: { device_id: string; message: string }) => void,
  ): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(positionMs: number): Promise<void>;
};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (optionen: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
      }) => SpotifyPlayer;
    };
  }
}

// Was Tisch und Spiel vom Player brauchen. Tests setzen einen nachgebauten ein.
export type Abspieler = {
  // Muss in einem Klick laufen, sonst lässt der Browser keinen Ton zu.
  aktivieren(): Promise<void>;
  abspielen(trackId: string): Promise<void>;
  pausieren(): Promise<void>;
  fortsetzen(): Promise<void>;
  vonVorn(): Promise<void>;
  trennen(): void;
};

// Meldung für den DJ, wenn der Browser kein Spotify-Gerät werden kann. Das Spiel geht dann ohne Musik.
export class PlayerFehler extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlayerFehler";
  }
}

const FEHLER: Record<string, string> = {
  account_error: "Spotify Premium nötig.",
  initialization_error: "Dieser Browser kann Spotify nicht abspielen.",
  authentication_error: "Spotify-Anmeldung abgelaufen.",
};

let sdk: Promise<void> | null = null;

// Lädt das Skript von Spotify genau einmal. Fertig ist es, wenn es onSpotifyWebPlaybackSDKReady aufruft.
export function sdkLaden(): Promise<void> {
  sdk ??= new Promise((fertig) => {
    window.onSpotifyWebPlaybackSDKReady = fertig;
    const skript = document.createElement("script");
    skript.src = SDK;
    document.body.appendChild(skript);
  });
  return sdk;
}

// Verbindet den Browser als Gerät "Musik-App Tisch" und wartet, bis Spotify es meldet.
export async function playerVerbinden(p: {
  tokenHolen: () => Promise<string>;
  abruf?: Abruf;
}): Promise<Abspieler> {
  await sdkLaden();
  const player = new window.Spotify!.Player({
    name: "Musik-App Tisch",
    getOAuthToken: (cb) => {
      // Kein Token (z. B. kein Netz nach dem Ruhezustand): Das SDK bekommt keins, den Fehler meldet
      // der nächste Befehl an den Abspieler.
      p.tokenHolen().then(cb, () => {});
    },
  });
  const deviceId = await new Promise<string>((bereit, abgelehnt) => {
    player.addListener("ready", ({ device_id }) => bereit(device_id));
    for (const [ereignis, meldung] of Object.entries(FEHLER)) {
      player.addListener(ereignis, () => abgelehnt(new PlayerFehler(meldung)));
    }
    player.connect();
  });
  return {
    aktivieren: () => player.activateElement(),
    pausieren: () => player.pause(),
    fortsetzen: () => player.resume(),
    vonVorn: async () => {
      await player.seek(0);
      await player.resume();
    },
    trennen: () => player.disconnect(),
    abspielen: async (trackId) =>
      trackAbspielen(
        { deviceId, trackId, accessToken: await p.tokenHolen() },
        p.abruf,
      ),
  };
}
