import type { Karte } from "@/lib/karte";
import { KATEGORIEN } from "@/lib/kategorien";

export default function KarteAnsicht({
  karte,
  onFeldKlick,
  ausgegraut,
  hervorgehoben,
  hoeher,
}: {
  karte: Karte;
  onFeldKlick: (index: number) => void;
  // Am Handy: Felder, die gerade nicht abgehakt werden dürfen. Der Klick kommt trotzdem an.
  ausgegraut?: (index: number) => boolean;
  // Am Handy: die Reihe mit Bingo.
  hervorgehoben?: number[];
  // Am Handy ohne Notizen: Die Karte hat mehr Platz, die Felder werden noch höher.
  hoeher?: boolean;
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
            className={`relative flex ${hoeher ? "aspect-[2/3]" : "aspect-[3/4]"} items-center justify-center rounded-md p-1 text-center text-[13px] leading-tight font-bold hyphens-auto text-grund outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-50 data-bingo:ring-4 data-bingo:ring-akzent data-bingo:ring-offset-2 data-bingo:ring-offset-grund sm:text-sm`}
          >
            {/* Das Wort zuerst: Der Browser-Test misst das erste Kind. Es liegt über dem Stempel. */}
            <span className="relative z-10">{kategorie.name}</span>
            {feld.abgehakt && (
              <svg
                data-kreuz
                aria-hidden
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="stempel absolute inset-0 h-full w-full"
              >
                {/* Unten ein dunkler Rand, oben das Kreuz in der Akzentfarbe: So hebt es sich von jeder Feldfarbe ab. */}
                {(
                  [
                    ["stroke-grund/55", 15],
                    ["stroke-akzent", 9],
                  ] as const
                ).map(([farbe, breite]) => (
                  <g
                    key={farbe}
                    className={farbe}
                    strokeWidth={breite}
                    strokeLinecap="round"
                  >
                    {/* non-scaling-stroke: Das SVG wird aufs Feld gestreckt, die Linien bleiben trotzdem gleich dick. */}
                    <line
                      x1={12}
                      y1={12}
                      x2={88}
                      y2={88}
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={88}
                      y1={12}
                      x2={12}
                      y2={88}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ))}
              </svg>
            )}
          </button>
        );
      })}
    </section>
  );
}
