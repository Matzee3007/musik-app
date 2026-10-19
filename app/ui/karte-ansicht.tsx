import type { Karte } from "@/lib/karte";
import { KATEGORIEN } from "@/lib/kategorien";

export default function KarteAnsicht({
  karte,
  onFeldKlick,
}: {
  karte: Karte;
  onFeldKlick: (index: number) => void;
}) {
  return (
    <section aria-label="Karte" className="grid grid-cols-5 gap-2">
      {karte.map((feld, index) => {
        const kategorie = KATEGORIEN.find((k) => k.id === feld.kategorie)!;
        return (
          <button
            key={index}
            aria-label={`Feld ${kategorie.name}`}
            aria-pressed={feld.abgehakt}
            onClick={() => onFeldKlick(index)}
            style={{ backgroundColor: kategorie.farbe }}
            className="relative flex aspect-square items-center justify-center rounded-lg p-1 text-center text-xs font-semibold text-zinc-950 sm:text-sm"
          >
            {kategorie.name}
          </button>
        );
      })}
    </section>
  );
}
