// Die Jahre eines Songs aus verschiedenen Quellen, siehe "Erscheinungsjahr" im Glossar.
export type Jahre = {
  // Jahr des Albums bei Spotify, bei Remastern und Best-ofs oft zu spät.
  spotify: number;
  musicbrainz: number | null;
  korrigiert: number | null;
};

export function jahrFuerSpiel(j: Jahre): number {
  return j.korrigiert ?? j.musicbrainz ?? j.spotify;
}

// Was der DJ in der Songliste prüfen sollte. Ein korrigierter Song gilt als geprüft.
export function markierung(
  j: Jahre,
): "nicht gefunden" | "später als Spotify" | null {
  if (j.korrigiert !== null) return null;
  if (j.musicbrainz === null) return "nicht gefunden";
  // Die erste Veröffentlichung kann nicht nach dem Album liegen, also ist wohl die falsche Aufnahme getroffen.
  if (j.musicbrainz > j.spotify) return "später als Spotify";
  return null;
}

// Korrektur aus dem Eingabefeld: nur ganze Jahre von 1900 bis bisJahr, sonst null.
export function gueltigesJahr(text: string, bisJahr: number): number | null {
  const getrimmt = text.trim();
  if (!/^\d{4}$/.test(getrimmt)) return null;
  const jahr = Number(getrimmt);
  return jahr >= 1900 && jahr <= bisJahr ? jahr : null;
}
