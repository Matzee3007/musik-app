"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { RaumKanal } from "@/lib/raum/kanal";
import {
  raumSichtbar,
  raumSichtbarSpeichern,
  tabSchluessel,
  tischRaumLaden,
  tischRaumLoeschen,
  tischRaumSpeichern,
} from "@/lib/raum/speicher";
import { spielerleiste, type Anwesend } from "@/lib/raum/spieler";
import type { SpielerStaende, TischStand } from "@/lib/raum/stand";

// Der Raum am Tisch: Code und QR-Code zum Beitreten, die Spieler und "Raum schließen".
export default function RaumKopf({
  code,
  kanal,
  stand,
  onGeschlossen,
}: {
  code: string;
  kanal: RaumKanal;
  // Spielstand des Tischs, den die Handys per Nachricht bekommen (ADR 0006). null: noch kein Spiel.
  stand: TischStand | null;
  onGeschlossen: () => void;
}) {
  const [liste, setListe] = useState<{
    bekannt: string[];
    anwesende: Anwesend[];
  }>(() => ({ bekannt: tischRaumLaden()?.bekannt ?? [], anwesende: [] }));
  // Je Spieler der zuletzt per Nachricht gemeldete Stand, für die Zahlen in der Leiste.
  const [staende, setStaende] = useState<SpielerStaende>({});
  const [fehler, setFehler] = useState<string | null>(null);
  const [verbunden, setVerbunden] = useState(false);
  // Ein Knopf blendet Code, QR-Code und Spieler aus, dann bleiben nur Rad und Runde. Erst nach dem Beitritt
  // gerendert, also nur im Browser: localStorage ist da.
  const [sichtbar, setSichtbar] = useState(raumSichtbar);

  useEffect(() => {
    // Wer einmal da war, bleibt in der Leiste, auch nach dem Neuladen des Tischs.
    function neueAnwesende(anwesende: Anwesend[]) {
      // Nach "Raum schließen" ist nichts mehr gespeichert, ein später Abgleich legt den Raum nicht neu an.
      const raum = tischRaumLaden();
      if (!raum) return;
      const bekannt = spielerleiste(raum.bekannt, anwesende, {}, null).map(
        (s) => s.name,
      );
      tischRaumSpeichern({ code, bekannt });
      setListe({ bekannt, anwesende });
    }
    const anwesendeAb = kanal.beiAnwesenden(neueAnwesende);
    const nachrichtAb = kanal.beiNachricht((nachricht) => {
      if (nachricht.art !== "spieler") return;
      setStaende((alt) => ({ ...alt, [nachricht.name]: nachricht.stand }));
    });
    kanal
      .verbinden()
      .then((anwesende) => {
        neueAnwesende(anwesende);
        setVerbunden(true);
      })
      .catch((e: Error) => setFehler(e.message));
    return () => {
      anwesendeAb();
      nachrichtAb();
    };
  }, [code, kanal]);

  // Einmal per Presence anmelden, ohne Stand: Supabase erlaubt je Gerät nur 5 Änderungen in 30 Sekunden
  // (ADR 0006). Nach einem Wiederbeitritt meldet der Kanal den Tisch selbst neu an.
  useEffect(() => {
    if (!verbunden) return;
    kanal
      .anmelden({ schluessel: tabSchluessel(), rolle: "tisch" })
      .catch((e: Error) => setFehler(e.message));
  }, [kanal, verbunden]);

  // Nach dem Verbinden und jedem Wiederbeitritt die Handys nach ihrem Stand fragen.
  useEffect(() => {
    if (!verbunden) return;
    function fragen() {
      kanal
        .senden({ art: "anfrage" })
        .catch((e: Error) => setFehler(e.message));
    }
    fragen();
    return kanal.beiVerbunden(fragen);
  }, [kanal, verbunden]);

  // Jeden neuen Stand an alle schicken, auf Anfrage den aktuellen und nach einem Wiederbeitritt noch einmal:
  // Anfragen und Änderungen aus der Zeit ohne Verbindung sind verloren.
  useEffect(() => {
    if (!verbunden) return;
    function melden() {
      kanal
        .senden({ art: "tisch", stand })
        .then(() => setFehler(null))
        .catch((e: Error) => setFehler(e.message));
    }
    melden();
    const nachrichtAb = kanal.beiNachricht((nachricht) => {
      if (nachricht.art === "anfrage") melden();
    });
    const verbundenAb = kanal.beiVerbunden(melden);
    return () => {
      nachrichtAb();
      verbundenAb();
    };
  }, [kanal, verbunden, stand]);

  async function schliessen() {
    if (!window.confirm("Willst du den Raum wirklich schließen?")) return;
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

  function umschalten() {
    raumSichtbarSpeichern(!sichtbar);
    setSichtbar(!sichtbar);
  }

  // Der Knopf liegt immer oben links. Ab lg legt sich die Schublade über den Rand der Bühne, statt sie zu verschieben:
  // So bleiben Rad und Runde gleich groß, ob der Raum sichtbar ist oder nicht. Schmaler steht sie oben.
  return (
    <>
      <button
        aria-expanded={sichtbar}
        aria-controls={sichtbar ? "raum" : undefined}
        aria-label={sichtbar ? "Raum ausblenden" : `Raum ${code} zeigen`}
        title={sichtbar ? "Raum ausblenden" : "Raum zeigen"}
        onClick={umschalten}
        className="absolute top-0 left-0 z-20 flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-akzent/50 bg-flaeche px-2.5 outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="size-[18px]"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="9" y1="4" x2="9" y2="20" />
        </svg>
        {!sichtbar && (
          <span className="font-schild text-xl font-semibold tracking-wider text-akzent">
            {code}
          </span>
        )}
      </button>
      {/* Ausgeblendet steht ein Fehler unter dem Knopf, sonst bemerkte der DJ nicht, dass die Handys nichts mehr hören. */}
      {!sichtbar && fehler && (
        <p className="absolute top-12 left-0 z-20 max-w-64 text-left text-sm text-signal">
          {fehler}
        </p>
      )}
      {sichtbar && (
        <section
          id="raum"
          aria-label="Raum"
          className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-grund/95 px-4 pt-14 pb-5 shadow-[0_16px_40px_rgb(0_0_0/0.5)] ring-1 ring-akzent/25 lg:absolute lg:top-0 lg:left-0 lg:z-10 lg:w-64"
        >
          <p className="font-schild text-6xl tracking-wider text-akzent">
            {code}
          </p>
          {/* QR-Code in den Farben der Show (licht und grund aus globals.css), dunkel auf hell bleibt er lesbar. */}
          <QRCodeSVG
            value={`${window.location.origin}/raum/${code}`}
            title={`QR-Code für Raum ${code}`}
            size={160}
            marginSize={2}
            bgColor="#ece8e1"
            fgColor="#16171b"
            className="rounded-lg"
          />
          {fehler && <p className="text-sm text-signal">{fehler}</p>}
          {/* "Anna 3" bleibt ein Text, die Browser-Tests suchen die Zeile so. */}
          <ul className="flex w-full flex-col gap-1.5">
            {spielerleiste(
              liste.bekannt,
              liste.anwesende,
              staende,
              stand?.spiel ?? null,
            ).map((s) => (
              <li
                key={s.name}
                aria-disabled={s.verbunden ? undefined : true}
                className="rounded-lg bg-flaeche px-4 py-2 text-lg font-semibold aria-disabled:opacity-40"
              >
                {s.abgehakt === null ? s.name : `${s.name} ${s.abgehakt}`}
              </li>
            ))}
          </ul>
          <button
            className="text-signal underline outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={schliessen}
          >
            Raum schließen
          </button>
        </section>
      )}
    </>
  );
}
