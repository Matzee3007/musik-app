"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Knopf from "@/app/ui/knopf";
import type { RaumKanal } from "@/lib/raum/kanal";
import {
  lautstaerke,
  lautstaerkeSpeichern,
  tabSchluessel,
} from "@/lib/raum/speicher";
import { tonEmpfangen } from "@/lib/raum/ton";

type Zustand = "wartet" | "laeuft" | "blockiert";

// Im Online-Raum (ADR 0008): spielt beim Spieler den Ton, den der DJ teilt, mit eigener Lautstärke. Der Ton läuft über
// Web Audio (Quelle → Verstärker → Lautsprecher): Safari auf dem iPhone ignoriert audio.volume. Chrome gibt den Ton
// einer WebRTC-Verbindung aber nur an Web Audio weiter, wenn er auch in einem <audio> läuft, das bleibt deshalb da,
// stumm, sonst klänge der Ton doppelt.
export default function TonEmpfang({
  kanal,
  empfangen = tonEmpfangen,
  kontextNeu = () => new AudioContext(),
}: {
  kanal: RaumKanal;
  // Für Tests: Empfang ohne WebRTC, Web Audio ohne Lautsprecher.
  empfangen?: typeof tonEmpfangen;
  kontextNeu?: () => AudioContext;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const kontext = useRef<AudioContext | null>(null);
  const verstaerker = useRef<GainNode | null>(null);
  const quelle = useRef<MediaStreamAudioSourceNode | null>(null);
  const [zustand, setZustand] = useState<Zustand>("wartet");
  // Erst nach dem Beitritt gerendert, also nur im Browser: localStorage ist da.
  const [laut, setLaut] = useState(lautstaerke);

  // Browser lassen Web Audio ohne Klick auf der Seite oft nicht spielen (etwa nach dem Neuladen), dann "blockiert".
  function starten() {
    const k = kontext.current;
    if (!k) return;
    audio.current?.play().catch(() => {});
    k.resume().catch(() => {});
    setZustand(k.state === "running" ? "laeuft" : "blockiert");
  }

  const bekommen = useEffectEvent((strom: MediaStream | null) => {
    const a = audio.current;
    if (!a) return;
    quelle.current?.disconnect();
    quelle.current = null;
    a.srcObject = strom;
    if (!strom) {
      setZustand("wartet");
      return;
    }
    a.muted = true;
    if (!kontext.current) {
      const k = kontextNeu();
      kontext.current = k;
      verstaerker.current = k.createGain();
      verstaerker.current.connect(k.destination);
      // Erlaubt der Browser das Spielen später (Klick auf der Seite), geht es von selbst weiter.
      k.onstatechange = () => {
        if (a.srcObject)
          setZustand(k.state === "running" ? "laeuft" : "blockiert");
      };
    }
    verstaerker.current!.gain.value = laut;
    quelle.current = kontext.current.createMediaStreamSource(strom);
    quelle.current.connect(verstaerker.current!);
    starten();
  });

  useEffect(() => {
    const ende = empfangen(kanal, tabSchluessel(), bekommen);
    return () => {
      ende();
      kontext.current?.close().catch(() => {});
      kontext.current = null;
      verstaerker.current = null;
      quelle.current = null;
    };
  }, [kanal, empfangen]);

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
        <Knopf art="neben" onClick={starten}>
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
          if (verstaerker.current) verstaerker.current.gain.value = wert;
        }}
        className="accent-akzent"
      />
    </div>
  );
}
