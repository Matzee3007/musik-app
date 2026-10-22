// Zeigt am Tisch, dass Musik läuft: Balken in der Farbe der Kategorie und, beim Ausschnitt, ein Fortschritt.
// Eine echte Wellenform gibt es nicht, Spotify bietet neuen Apps keine Audio-Analyse mehr.
const BALKEN = [0.9, 0.7, 1.1, 0.8, 1.0];

export default function Musikspur({
  farbe,
  laeuft,
  dauerMs,
}: {
  farbe: string;
  laeuft: boolean;
  dauerMs: number | null;
}) {
  return (
    <div
      role="img"
      aria-label={laeuft ? "Musikspur läuft" : "Musikspur steht"}
      className={`flex w-40 flex-col gap-2 ${laeuft ? "" : "musikspur-steht"}`}
    >
      <div className="flex h-16 items-end justify-center gap-2">
        {BALKEN.map((dauer, i) => (
          <span
            key={i}
            className="musikspur-balken h-full w-4 rounded-t"
            style={{
              backgroundColor: farbe,
              animationDuration: `${dauer}s`,
              animationDelay: `${-i * 0.2}s`,
            }}
          />
        ))}
      </div>
      {dauerMs !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded bg-boden">
          <div
            className="musikspur-fortschritt h-full"
            style={{
              backgroundColor: farbe,
              animationDuration: `${dauerMs}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}
