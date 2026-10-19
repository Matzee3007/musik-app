export type Song = {
  id: string;
  titel: string;
  interpret: string;
  // Original-Erscheinungsjahr, nicht das Jahr eines Remasters oder Best-ofs.
  jahr: number;
  // Bild des Albums für die Auflösung, Songs der Demo haben keins.
  cover?: string;
};
