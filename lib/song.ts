export type Song = {
  id: string;
  titel: string;
  interpret: string;
  // Original-Erscheinungsjahr, nicht das Jahr eines Remasters oder Best-ofs.
  jahr: number;
  // Bild des Albums für die Auflösung, Songs der Demo haben keins.
  cover?: string;
  // MusicBrainz kennt das Jahr nicht oder es ist fraglich, der DJ prüft es in der Auflösung (ADR 0007).
  jahrUnsicher?: true;
};
