"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clientId } from "@/lib/spotify/konfig";
import { anmeldungAbschliessen } from "@/lib/spotify/sitzung";

// Hierher leitet Spotify nach der Anmeldung zurück, mit ?code=… oder ?error=….
export default function Rueckruf({ onFertig }: { onFertig: () => void }) {
  const [fehler, setFehler] = useState<string | null>(null);
  // React führt Effekte im Dev-Modus (StrictMode) doppelt aus, ein Code gilt aber nur einmal.
  const gestartet = useRef(false);

  useEffect(() => {
    if (gestartet.current) return;
    gestartet.current = true;
    anmeldungAbschliessen(
      new URLSearchParams(window.location.search),
      clientId() ?? "",
    )
      .then(onFertig)
      .catch((e: Error) => setFehler(e.message));
  }, [onFertig]);

  if (!fehler) return <p>Anmeldung läuft …</p>;
  return (
    <div className="flex flex-col items-center gap-4">
      <p>{fehler}</p>
      <Link className="underline" href="/">
        Zur Startseite
      </Link>
    </div>
  );
}
