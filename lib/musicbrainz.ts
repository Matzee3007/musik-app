// Erscheinungsjahr aus MusicBrainz über den ISRC eines Songs (Architekturprinzip 4).
import type { Abruf } from "@/lib/spotify/abruf";

// MusicBrainz verlangt "Name/Version ( Kontakt )". Keine persönlichen Daten ohne Rückfrage beim Entwickler.
export const USER_AGENT =
  "musik-app/0.1 ( https://github.com/Matzee3007/musik-app )";

// MusicBrainz antwortet mit 503, wenn es zu viele Anfragen bekommt. Dann später erneut fragen.
export class MusicBrainzBeschaeftigt extends Error {
  constructor() {
    super("MusicBrainz ist gerade überlastet.");
    this.name = "MusicBrainzBeschaeftigt";
  }
}

// Antwort von /ws/2/isrc/<isrc>, nur die Felder, die wir brauchen.
export type IsrcAntwort = { recordings: { "first-release-date"?: string }[] };

// Mehrere Aufnahmen zu einem ISRC kommen vor, dann gilt die früheste. Daten haben die Form
// "1975", "1975-11" oder "1975-11-21", manchmal fehlen sie oder sind leer.
export function jahrAusMusicBrainz(antwort: IsrcAntwort): number | null {
  const jahre = antwort.recordings
    .map((r) => r["first-release-date"])
    .filter((datum): datum is string => !!datum)
    .map((datum) => Number(datum.slice(0, 4)));
  return jahre.length > 0 ? Math.min(...jahre) : null;
}

export async function erscheinungsjahrLaden(
  isrc: string,
  abruf: Abruf = fetch,
): Promise<number | null> {
  const antwort = await abruf(
    `https://musicbrainz.org/ws/2/isrc/${isrc}?fmt=json`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
  );
  // 404: MusicBrainz kennt den ISRC nicht, der Song gilt dann als "nicht gefunden".
  if (antwort.status === 404) return null;
  if (antwort.status === 503) throw new MusicBrainzBeschaeftigt();
  if (!antwort.ok) {
    throw new Error(`MusicBrainz antwortet mit ${antwort.status}`);
  }
  return jahrAusMusicBrainz((await antwort.json()) as IsrcAntwort);
}
