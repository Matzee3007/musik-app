import type { Karte } from "@/lib/karte";
import { KATEGORIEN } from "@/lib/kategorien";

export default function KarteAnsicht({
  karte,
  onFeldKlick,
  ausgegraut,
  hervorgehoben,
}: {
  karte: Karte;
  onFeldKlick: (index: number) => void;
  // Am Handy: Felder, die gerade nicht abgehakt werden dürfen. Der Klick kommt trotzdem an.
  ausgegraut?: (index: number) => boolean;
  // Am Handy: die Reihe mit Bingo.
  hervorgehoben?: number[];
}) {
  return (
    <section aria-label="Karte" className="grid grid-cols-5 gap-1.5">
      {karte.map((feld, index) => {
        const kategorie = KATEGORIEN.find((k) => k.id === feld.kategorie)!;
        const bingo = hervorgehoben?.includes(index);
        return (
          <button
            key={index}
            aria-label={`Feld ${kategorie.name}`}
            aria-pressed={feld.abgehakt}
            aria-disabled={ausgegraut?.(index) || undefined}
            data-bingo={bingo || undefined}
            onClick={() => onFeldKlick(index)}
            style={{ backgroundColor: kategorie.farbe }}
            className="relative flex aspect-square items-center justify-center rounded-md p-1 text-center text-xs leading-tight font-bold hyphens-auto text-grund outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-50 data-bingo:ring-4 data-bingo:ring-akzent data-bingo:ring-offset-2 data-bingo:ring-offset-grund sm:text-sm"
          >
            {/* Das Wort zuerst: Der Browser-Test misst das erste Kind. Es liegt über dem Stempel. */}
            <span className="relative z-10">{kategorie.name}</span>
            {feld.abgehakt && (
              <span className="stempel absolute inset-[5%] rounded-full border-[5px] border-akzent ring-2 ring-grund/40" />
            )}
          </button>
        );
      })}
    </section>
  );
}
