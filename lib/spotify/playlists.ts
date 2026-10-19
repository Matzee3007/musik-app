import { jsonOderFehler, type Abruf } from "@/lib/spotify/abruf";

export type Playlist = { id: string; name: string; anzahlSongs: number };

// Seit Februar 2026 fehlt "items" bei Playlists, die dem DJ weder gehören noch mit ihm geteilt sind.
type PlaylistSeite = {
  items: { id: string; name: string; items?: { total: number } }[];
  next: string | null;
};

export async function eigenePlaylists(
  accessToken: string,
  abruf: Abruf = fetch,
): Promise<Playlist[]> {
  const playlists: Playlist[] = [];
  // Spotify liefert höchstens 50 je Seite, "next" zeigt auf die nächste oder ist null.
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";
  while (url) {
    const antwort = await abruf(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const seite = await jsonOderFehler<PlaylistSeite>(antwort);
    for (const p of seite.items) {
      if (p.items) {
        playlists.push({ id: p.id, name: p.name, anzahlSongs: p.items.total });
      }
    }
    url = seite.next;
  }
  return playlists;
}
