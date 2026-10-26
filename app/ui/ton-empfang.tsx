"use client";

import { useEffect, useRef, useState } from "react";
import Knopf from "@/app/ui/knopf";
import type { RaumKanal } from "@/lib/raum/kanal";
import {
  lautstaerke,
  lautstaerkeSpeichern,
  tabSchluessel,
} from "@/lib/raum/speicher";
import { tonEmpfangen } from "@/lib/raum/ton";

type Zustand = "wartet" | "laeuft" | "blockiert";

// Browser spielen ohne Klick auf der Seite oft nichts ab (etwa nach dem Neuladen), dann "blockiert".
function abspielen(audio: HTMLAudioElement, setZustand: (z: Zustand) => void) {
  audio.play().then(
    () => setZustand("laeuft"),
    () => setZustand("blockiert"),
  );
}

// Im Online-Raum (ADR 0008): spielt beim Spieler den Ton, den der DJ teilt, mit eigener Lautstärke.
export default function TonEmpfang({
  kanal,
  empfangen = tonEmpfangen,
}: {
  kanal: RaumKanal;
  // Für Tests: Empfang ohne WebRTC.
  empfangen?: typeof tonEmpfangen;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [zustand, setZustand] = useState<Zustand>("wartet");
  // Erst nach dem Beitritt gerendert, also nur im Browser: localStorage ist da.
  const [laut, setLaut] = useState(lautstaerke);

  useEffect(() => {
    if (audio.current) audio.current.volume = laut;
  }, [laut]);

  useEffect(
    () =>
      empfangen(kanal, tabSchluessel(), (strom) => {
        const a = audio.current;
        if (!a) return;
        a.srcObject = strom;
        abspielen(a, setZustand);
      }),
    [kanal, empfangen],
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-licht/70">
      <audio ref={audio} />
      <span>
        {zustand === "wartet"
          ? "Ton vom DJ: noch nicht geteilt"
          : zustand === "laeuft"
            ? "Ton vom DJ läuft"
            : "Ton vom DJ ist da"}
      </span>
      {zustand === "blockiert" && (
        <Knopf
          art="neben"
          onClick={() => audio.current && abspielen(audio.current, setZustand)}
        >
          Ton einschalten
        </Knopf>
      )}
      <input
        type="range"
        aria-label="Lautstärke"
        min="0"
        max="1"
        step="0.05"
        value={laut}
        onChange={(e) => {
          const wert = Number(e.target.value);
          lautstaerkeSpeichern(wert);
          setLaut(wert);
        }}
        className="accent-akzent"
      />
    </div>
  );
}
