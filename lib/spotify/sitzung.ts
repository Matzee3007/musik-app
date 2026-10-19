// Anmeldung des DJs im Browser (ADR 0003): Verifier und State bis zur Rückkehr von Spotify im
// sessionStorage, das Token dauerhaft im localStorage.
import { SpotifyFehler, type Abruf } from "@/lib/spotify/abruf";
import { anmeldeUrl, codeChallenge, zufallsText } from "@/lib/spotify/pkce";
import {
  codeTauschen,
  istAbgelaufen,
  tokenErneuern,
  type Token,
} from "@/lib/spotify/token";

const ANMELDUNG = "musik-app:anmeldung";
const TOKEN = "musik-app:spotify-token";

// Meldung für den DJ, die Rückruf-Seite zeigt sie an.
export class AnmeldeFehler extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnmeldeFehler";
  }
}

function redirectUri(): string {
  return `${window.location.origin}/callback`;
}

export async function anmeldungStarten(clientId: string): Promise<string> {
  const verifier = zufallsText(64);
  const state = zufallsText(16);
  sessionStorage.setItem(ANMELDUNG, JSON.stringify({ verifier, state }));
  return anmeldeUrl({
    clientId,
    redirectUri: redirectUri(),
    challenge: await codeChallenge(verifier),
    state,
  });
}

export async function anmeldungAbschliessen(
  suche: URLSearchParams,
  clientId: string,
  abruf: Abruf = fetch,
  jetzt: number = Date.now(),
): Promise<Token> {
  if (suche.has("error")) {
    throw new AnmeldeFehler("Anmeldung abgebrochen.");
  }
  const gemerkt = sessionStorage.getItem(ANMELDUNG);
  // Vor dem Tausch löschen: Ein Code gilt nur einmal, ein zweiter Aufruf endet hier als ungültig.
  sessionStorage.removeItem(ANMELDUNG);
  const ungueltig = new AnmeldeFehler(
    "Anmeldung ungültig, bitte neu anmelden.",
  );
  if (!gemerkt) throw ungueltig;
  const { verifier, state } = JSON.parse(gemerkt) as {
    verifier: string;
    state: string;
  };
  if (suche.get("state") !== state) throw ungueltig;
  const token = await codeTauschen(
    {
      code: suche.get("code")!,
      verifier,
      clientId,
      redirectUri: redirectUri(),
    },
    abruf,
    jetzt,
  );
  localStorage.setItem(TOKEN, JSON.stringify(token));
  return token;
}

export async function gueltigesToken(
  clientId: string,
  abruf: Abruf = fetch,
  jetzt: number = Date.now(),
): Promise<Token | null> {
  const gespeichert = localStorage.getItem(TOKEN);
  if (!gespeichert) return null;
  const alt = JSON.parse(gespeichert) as Token;
  if (!istAbgelaufen(alt, jetzt)) return alt;
  try {
    const neu = await tokenErneuern(alt.refreshToken, clientId, abruf, jetzt);
    localStorage.setItem(TOKEN, JSON.stringify(neu));
    return neu;
  } catch (fehler) {
    // 400: Spotify kennt das Refresh-Token nicht mehr, z. B. weil der DJ den Zugriff entzogen hat.
    // Andere Fehler (kein Netz) weiterwerfen, sonst wäre der DJ bei jedem Funkloch abgemeldet.
    if (fehler instanceof SpotifyFehler && fehler.status === 400) {
      abmelden();
      return null;
    }
    throw fehler;
  }
}

export function abmelden(): void {
  localStorage.removeItem(TOKEN);
}
