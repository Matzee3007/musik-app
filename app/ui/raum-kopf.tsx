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
import type { TischStand } from "@/lib/raum/stand";

// Der Raum am Tisch: Code und QR-Code zum Beitreten, die Spieler und "Raum schließen".
export default function RaumKopf({
  code,
  kanal,
  stand,
  onGeschlossen,
}: {
  code: string;
  kanal: RaumKanal;
  // Spielstand des Tischs, den die Handys über Presence lesen (ADR 0005). null: noch kein Spiel.
  stand: TischStand | null;
  onGeschlossen: () => void;
}) {
  const [liste, setListe] = useState<{
    bekannt: string[];
    anwesende: Anwesend[];
  }>(() => ({ bekannt: tischRaumLaden()?.bekannt ?? [], anwesende: [] }));
  const [fehler, setFehler] = useState<string | null>(null);
  const [verbunden, setVerbunden] = useState(false);

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
      setListe({ bekannt, anwesende });
    }
    const abmelden = kanal.beiAnwesenden(neueAnwesende);
    kanal
      .verbinden()
      .then((anwesende) => {
        neueAnwesende(anwesende);
        setVerbunden(true);
      })
      .catch((e: Error) => setFehler(e.message));
    return abmelden;
  }, [code, kanal]);

  // Nach dem Verbinden und bei jedem neuen Stand: Ein weiteres anmelden ersetzt den Eintrag.
  useEffect(() => {
    if (!verbunden) return;
    kanal
      .anmelden({
        schluessel: tabSchluessel(),
        rolle: "tisch",
        ...(stand && { stand }),
      })
      .catch((e: Error) => setFehler(e.message));
  }, [kanal, verbunden, stand]);

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
        {spielerleiste(
          liste.bekannt,
          liste.anwesende,
          stand?.spiel ?? null,
        ).map((s) => (
          <li
            key={s.name}
            aria-disabled={s.verbunden ? undefined : true}
            className="rounded-full border px-3 py-1 aria-disabled:opacity-40"
          >
            {s.abgehakt === null ? s.name : `${s.name} ${s.abgehakt}`}
          </li>
        ))}
      </ul>
      <button className="underline" onClick={schliessen}>
        Raum schließen
      </button>
    </section>
  );
}
