const ANZAHL = 24;
// Abstand der Birnen von der Mitte in Prozent der Breite: auf dem Rand um das Rad.
const RADIUS = 46;

// Glühbirnen rund ums Rad wie in einer Spielshow. "lauf": Lauflicht beim Drehen, "bingo": alle blinken.
export default function Birnenkranz({
  modus,
}: {
  modus: "ruhig" | "lauf" | "bingo";
}) {
  return (
    <div
      aria-hidden
      data-modus={modus}
      className="birnenkranz pointer-events-none absolute inset-0"
    >
      {Array.from({ length: ANZAHL }, (_, i) => {
        const bogen = (i / ANZAHL) * 2 * Math.PI;
        return (
          <span
            key={i}
            className="birne absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-birne"
            style={
              {
                left: `${50 + RADIUS * Math.sin(bogen)}%`,
                top: `${50 - RADIUS * Math.cos(bogen)}%`,
                "--i": i,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
