import { jsonOderFehler, type Abruf } from "@/lib/spotify/abruf";

// Ein Song, wie er aus der Playlist kommt, noch ohne Erscheinungsjahr aus MusicBrainz.
export type PlaylistSong = {
  id: string;
  titel: string;
  interpret: string;
  isrc: string | null;
  spotifyJahr: number;
};

type Track = {
  type: string;
  id: string;
  name: string;
  artists: { name: string }[];
  album: { release_date: string };
  // Ohne ISRC lässt sich kein Erscheinungsjahr in MusicBrainz finden.
  external_ids: { isrc?: string };
  // Nur mit "market" vorhanden. Fehlt es, gilt der Song als spielbar.
  is_playable?: boolean;
};

type ItemsSeite = {
  items: { is_local: boolean; item: Track | null }[];
  next: string | null;
};

export async function playlistSongs(
  playlistId: string,
  accessToken: string,
  abruf: Abruf = fetch,
): Promise<{ songs: PlaylistSong[]; uebersprungen: number }> {
  const songs: PlaylistSong[] = [];
  let uebersprungen = 0;
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50&market=from_token`;
  while (url) {
    const antwort = await abruf(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const seite = await jsonOderFehler<ItemsSeite>(antwort);
    for (const { is_local, item } of seite.items) {
      // Lokale Dateien, Podcast-Folgen und gesperrte Songs kann der Tisch nicht abspielen.
      if (is_local || item?.type !== "track" || item.is_playable === false) {
        uebersprungen++;
        continue;
      }
      songs.push({
        id: item.id,
        titel: item.name,
        interpret: item.artists.map((a) => a.name).join(", "),
        isrc: item.external_ids.isrc ?? null,
        spotifyJahr: Number(item.album.release_date.slice(0, 4)),
      });
    }
    url = seite.next;
  }
  return { songs, uebersprungen };
}
