import { jsonOderFehler, type Abruf } from "@/lib/spotify/abruf";

export type Playlist = { id: string; name: string; anzahlSongs: number };

// Seit Februar 2026 gibt Spotify die Songs nur bei Playlists heraus, die dem DJ gehören oder mit ihm geteilt sind.
// Bei anderen fehlt "items" meist, bei gefolgten steht es aber da, deshalb zählen Besitzer und "collaborative".
type PlaylistSeite = {
  items: {
    id: string;
    name: string;
    owner: { id: string };
    collaborative?: boolean;
    items?: { total: number };
  }[];
  next: string | null;
};

export async function eigenePlaylists(
  accessToken: string,
  abruf: Abruf = fetch,
): Promise<Playlist[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const dj = await jsonOderFehler<{ id: string }>(
    await abruf("https://api.spotify.com/v1/me", { headers }),
  );
  const playlists: Playlist[] = [];
  // Spotify liefert höchstens 50 je Seite, "next" zeigt auf die nächste oder ist null.
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";
  while (url) {
    const antwort = await abruf(url, { headers });
    const seite = await jsonOderFehler<PlaylistSeite>(antwort);
    for (const p of seite.items) {
      if (p.items && (p.owner.id === dj.id || p.collaborative)) {
        playlists.push({ id: p.id, name: p.name, anzahlSongs: p.items.total });
      }
    }
    url = seite.next;
  }
  return playlists;
}
