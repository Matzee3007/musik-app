// Wie fetch. Tests setzen nachgebaute Spotify-Antworten ein.
export type Abruf = (url: string, init?: RequestInit) => Promise<Response>;

export class SpotifyFehler extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "SpotifyFehler";
  }
}

export async function jsonOderFehler<T>(antwort: Response): Promise<T> {
  if (!antwort.ok) {
    throw new SpotifyFehler(
      antwort.status,
      `Spotify antwortet mit ${antwort.status}`,
    );
  }
  return (await antwort.json()) as T;
}
