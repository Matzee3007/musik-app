import { jsonOderFehler, type Abruf } from "@/lib/spotify/abruf";

// ablauf: Zeitpunkt in Millisekunden seit 1970, ab dem das Access-Token nicht mehr gilt.
export type Token = {
  accessToken: string;
  refreshToken: string;
  ablauf: number;
};

type TokenAntwort = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

async function tokenAnfragen(
  parameter: Record<string, string>,
  abruf: Abruf,
): Promise<TokenAntwort> {
  const antwort = await abruf("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameter).toString(),
  });
  return jsonOderFehler<TokenAntwort>(antwort);
}

export async function codeTauschen(
  p: { code: string; verifier: string; clientId: string; redirectUri: string },
  abruf: Abruf = fetch,
  jetzt: number = Date.now(),
): Promise<Token> {
  const daten = await tokenAnfragen(
    {
      grant_type: "authorization_code",
      code: p.code,
      redirect_uri: p.redirectUri,
      client_id: p.clientId,
      code_verifier: p.verifier,
    },
    abruf,
  );
  return {
    accessToken: daten.access_token,
    refreshToken: daten.refresh_token ?? "",
    ablauf: jetzt + daten.expires_in * 1000,
  };
}

export async function tokenErneuern(
  refreshToken: string,
  clientId: string,
  abruf: Abruf = fetch,
  jetzt: number = Date.now(),
): Promise<Token> {
  const daten = await tokenAnfragen(
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    },
    abruf,
  );
  return {
    accessToken: daten.access_token,
    // Spotify schickt nicht immer ein neues Refresh-Token, dann gilt das alte weiter.
    refreshToken: daten.refresh_token ?? refreshToken,
    ablauf: jetzt + daten.expires_in * 1000,
  };
}

// 60 Sekunden Puffer, damit das Token nicht mitten in einer Anfrage abläuft.
export function istAbgelaufen(
  token: Token,
  jetzt: number = Date.now(),
): boolean {
  return jetzt >= token.ablauf - 60_000;
}
