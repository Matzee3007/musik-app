"use client";

import { useEffect, useState } from "react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
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
  tabSchluessel,
} from "@/lib/raum/speicher";
import { tischDa, type Anwesend } from "@/lib/raum/spieler";
import { tischStandLesen } from "@/lib/raum/stand";
import type { Zufall } from "@/lib/zufall";

// Das Spiel am Handy: Karte zum Spiel des Tischs, abhaken nach der Auflösung, den eigenen Stand melden.
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
  const stand = tischStandLesen(anwesende);
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

  // Der Tisch zählt mit: einmal, sobald die Karte da ist, danach bei jeder Änderung.
  const ich = karte && spielerStand(karte);
  const meldeSpiel = ich?.spiel;
  const meldeZahl = ich?.abgehakt ?? 0;
  const meldeBingo = ich?.bingo ?? false;
  useEffect(() => {
    if (meldeSpiel === undefined) return;
    kanal
      .anmelden({
        schluessel: tabSchluessel(),
        rolle: "spieler",
        name,
        stand: { spiel: meldeSpiel, abgehakt: meldeZahl, bingo: meldeBingo },
      })
      .then(() => setFehler(null))
      .catch((e: Error) => setFehler(e.message));
  }, [kanal, name, meldeSpiel, meldeZahl, meldeBingo]);

  const linie = karte && bingoLinie(karte.karte);

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
      <p>
        Du bist im Raum {code} als {name}.
      </p>
      {fehler && <p role="alert">{fehler}</p>}
      {!tischDa(anwesende) ? (
        <p>Der Tisch ist gerade nicht verbunden.</p>
      ) : (
        !karte && <p>Warte auf das Spiel …</p>
      )}
      {linie ? (
        <h2 className="text-4xl font-bold">Bingo!</h2>
      ) : (
        stand &&
        stand.bingo.length > 0 && (
          <h2 className="text-2xl font-bold">
            Bingo! {stand.bingo.join(", ")}
          </h2>
        )
      )}
      {stand && karte && (
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
            />
          </div>
          {notizen && (
            <label className="flex w-full max-w-sm flex-col gap-1 text-left">
              Notizen
              {/* Neuer key bei jeder Runde und jedem Spiel: Die Notizfläche beginnt leer. */}
              <textarea
                key={`${stand.spiel}-${stand.runde?.nummer}`}
                rows={3}
                className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700"
              />
            </label>
          )}
          <button
            className="underline"
            onClick={() => {
              notizenSpeichern(!notizen);
              setNotizen(!notizen);
            }}
          >
            {notizen ? "Notizen aus" : "Notizen an"}
          </button>
        </>
      )}
    </div>
  );
}
