// Vorbereiten einer Playlist (siehe Glossar): Erscheinungsjahre einmalig ermitteln und je Spotify-Track-ID im
// Browser speichern. Verbindet die Songs von Spotify mit den Regeln aus lib/erscheinungsjahr.ts.
import { jahrFuerSpiel, markierung, type Jahre } from "@/lib/erscheinungsjahr";
import { MusicBrainzBeschaeftigt } from "@/lib/musicbrainz";
import type { Song } from "@/lib/song";
import type { Abruf } from "@/lib/spotify/abruf";
import type { PlaylistSong } from "@/lib/spotify/playlist-songs";

const JAHRE = "musik-app:jahre";
// MusicBrainz erlaubt 1 Anfrage pro Sekunde, etwas Abstand schadet nicht.
const PAUSE_MS = 1100;
// Ist MusicBrainz überlastet (503), kurz warten und neu fragen, höchstens VERSUCHE-mal. Etwa jede fünfte
// Anfrage bekommt 503, weil der gemeinsame Topf aller Nutzer kurz vor dem Auffüllen (alle 2 s) leer ist.
// Nicht 2 s warten: Das trifft immer wieder dieselbe leere Phase. MusicBrainz sendet Retry-After: 0.
const PAUSE_BESCHAEFTIGT_MS = 1000;
const VERSUCHE = 5;

export type GespeicherteJahre = {
  musicbrainz: number | null;
  korrigiert: number | null;
};

export function gespeicherteJahre(): Record<string, GespeicherteJahre> {
  return JSON.parse(localStorage.getItem(JAHRE) ?? "{}");
}

function speichern(trackId: string, eintrag: GespeicherteJahre): void {
  localStorage.setItem(
    JAHRE,
    JSON.stringify({ ...gespeicherteJahre(), [trackId]: eintrag }),
  );
}

// null nimmt die Korrektur zurück.
export function korrekturSpeichern(trackId: string, jahr: number | null): void {
  const alt = gespeicherteJahre()[trackId];
  speichern(trackId, {
    musicbrainz: alt?.musicbrainz ?? null,
    korrigiert: jahr,
  });
}

export function jahreVon(
  song: PlaylistSong,
  gespeichert: Record<string, GespeicherteJahre>,
): Jahre {
  return {
    spotify: song.spotifyJahr,
    musicbrainz: gespeichert[song.id]?.musicbrainz ?? null,
    korrigiert: gespeichert[song.id]?.korrigiert ?? null,
  };
}

// Die Songs fürs Spiel, jeder mit dem Jahr, das die Auflösung zeigt.
export function spielSongs(
  songs: readonly PlaylistSong[],
  gespeichert: Record<string, GespeicherteJahre>,
): Song[] {
  return songs.map((s) => ({
    id: s.id,
    titel: s.titel,
    interpret: s.interpret,
    jahr: jahrFuerSpiel(jahreVon(s, gespeichert)),
    ...(s.cover ? { cover: s.cover } : {}),
    ...(markierung(jahreVon(s, gespeichert)) ? { jahrUnsicher: true } : {}),
  }));
}

// Wie viele Songs ein fragliches Jahr haben, der DJ prüft sie bei der Auflösung (ADR 0007).
export function unsichereJahre(
  songs: readonly PlaylistSong[],
  gespeichert: Record<string, GespeicherteJahre>,
): number {
  return songs.filter((s) => markierung(jahreVon(s, gespeichert)) !== null)
    .length;
}

// Fragt die eigene Route /api/erscheinungsjahr, MusicBrainz selbst nur der Server.
export async function jahrUeberServer(
  isrc: string,
  abruf: Abruf = fetch,
): Promise<number | null> {
  const antwort = await abruf(`/api/erscheinungsjahr?isrc=${isrc}`);
  if (antwort.status === 503) throw new MusicBrainzBeschaeftigt();
  if (!antwort.ok) {
    throw new Error(`Erscheinungsjahr: Server antwortet mit ${antwort.status}`);
  }
  return ((await antwort.json()) as { jahr: number | null }).jahr;
}

function pause(ms: number): Promise<void> {
  return new Promise((fertig) => setTimeout(fertig, ms));
}

export async function vorbereiten(
  songs: readonly PlaylistSong[],
  p: {
    jahrAbfragen?: (isrc: string) => Promise<number | null>;
    warten?: (ms: number) => Promise<void>;
    onFortschritt?: (fertig: number, gesamt: number) => void;
    // Vor jedem Song gefragt, z. B. wenn der DJ "Zurück" geklickt hat. Dann endet es ohne Fehler.
    abgebrochen?: () => boolean;
  } = {},
): Promise<void> {
  const {
    jahrAbfragen = (isrc: string) => jahrUeberServer(isrc),
    warten = pause,
    onFortschritt = () => {},
    abgebrochen = () => false,
  } = p;

  async function mitWiederholung(isrc: string): Promise<number | null> {
    for (let versuch = 1; ; versuch++) {
      try {
        return await jahrAbfragen(isrc);
      } catch (fehler) {
        if (
          !(fehler instanceof MusicBrainzBeschaeftigt) ||
          versuch === VERSUCHE
        ) {
          throw fehler;
        }
        await warten(PAUSE_BESCHAEFTIGT_MS);
      }
    }
  }

  // Schon gespeicherte Songs überspringen, so setzt ein abgebrochenes Vorbereiten fort.
  const gespeichert = gespeicherteJahre();
  const offen = songs.filter((s) => !(s.id in gespeichert));
  onFortschritt(0, offen.length);
  let schonGefragt = false;
  for (const [i, song] of offen.entries()) {
    if (abgebrochen()) return;
    let musicbrainz: number | null = null;
    // Ohne ISRC findet MusicBrainz nichts, dann gar nicht erst fragen.
    if (song.isrc) {
      if (schonGefragt) await warten(PAUSE_MS);
      musicbrainz = await mitWiederholung(song.isrc);
      schonGefragt = true;
    }
    speichern(song.id, { musicbrainz, korrigiert: null });
    onFortschritt(i + 1, offen.length);
  }
}
