import { KATEGORIEN, type KategorieId } from "@/lib/kategorien";
import { mischen, type Zufall } from "@/lib/zufall";

export type Feld = { kategorie: KategorieId; abgehakt: boolean };

// 25 Felder zeilenweise: Index = Zeile × 5 + Spalte.
export type Karte = Feld[];

export function karteAusteilen(
  kategorien: readonly KategorieId[],
  zufall: Zufall = Math.random,
): Karte {
  const jeFuenfmal = kategorien.flatMap((id) => Array<KategorieId>(5).fill(id));
  return mischen(jeFuenfmal, zufall).map((kategorie) => ({
    kategorie,
    abgehakt: false,
  }));
}

// Eine Karte mit allen Kategorien, für das Spiel am Tisch und am Handy.
export function karteNeu(zufall: Zufall = Math.random): Karte {
  return karteAusteilen(
    KATEGORIEN.map((k) => k.id),
    zufall,
  );
}

export function feldSetzen(
  karte: Karte,
  index: number,
  abgehakt: boolean,
): Karte {
  return karte.map((feld, i) => (i === index ? { ...feld, abgehakt } : feld));
}
