import type { Song } from "@/lib/song";

// Id als Kurzform "<interpret>-<titel>", z. B. "queen-bohemian-rhapsody".
function song(interpret: string, titel: string, jahr: number): Song {
  const id = `${interpret} ${titel}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { id, titel, interpret, jahr };
}

// Feste Songliste für Phase 1, bis die Songs aus einer Spotify-Playlist kommen.
export const SONGLISTE: readonly Song[] = [
  song("Elvis Presley", "Jailhouse Rock", 1957),
  song("Chuck Berry", "Johnny B. Goode", 1958),
  song("The Rolling Stones", "(I Can't Get No) Satisfaction", 1965),
  song("The Beatles", "Hey Jude", 1968),
  song("Queen", "Bohemian Rhapsody", 1975),
  song("ABBA", "Dancing Queen", 1976),
  song("Bee Gees", "Stayin' Alive", 1977),
  song("Gloria Gaynor", "I Will Survive", 1978),
  song("Survivor", "Eye of the Tiger", 1982),
  song("Cyndi Lauper", "Girls Just Want to Have Fun", 1983),
  song("Nena", "99 Luftballons", 1983),
  song("Bon Jovi", "Livin' on a Prayer", 1986),
  song("Whitney Houston", "I Wanna Dance with Somebody", 1987),
  song("Nirvana", "Smells Like Teen Spirit", 1991),
  song("Haddaway", "What Is Love", 1993),
  song("Oasis", "Wonderwall", 1995),
  song("Spice Girls", "Wannabe", 1996),
  song("Britney Spears", "...Baby One More Time", 1998),
  song("Eminem", "Lose Yourself", 2002),
  song("Beyoncé", "Crazy in Love", 2003),
  song("Amy Winehouse", "Rehab", 2006),
  song("Rihanna", "Umbrella", 2007),
  song("Adele", "Rolling in the Deep", 2010),
  song("Daft Punk", "Get Lucky", 2013),
  song("The Weeknd", "Blinding Lights", 2019),
];
