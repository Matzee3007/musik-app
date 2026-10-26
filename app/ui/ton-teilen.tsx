"use client";

import { useEffect, useRef, useState } from "react";
import Knopf from "@/app/ui/knopf";
import type { RaumKanal } from "@/lib/raum/kanal";
import { tabSchluessel } from "@/lib/raum/speicher";
import { tonSenden } from "@/lib/raum/ton";

// Chrome bietet „Tab-Audio teilen“ nur zusammen mit Video an, das Video stoppt TonTeilen gleich wieder.
// preferCurrentTab: Der Spotify-Player spielt in diesem Tab, Chrome schlägt ihn deshalb gleich vor.
function tabTeilen(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions);
}

// fragt: Chromes Dialog ist offen, ein zweiter Klick startete sonst ein zweites Teilen.
type Zustand =
  | { art: "fragt" }
  | { art: "aus"; hinweis?: string }
  | { art: "teilt"; verbunden: number };

// Im Online-Raum (ADR 0008): Der DJ teilt den Ton seines Tabs mit allen Spielern.
export default function TonTeilen({
  kanal,
  teilen = tabTeilen,
  senden = tonSenden,
}: {
  kanal: RaumKanal;
  // Für Tests: Strom statt Dialog, Senden ohne WebRTC.
  teilen?: () => Promise<MediaStream>;
  senden?: typeof tonSenden;
}) {
  const [zustand, setZustand] = useState<Zustand>({ art: "aus" });
  // Beendet das laufende Teilen, null: es läuft keins.
  const beenden = useRef<(() => void) | null>(null);

  useEffect(() => () => beenden.current?.(), []);

  async function starten() {
    if (zustand.art !== "aus") return;
    setZustand({ art: "fragt" });
    let strom: MediaStream;
    try {
      strom = await teilen();
    } catch (fehler) {
      // Abgebrochen ist kein Fehler: Der DJ hat sich umentschieden.
      const abgebrochen =
        fehler instanceof DOMException && fehler.name === "NotAllowedError";
      setZustand({
        art: "aus",
        hinweis: abgebrochen ? undefined : "Teilen hat nicht geklappt.",
      });
      return;
    }
    for (const bild of strom.getVideoTracks()) bild.stop();
    const spur = strom.getAudioTracks()[0];
    if (!spur) {
      setZustand({
        art: "aus",
        hinweis: "Kein Ton dabei. Beim Teilen „Tab-Audio teilen“ anhaken.",
      });
      return;
    }
    setZustand({ art: "teilt", verbunden: 0 });
    const stopp = senden(kanal, tabSchluessel(), strom, (verbunden) =>
      setZustand({ art: "teilt", verbunden }),
    );
    // Auch für Chromes Leiste „Freigabe beenden“: Dann endet die Spur von selbst.
    function aus() {
      spur.removeEventListener("ended", aus);
      stopp();
      spur.stop();
      beenden.current = null;
      setZustand({ art: "aus" });
    }
    spur.addEventListener("ended", aus);
    beenden.current = aus;
  }

  if (zustand.art === "teilt") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <p className="text-licht/70">
          Ton wird geteilt · {zustand.verbunden} verbunden
        </p>
        <Knopf art="neben" onClick={() => beenden.current?.()}>
          Teilen beenden
        </Knopf>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <Knopf art="neben" onClick={starten} disabled={zustand.art === "fragt"}>
        Ton teilen
      </Knopf>
      {zustand.art === "aus" && zustand.hinweis && (
        <p role="alert" className="max-w-sm text-sm text-signal">
          {zustand.hinweis}
        </p>
      )}
    </div>
  );
}
