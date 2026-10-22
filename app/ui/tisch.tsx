import { useState } from "react";
import Birnenkranz from "@/app/ui/birnenkranz";
import Knopf from "@/app/ui/knopf";
import Musikspur from "@/app/ui/musikspur";
import RadAnsicht from "@/app/ui/rad-ansicht";
import { gueltigesJahr } from "@/lib/erscheinungsjahr";
import { KATEGORIEN } from "@/lib/kategorien";
import type { Runde } from "@/lib/spiel";

const jahrzehnt = KATEGORIEN.find((k) => k.id === "jahrzehnt")!;

export default function Tisch({
  runde,
  stapelLeer,
  bingo,
  gewinner,
  onRadDrehen,
  onLoesungAnzeigen,
  onVonVorn,
  onNeuesSpiel,
  onRadSteht,
  musik,
  onJahrKorrigieren,
  meldung,
}: {
  runde: Runde | null;
  stapelLeer: boolean;
  bingo: boolean;
  // Nur im Raum: die Spieler mit Bingo.
  gewinner?: string[];
  onRadDrehen: () => void;
  onLoesungAnzeigen: () => void;
  onVonVorn: () => void;
  onNeuesSpiel: () => void;
  // Nur mit Spotify: Das Rad steht, jetzt soll der Song laufen.
  onRadSteht?: () => void;
  // Nur mit Spotify, sonst steht dort wie in der Demo "Song läuft".
  musik?: {
    laeuft: boolean;
    // Der Ausschnitt ist zu Ende oder der DJ hat angehalten, der Song pausiert.
    vorbei: boolean;
    dauerMs: number | null;
    // Neuer Wert: Musikspur beginnt von vorn.
    start: number;
    // Der Start ist gescheitert: Nur "Nochmal" startet den Song neu.
    fehler: boolean;
    onNochmal: () => void;
    onAnhalten: () => void;
    onWeiterhoeren: () => void;
  };
  // Nur mit Spotify: Der DJ korrigiert in der Auflösung das Jahr.
  onJahrKorrigieren?: (jahr: number) => void;
  // Nur mit Spotify: Ein Befehl an Spotify ist gescheitert.
  meldung?: string | null;
}) {
  // Kategorie und Knöpfe erst zeigen, wenn das Rad steht.
  const [dreht, setDreht] = useState(false);
  // Eingabe für "Jahr korrigieren", null: geschlossen.
  const [jahrFeld, setJahrFeld] = useState<string | null>(null);

  function drehen() {
    setDreht(true);
    setJahrFeld(null);
    onRadDrehen();
  }

  const etikett = "text-licht/60";

  return (
    <section
      aria-label="Tisch"
      className="@container flex w-full flex-col items-center gap-6"
    >
      {meldung && (
        <p role="alert" className="text-signal">
          {meldung}
        </p>
      )}

      {bingo && (
        <>
          <h2 className="font-schild text-6xl text-birne">
            {gewinner ? `Bingo! ${gewinner.join(", ")}` : "Bingo!"}
          </h2>
          <Knopf onClick={onNeuesSpiel}>Neues Spiel</Knopf>
        </>
      )}

      {/* Breit: Rad links, Moderation rechts. Das Rad bleibt immer eingehängt: Ein neu eingehängtes Rad hat keinen
          alten Winkel, der Browser spielt dann keinen Übergang ab, und "Rad steht" (transitionend) käme nie. */}
      <div className="flex w-full flex-col items-center gap-10 @2xl:flex-row @2xl:justify-center">
        <div className="relative w-96 max-w-full shrink-0 rounded-full bg-boden p-7">
          <Birnenkranz modus={bingo ? "bingo" : dreht ? "lauf" : "ruhig"} />
          <RadAnsicht
            runde={runde}
            onStillstand={() => {
              setDreht(false);
              onRadSteht?.();
            }}
          />
        </div>

        <div className="flex max-w-md flex-col items-center gap-4">
          {!runde && <Knopf onClick={drehen}>Rad drehen</Knopf>}

          {runde && !dreht && (
            <>
              <p className={`text-sm ${etikett}`}>Runde {runde.nummer}</p>
              <p
                role="status"
                style={{ backgroundColor: runde.kategorie.farbe }}
                className="rounded-lg px-6 py-2 font-schild text-3xl text-nacht"
              >
                {runde.kategorie.name}
              </p>
            </>
          )}

          {runde && !runde.aufgeloest && !dreht && (
            <>
              {musik ? (
                <>
                  <Musikspur
                    key={musik.start}
                    farbe={runde.kategorie.farbe}
                    laeuft={musik.laeuft}
                    dauerMs={musik.dauerMs}
                  />
                  {musik.vorbei && (
                    <div className="flex gap-2">
                      <Knopf art="neben" onClick={musik.onNochmal}>
                        Nochmal
                      </Knopf>
                      {!musik.fehler && (
                        <Knopf art="neben" onClick={musik.onWeiterhoeren}>
                          Weiterhören
                        </Knopf>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-lg">Song läuft</p>
              )}
              <div className="flex gap-2">
                {musik?.laeuft && (
                  <Knopf art="neben" onClick={musik.onAnhalten}>
                    Anhalten
                  </Knopf>
                )}
                <Knopf onClick={onLoesungAnzeigen}>Lösung anzeigen</Knopf>
              </div>
            </>
          )}

          {runde?.aufgeloest && (
            <>
              <h2 className="text-center font-schild text-4xl text-birne">
                {runde.kategorie.loesung(runde.song)}
              </h2>
              <div className="flex items-center gap-5">
                {runde.song.cover && (
                  // Ein Bild von Spotify am Tisch: next/image bräuchte eine Freigabe der Adresse und spart hier nichts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={runde.song.cover}
                    alt={`Cover von ${runde.song.titel}`}
                    className="size-36 rounded-lg object-cover"
                  />
                )}
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-left">
                  <dt className={etikett}>Titel</dt>
                  <dd>{runde.song.titel}</dd>
                  <dt className={etikett}>Interpret</dt>
                  <dd>{runde.song.interpret}</dd>
                  <dt className={etikett}>Jahr</dt>
                  <dd>{runde.song.jahr}</dd>
                  <dt className={etikett}>Jahrzehnt</dt>
                  <dd>{jahrzehnt.loesung(runde.song)}</dd>
                </dl>
              </div>
              {musik && !bingo && (
                // An derselben Stelle: läuft der Song, "Anhalten", steht er, "Weiterhören".
                <Knopf
                  art="neben"
                  onClick={
                    musik.laeuft ? musik.onAnhalten : musik.onWeiterhoeren
                  }
                >
                  {musik.laeuft ? "Anhalten" : "Weiterhören"}
                </Knopf>
              )}
              {onJahrKorrigieren &&
                (jahrFeld === null ? (
                  <button
                    className="text-birne underline outline-birne focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={() => setJahrFeld("")}
                  >
                    Jahr korrigieren
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      Jahr
                      <input
                        type="number"
                        className="w-24 rounded-lg bg-boden px-2 py-1 outline-birne focus-visible:outline-2"
                        value={jahrFeld}
                        onChange={(e) => setJahrFeld(e.target.value)}
                      />
                    </label>
                    <Knopf
                      art="neben"
                      onClick={() => {
                        // Wie in der Songliste nur ganze Jahre bis heute, sonst bleibt das Feld offen.
                        const jahr = gueltigesJahr(
                          jahrFeld,
                          new Date().getFullYear(),
                        );
                        if (jahr === null) return;
                        onJahrKorrigieren(jahr);
                        setJahrFeld(null);
                      }}
                    >
                      Speichern
                    </Knopf>
                  </div>
                ))}
              {!bingo && (
                <p>Richtig? Hake ein Feld {runde.kategorie.name} ab.</p>
              )}
              {bingo ? null : stapelLeer ? (
                <>
                  <p className="font-semibold">Alle Songs gespielt</p>
                  <Knopf onClick={onVonVorn}>Von vorn</Knopf>
                </>
              ) : (
                <Knopf onClick={drehen}>Nächste Runde</Knopf>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
