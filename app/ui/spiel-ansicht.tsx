"use client";

import { useState } from "react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
import Tisch from "@/app/ui/tisch";
import type { Song } from "@/lib/song";
import {
  loesungAnzeigen,
  rundeStarten,
  spielStarten,
  type Spiel,
} from "@/lib/spiel";
import type { Zufall } from "@/lib/zufall";

export default function SpielAnsicht({
  songs,
  zufall = Math.random,
}: {
  songs: readonly Song[];
  zufall?: Zufall;
}) {
  // Startet erst nach dem Klick: Zufall beim ersten Rendern gäbe auf Server und
  // Browser verschiedene Karten (Hydration-Fehler).
  const [spiel, setSpiel] = useState<Spiel | null>(null);

  if (!spiel) {
    return (
      <button
        className="rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background"
        onClick={() => setSpiel(spielStarten(songs, zufall))}
      >
        Spiel starten
      </button>
    );
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
      <Tisch
        runde={spiel.runde}
        onRadDrehen={() => setSpiel(rundeStarten(spiel, zufall))}
        onLoesungAnzeigen={() => setSpiel(loesungAnzeigen(spiel))}
      />
      <KarteAnsicht karte={spiel.karte} onFeldKlick={() => {}} />
    </div>
  );
}
