// Client-ID der Spotify-App aus .env.local. Bei jedem Aufruf gelesen, damit Tests sie setzen können.
export function clientId(): string | undefined {
  return process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || undefined;
}
