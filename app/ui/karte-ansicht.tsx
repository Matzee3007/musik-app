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
    <section aria-label="Karte" className="grid grid-cols-5 gap-2">
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
            className="relative flex aspect-square items-center justify-center rounded-lg p-1 text-center text-xs font-semibold text-zinc-950 aria-disabled:opacity-40 data-bingo:ring-4 data-bingo:ring-foreground sm:text-sm"
          >
            {kategorie.name}
            {feld.abgehakt && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/40 text-4xl text-zinc-950">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}
