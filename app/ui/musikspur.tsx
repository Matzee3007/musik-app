import { useEffect, useRef } from "react";
import { wellenPunkte } from "@/app/ui/welle";

// Zeigt am Tisch, dass Musik läuft: eine bewegte Wellenlinie in der Farbe der Kategorie und, beim Ausschnitt, ein
// Fortschritt. Eine echte Wellenform gibt es nicht, Spotify bietet neuen Apps keine Audio-Analyse mehr.
// Steht der Song, sinkt die Welle auf diese Stärke.
const STEHT = 0.18;

function punkte(sekunden: number, staerke: number) {
  return wellenPunkte(sekunden, staerke)
    .map((p) => p.join(","))
    .join(" ");
}

// Bis der Effekt läuft. Bleibt der Wert gleich, setzt React das Attribut nie wieder und überschreibt die Schleife nicht.
const ANFANG = punkte(0, 1);

export default function Musikspur({
  farbe,
  laeuft,
  dauerMs,
}: {
  farbe: string;
  laeuft: boolean;
  dauerMs: number | null;
}) {
  const linie = useRef<SVGPolylineElement>(null);
  const ziel = laeuft ? 1 : STEHT;
  // Über den Wechsel von "läuft" zu "steht" hinweg, damit die Welle sanft absinkt statt zu springen.
  const staerke = useRef(ziel);

  // Jedes Bild setzt nur die Punkte der Linie, ohne React-State: sonst zeichnete React 60-mal pro Sekunde neu.
  useEffect(() => {
    const ruhig = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (ruhig || typeof requestAnimationFrame === "undefined") {
      staerke.current = ziel;
      linie.current?.setAttribute("points", punkte(0, ziel));
      return;
    }
    let bild = 0;
    let letzte = performance.now();
    function zeichnen(jetzt: number) {
      // In etwa 250 ms beim Ziel.
      staerke.current +=
        (ziel - staerke.current) * Math.min(1, (jetzt - letzte) / 250);
      letzte = jetzt;
      linie.current?.setAttribute(
        "points",
        punkte(jetzt / 1000, staerke.current),
      );
      bild = requestAnimationFrame(zeichnen);
    }
    bild = requestAnimationFrame(zeichnen);
    return () => cancelAnimationFrame(bild);
  }, [ziel]);

  return (
    <div
      role="img"
      aria-label={laeuft ? "Musikspur läuft" : "Musikspur steht"}
      className={`flex w-[21rem] max-w-full flex-col gap-2 ${laeuft ? "" : "musikspur-steht"}`}
    >
      <svg
        viewBox="0 0 240 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-[5.6rem] w-full overflow-visible"
      >
        <polyline
          ref={linie}
          points={ANFANG}
          fill="none"
          stroke={farbe}
          strokeWidth="7px"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {dauerMs !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded bg-flaeche">
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
