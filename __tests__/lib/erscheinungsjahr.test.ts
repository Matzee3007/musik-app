import { expect, test } from "vitest";
import {
  gueltigesJahr,
  jahrFuerSpiel,
  markierung,
  type Jahre,
} from "@/lib/erscheinungsjahr";

const remaster: Jahre = { spotify: 2011, musicbrainz: 1975, korrigiert: null };

test("das Spiel nimmt die Korrektur, sonst MusicBrainz, sonst Spotify", () => {
  expect(jahrFuerSpiel(remaster)).toBe(1975);
  expect(jahrFuerSpiel({ ...remaster, korrigiert: 1974 })).toBe(1974);
  expect(jahrFuerSpiel({ ...remaster, musicbrainz: null })).toBe(2011);
});

test("markiert nicht gefunden und MusicBrainz später als Spotify, Remaster nicht", () => {
  expect(markierung(remaster)).toBeNull();
  expect(markierung({ ...remaster, musicbrainz: null })).toBe("nicht gefunden");
  expect(
    markierung({ spotify: 1999, musicbrainz: 2004, korrigiert: null }),
  ).toBe("später als Spotify");
  expect(
    markierung({ spotify: 1999, musicbrainz: null, korrigiert: 1999 }),
  ).toBeNull();
});

test("gueltigesJahr nimmt nur ganze Jahre von 1900 bis heute", () => {
  expect(gueltigesJahr("1975", 2026)).toBe(1975);
  expect(gueltigesJahr(" 2026 ", 2026)).toBe(2026);
  for (const text of ["", "abc", "75", "1899", "2027", "1975.5"]) {
    expect(gueltigesJahr(text, 2026)).toBeNull();
  }
});
