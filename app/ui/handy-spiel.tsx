"use client";

import { useEffect, useState } from "react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
import Tisch from "@/app/ui/tisch";
import TonEmpfang from "@/app/ui/ton-empfang";
import { bingoLinie } from "@/lib/bingo";
import {
  abhaken,
  darfZuruecknehmen,
  feldFrei,
  karteFuer,
  spielerStand,
  zuruecknehmen,
  type HandyKarte,
} from "@/lib/raum/handy-karte";
import type { RaumKanal } from "@/lib/raum/kanal";
import {
  handyKarteLaden,
  handyKarteSpeichern,
  notizenAn,
  notizenSpeichern,
} from "@/lib/raum/speicher";
import { tischDa, type Anwesend } from "@/lib/raum/spieler";
import {
  rundeAusStand,
  type SpielerStand,
  type TischStand,
} from "@/lib/raum/stand";
import type { Zufall } from "@/lib/zufall";

// Das Spiel am Handy: Karte zum Spiel des Tischs, abhaken nach der Auflösung, den eigenen Stand melden. Im
// Online-Modus (ADR 0008) steht daneben der Tisch des DJs ohne Knöpfe.
export default function HandySpiel({
  code,
  name,
  kanal,
  anwesende,
  zufall = Math.random,
}: {
  code: string;
  name: string;
  kanal: RaumKanal;
  anwesende: Anwesend[];
  zufall?: Zufall;
}) {
  // Stand des Tischs aus seiner letzten Nachricht (ADR 0006).
  const [stand, setStand] = useState<TischStand | null>(null);
  // Erst nach dem Beitritt gerendert, also nur im Browser: localStorage ist da.
  const [handy, setHandy] = useState<HandyKarte | null>(handyKarteLaden);
  const [fehler, setFehler] = useState<string | null>(null);
  const [notizen, setNotizen] = useState(notizenAn);

  // Neues Spiel oder Beitritt mitten im Spiel: gleich beim Rendern die passende Karte, ohne Effekt.
  if (stand && handy?.spiel !== stand.spiel) {
    setHandy(karteFuer(handy, stand.spiel, zufall));
  }
  const karte = stand && handy?.spiel === stand.spiel ? handy : null;

  useEffect(() => {
    if (handy) handyKarteSpeichern(handy);
  }, [handy]);

  // Beim Erscheinen und nach jedem Wiederbeitritt nach dem Stand fragen: Broadcast speichert nichts.
  useEffect(() => {
    function fragen() {
      kanal
        .senden({ art: "anfrage" })
        .catch((e: Error) => setFehler(e.message));
    }
    const nachrichtAb = kanal.beiNachricht((nachricht) => {
      if (nachricht.art === "tisch") setStand(nachricht.stand);
    });
    const verbundenAb = kanal.beiVerbunden(fragen);
    fragen();
    return () => {
      nachrichtAb();
      verbundenAb();
    };
  }, [kanal]);

  // Der Tisch zählt mit: einmal, sobald die Karte da ist, danach bei jeder Änderung und auf Anfrage.
  const ich = karte && spielerStand(karte);
  const meldeSpiel = ich?.spiel;
  const meldeZahl = ich?.abgehakt ?? 0;
  const meldeBingo = ich?.bingo ?? false;
  useEffect(() => {
    if (meldeSpiel === undefined) return;
    const meinStand: SpielerStand = {
      spiel: meldeSpiel,
      abgehakt: meldeZahl,
      bingo: meldeBingo,
    };
    function melden() {
      kanal
        .senden({ art: "spieler", name, stand: meinStand })
        .then(() => setFehler(null))
        .catch((e: Error) => setFehler(e.message));
    }
    melden();
    return kanal.beiNachricht((nachricht) => {
      if (nachricht.art === "anfrage") melden();
    });
  }, [kanal, name, meldeSpiel, meldeZahl, meldeBingo]);

  const linie = karte && bingoLinie(karte.karte);
  const online = stand?.online === true;

  function feldKlick(index: number) {
    if (!stand || !karte) return;
    if (!karte.karte[index].abgehakt) {
      setHandy(abhaken(karte, stand, index));
    } else if (
      darfZuruecknehmen(karte, stand) &&
      window.confirm("Abhaken zurücknehmen?")
    ) {
      setHandy(zuruecknehmen(karte, stand, index));
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-sm text-licht/70">
        Du bist im Raum {code} als {name}.
      </p>
      {fehler && (
        <p role="alert" className="text-signal">
          {fehler}
        </p>
      )}
      {!tischDa(anwesende) ? (
        <p className="text-signal">
          {online
            ? "Der DJ ist gerade nicht verbunden."
            : "Der Tisch ist gerade nicht verbunden."}
        </p>
      ) : (
        !karte && <p>Warte auf das Spiel …</p>
      )}
      {linie ? (
        <h2 className="font-schild text-5xl text-akzent">Bingo!</h2>
      ) : (
        // Online nennt der Tisch daneben die Gewinner.
        !online &&
        stand &&
        stand.bingo.length > 0 && (
          <h2 className="font-schild text-2xl text-akzent">
            Bingo! {stand.bingo.join(", ")}
          </h2>
        )
      )}
      {stand &&
        karte &&
        (online ? (
          <>
            <TonEmpfang kanal={kanal} />
            <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
              <Tisch
                zuschauer
                runde={rundeAusStand(stand)}
                stapelLeer={false}
                bingo={stand.bingo.length > 0}
                gewinner={stand.bingo}
                onRadDrehen={() => {}}
                onLoesungAnzeigen={() => {}}
                onVonVorn={() => {}}
                onNeuesSpiel={() => {}}
              />
              <div className="flex flex-col items-center gap-4">
                {kartenteil(stand, karte)}
              </div>
            </div>
          </>
        ) : (
          kartenteil(stand, karte)
        ))}
    </div>
  );

  function kartenteil(stand: TischStand, karte: HandyKarte) {
    return (
      <>
        {/* Ohne Notizfläche wird die Karte größer. */}
        <div className={`w-full ${notizen ? "max-w-sm" : "max-w-lg"}`}>
          <KarteAnsicht
            karte={karte.karte}
            onFeldKlick={feldKlick}
            ausgegraut={(i) =>
              !karte.karte[i].abgehakt && !feldFrei(karte, stand, i)
            }
            hervorgehoben={linie ?? undefined}
            felder={notizen ? "hoch" : "hoeher"}
          />
        </div>
        {notizen && (
          <label className="flex w-full max-w-sm flex-col gap-1 text-left text-licht/70">
            Notizen
            {/* Neuer key bei jeder Runde und jedem Spiel: Die Notizfläche beginnt leer. */}
            <textarea
              key={`${stand.spiel}-${stand.runde?.nummer}`}
              rows={3}
              // Auf niedrigen Handys nur 2 Zeilen, damit Karte und Notizen auch mit „Bingo!“ ohne Scrollen passen.
              className="rounded-lg bg-flaeche px-3 py-2 text-licht outline-akzent focus-visible:outline-2 [@media(max-height:800px)]:h-[calc(2lh+1rem)]"
            />
          </label>
        )}
        <button
          className="text-akzent underline outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => {
            notizenSpeichern(!notizen);
            setNotizen(!notizen);
          }}
        >
          {notizen ? "Notizen aus" : "Notizen an"}
        </button>
      </>
    );
  }
}
