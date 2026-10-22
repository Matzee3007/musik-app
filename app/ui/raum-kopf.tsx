"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { RaumKanal } from "@/lib/raum/kanal";
import {
  tabSchluessel,
  tischRaumLaden,
  tischRaumLoeschen,
  tischRaumSpeichern,
} from "@/lib/raum/speicher";
import { spielerleiste, type Anwesend } from "@/lib/raum/spieler";

// Der Raum am Tisch: Code und QR-Code zum Beitreten, die Spieler und "Raum schließen".
export default function RaumKopf({
  code,
  kanal,
  onGeschlossen,
}: {
  code: string;
  kanal: RaumKanal;
  onGeschlossen: () => void;
}) {
  const [stand, setStand] = useState<{
    bekannt: string[];
    anwesende: Anwesend[];
  }>(() => ({ bekannt: tischRaumLaden()?.bekannt ?? [], anwesende: [] }));
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    // Wer einmal da war, bleibt in der Leiste, auch nach dem Neuladen des Tischs.
    function neueAnwesende(anwesende: Anwesend[]) {
      // Nach "Raum schließen" ist nichts mehr gespeichert, ein später Abgleich legt den Raum nicht neu an.
      const raum = tischRaumLaden();
      if (!raum) return;
      const bekannt = spielerleiste(raum.bekannt, anwesende, null).map(
        (s) => s.name,
      );
      tischRaumSpeichern({ code, bekannt });
      setStand({ bekannt, anwesende });
    }
    const abmelden = kanal.beiAnwesenden(neueAnwesende);
    kanal
      .verbinden()
      .then((anwesende) => {
        neueAnwesende(anwesende);
        return kanal.anmelden({ schluessel: tabSchluessel(), rolle: "tisch" });
      })
      .catch((e: Error) => setFehler(e.message));
    return abmelden;
  }, [code, kanal]);

  async function schliessen() {
    // Erst wenn alle Bescheid wissen, sonst warten Handys in einem Raum ohne Tisch.
    try {
      await kanal.senden({ art: "geschlossen" });
    } catch (e) {
      setFehler((e as Error).message);
      return;
    }
    kanal.trennen();
    tischRaumLoeschen();
    onGeschlossen();
  }

  return (
    <section className="flex flex-col items-center gap-3">
      <p className="text-5xl font-bold tracking-widest">{code}</p>
      <QRCodeSVG
        value={`${window.location.origin}/raum/${code}`}
        title={`QR-Code für Raum ${code}`}
        size={160}
        marginSize={2}
      />
      {fehler && <p className="text-sm">{fehler}</p>}
      <ul className="flex flex-wrap justify-center gap-2">
        {spielerleiste(stand.bekannt, stand.anwesende, null).map((s) => (
          <li
            key={s.name}
            aria-disabled={s.verbunden ? undefined : true}
            className="rounded-full border px-3 py-1 aria-disabled:opacity-40"
          >
            {s.name}
          </li>
        ))}
      </ul>
      <button className="underline" onClick={schliessen}>
        Raum schließen
      </button>
    </section>
  );
}
