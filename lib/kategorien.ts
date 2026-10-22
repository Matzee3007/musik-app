import type { Song } from "@/lib/song";

export type KategorieId =
  "titel" | "interpret" | "jahrzehnt" | "jahr" | "jahrPlusMinus3";

export type Kategorie = {
  id: KategorieId;
  name: string;
  farbe: string;
  // Was die Auflösung zur gedrehten Kategorie groß zeigt.
  loesung: (song: Song) => string;
};

export const KATEGORIEN: readonly Kategorie[] = [
  { id: "titel", name: "Titel", farbe: "#6fa8dc", loesung: (s) => s.titel },
  {
    id: "interpret",
    name: "Interpret",
    farbe: "#d27ba0",
    loesung: (s) => s.interpret,
  },
  {
    id: "jahrzehnt",
    name: "Jahrzehnt",
    farbe: "#e0955a",
    loesung: (s) => `${Math.floor(s.jahr / 10) * 10}er`,
  },
  { id: "jahr", name: "Jahr", farbe: "#6dbe9c", loesung: (s) => `${s.jahr}` },
  {
    id: "jahrPlusMinus3",
    name: "Jahr ±3",
    farbe: "#9d8bd8",
    loesung: (s) => `${s.jahr - 3} bis ${s.jahr + 3}`,
  },
];
