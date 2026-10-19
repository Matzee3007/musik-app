export type Song = {
  id: string;
  titel: string;
  interpret: string;
  // Original-Erscheinungsjahr, nicht das Jahr eines Remasters oder Best-ofs.
  jahr: number;
};
