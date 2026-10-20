import { SpotifyFehler, type Abruf } from "@/lib/spotify/abruf";

// Startet einen Song von vorn auf einem Spotify-Gerät, bei uns dem Player im Browser des Tisches.
export async function trackAbspielen(
  p: { deviceId: string; trackId: string; accessToken: string },
  abruf: Abruf = fetch,
): Promise<void> {
  const antwort = await abruf(
    `https://api.spotify.com/v1/me/player/play?device_id=${p.deviceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${p.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [`spotify:track:${p.trackId}`],
        position_ms: 0,
      }),
    },
  );
  // Erfolg ist 204 ohne Inhalt, deshalb nicht jsonOderFehler.
  if (!antwort.ok) {
    throw new SpotifyFehler(
      antwort.status,
      `Spotify antwortet mit ${antwort.status}`,
    );
  }
}
