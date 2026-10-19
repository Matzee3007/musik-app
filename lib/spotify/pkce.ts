// Bausteine für die Spotify-Anmeldung mit PKCE (RFC 7636), siehe ADR 0003.

// Schon die Rechte für das Abspielen (Plan C), damit der DJ sich dann nicht neu anmelden muss.
export const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

export function anmeldeUrl(p: {
  clientId: string;
  redirectUri: string;
  challenge: string;
  state: string;
}): string {
  const parameter = new URLSearchParams({
    client_id: p.clientId,
    response_type: "code",
    redirect_uri: p.redirectUri,
    code_challenge_method: "S256",
    code_challenge: p.challenge,
    state: p.state,
    scope: SCOPES,
  });
  return `https://accounts.spotify.com/authorize?${parameter}`;
}

// Die 66 Zeichen, die RFC 7636 für den code_verifier erlaubt.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export function zufallsText(laenge: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(laenge));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// SHA-256 des Verifiers als Base64url ohne "=", wie Spotify es bei "S256" erwartet.
export async function codeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
