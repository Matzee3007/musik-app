import {
  erscheinungsjahrLaden,
  MusicBrainzBeschaeftigt,
} from "@/lib/musicbrainz";

// ISRC: Land (2 Buchstaben), Kennung (3 Zeichen), Jahr und Nummer (7 Ziffern). Alles andere wird
// abgelehnt, damit niemand über diese Route beliebige Adressen bei MusicBrainz abfragt.
const ISRC = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

// GET /api/erscheinungsjahr?isrc=… → { jahr }. MusicBrainz verlangt einen eigenen User-Agent,
// deshalb fragt der Server statt des Browsers.
export async function GET(request: Request): Promise<Response> {
  const isrc = new URL(request.url).searchParams.get("isrc") ?? "";
  if (!ISRC.test(isrc)) {
    return Response.json({ fehler: "kein gültiger ISRC" }, { status: 400 });
  }
  try {
    return Response.json({ jahr: await erscheinungsjahrLaden(isrc) });
  } catch (fehler) {
    if (fehler instanceof MusicBrainzBeschaeftigt) {
      return Response.json({ fehler: "beschäftigt" }, { status: 503 });
    }
    throw fehler;
  }
}
