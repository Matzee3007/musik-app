"use client";

import { useState } from "react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
import Tisch from "@/app/ui/tisch";
import { hatBingo } from "@/lib/bingo";
import type { Song } from "@/lib/song";
import {
  abhakenZuruecknehmen,
  feldAbhaken,
  loesungAnzeigen,
  rundeStarten,
  spielStarten,
  stapelNeuMischen,
  type Spiel,
} from "@/lib/spiel";
import type { Zufall } from "@/lib/zufall";

export default function SpielAnsicht({
  songs,
  zufall = Math.random,
  sofort = false,
}: {
  songs: readonly Song[];
  zufall?: Zufall;
  // Ohne eigenen Knopf starten, wenn schon vorher geklickt wurde (z. B. in der Songliste).
  sofort?: boolean;
}) {
  // Startet sonst erst nach dem Klick: Zufall beim ersten Rendern gäbe auf Server und
  // Browser verschiedene Karten (Hydration-Fehler). Mit sofort erscheint die Ansicht erst nach
  // einem Klick, nie beim ersten Rendern auf dem Server.
  const [spiel, setSpiel] = useState<Spiel | null>(() =>
    sofort ? spielStarten(songs, zufall) : null,
  );

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
        stapelLeer={spiel.stapel.length === 0}
        bingo={hatBingo(spiel.karte)}
        onRadDrehen={() => setSpiel(rundeStarten(spiel, zufall))}
        onLoesungAnzeigen={() => setSpiel(loesungAnzeigen(spiel))}
        onVonVorn={() => setSpiel(stapelNeuMischen(spiel, songs, zufall))}
        onNeuesSpiel={() => setSpiel(spielStarten(songs, zufall))}
      />
      <KarteAnsicht
        karte={spiel.karte}
        onFeldKlick={(index) => {
          if (!spiel.karte[index].abgehakt) {
            setSpiel(feldAbhaken(spiel, index));
          } else if (window.confirm("Abhaken zurücknehmen?")) {
            setSpiel(abhakenZuruecknehmen(spiel, index));
          }
        }}
      />
    </div>
  );
}
