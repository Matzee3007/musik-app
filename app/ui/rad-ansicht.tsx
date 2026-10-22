import { KATEGORIEN } from "@/lib/kategorien";
import type { Runde } from "@/lib/spiel";

const MITTE = 100;
const RADIUS = 95;

// Drehwinkel im Uhrzeigersinn, bei dem Segment `index` oben unter dem Zeiger steht.
// Fünf volle Umdrehungen je Runde, damit das Rad jede Runde vorwärts dreht.
export function radWinkel(nummer: number, index: number, anzahl: number) {
  const segment = 360 / anzahl;
  return nummer * 1800 - (index * segment + segment / 2);
}

// Punkt auf dem Kreis, Winkel in Grad ab oben im Uhrzeigersinn.
function punkt(grad: number, radius: number) {
  const bogen = (grad * Math.PI) / 180;
  return [MITTE + radius * Math.sin(bogen), MITTE - radius * Math.cos(bogen)];
}

export default function RadAnsicht({
  runde,
  onStillstand,
}: {
  runde: Runde | null;
  onStillstand: () => void;
}) {
  const segment = 360 / KATEGORIEN.length;
  const winkel = runde
    ? radWinkel(
        runde.nummer,
        KATEGORIEN.findIndex((k) => k.id === runde.kategorie.id),
        KATEGORIEN.length,
      )
    : 0;

  return (
    <div className="relative w-full">
      {/* Zeiger oben */}
      <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[12px] border-t-[22px] border-x-transparent border-t-akzent" />
      <svg
        role="img"
        aria-label="Rad"
        viewBox="0 0 200 200"
        onTransitionEnd={onStillstand}
        style={{
          transform: `rotate(${winkel}deg)`,
          transition: runde
            ? "transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)"
            : "none",
        }}
      >
        {KATEGORIEN.map((kategorie, i) => {
          const [x0, y0] = punkt(i * segment, RADIUS);
          const [x1, y1] = punkt((i + 1) * segment, RADIUS);
          const mitte = i * segment + segment / 2;
          const [tx, ty] = punkt(mitte, RADIUS * 0.6);
          return (
            <g key={kategorie.id}>
              <path
                d={`M${MITTE} ${MITTE} L${x0} ${y0} A${RADIUS} ${RADIUS} 0 0 1 ${x1} ${y1} Z`}
                fill={kategorie.farbe}
                className="stroke-grund"
                strokeWidth="2"
              />
              <text
                x={tx}
                y={ty}
                transform={`rotate(${mitte} ${tx} ${ty})`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-grund font-schild text-[12px]"
              >
                {kategorie.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
