import { useState } from "react";
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
  // Die Runde ist offen: Das Rad steht, die Lösung ist noch nicht da.
  const offen = runde !== null && !dreht && !runde.aufgeloest;
  const aufgeloest = runde?.aufgeloest ?? false;
  // Bei "Jahr ±3" ist die Zeile Jahr gesucht.
  const gesucht =
    runde && !dreht
      ? runde.kategorie.id === "jahrPlusMinus3"
        ? "jahr"
        : runde.kategorie.id
      : null;
  const angaben = [
    { id: "titel", name: "Titel", wert: runde?.song.titel },
    { id: "interpret", name: "Interpret", wert: runde?.song.interpret },
    { id: "jahr", name: "Jahr", wert: runde && String(runde.song.jahr) },
    {
      id: "jahrzehnt",
      name: "Jahrzehnt",
      wert: runde && jahrzehnt.loesung(runde.song),
    },
  ];
  const loesung = runde ? runde.kategorie.loesung(runde.song) : "";
  const leise = "font-schild text-[2.4rem] font-semibold text-licht/60";

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

      {/* Breit: Rad links, rechts der Abschnitt zur Runde. Das Rad bleibt immer eingehängt: Ein neu eingehängtes Rad
          hat keinen alten Winkel, der Browser spielt dann keinen Übergang ab, und "Rad steht" (transitionend) käme nie.
          --rad richtet sich nach der Höhe des Fensters (abzüglich Überschrift, Ausschnitt und Abständen) und der Breite
          des Tischs (cqw) abzüglich Abschnitt und Abstand. Der Abschnitt ist so hoch wie das Rad und behält in jedem
          Zustand seine Größe, weil alle vier Plätze immer da sind. */}
      <div className="flex w-full flex-col items-center gap-8 [--rad:min(48rem,calc(100dvh-13rem),calc(100cqw-38.5rem))] @5xl:flex-row @5xl:justify-center @5xl:gap-10">
        <div className="relative w-80 max-w-full shrink-0 rounded-full p-1.5 ring-2 ring-akzent/60 @5xl:w-[var(--rad)]">
          <RadAnsicht
            runde={runde}
            onStillstand={() => {
              setDreht(false);
              onRadSteht?.();
            }}
          />
        </div>

        <section
          aria-label="Runde"
          className="relative grid min-h-[34rem] w-full max-w-xl grid-rows-[auto_auto_1fr_auto] gap-5 rounded-2xl bg-flaeche p-5 @5xl:h-[max(var(--rad),34rem)] @5xl:w-[36rem] @5xl:max-w-none @5xl:p-7"
        >
          {bingo && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-[3px] ring-akzent ring-inset" />
          )}

          {/* Kopf: Runde und Kategorie. Ohne Kategorie ein leeres Schild gleicher Höhe. */}
          <div className="flex min-h-11 items-center justify-between gap-3">
            <p className={`text-sm tracking-wider uppercase ${etikett}`}>
              {runde ? `Runde ${runde.nummer}` : "Noch keine Runde"}
            </p>
            {runde && !dreht ? (
              <p
                role="status"
                style={{ backgroundColor: runde.kategorie.farbe }}
                className="rounded-lg px-4 py-1.5 font-schild text-[1.9rem] leading-none font-semibold text-grund"
              >
                {runde.kategorie.name}
              </p>
            ) : (
              <span className="rounded-lg bg-grund px-4 py-1.5 font-schild text-[1.9rem] leading-none text-licht/60">
                –
              </span>
            )}
          </div>

          {/* Großer Platz: immer zwei Zeilen hoch. */}
          <div className="flex h-[8.4rem] flex-col items-center justify-center rounded-xl bg-grund px-4 py-2 text-center">
            {bingo ? (
              <h2 className="line-clamp-2 font-schild text-[3.6rem] leading-none font-bold text-balance text-akzent">
                {gewinner ? `Bingo! ${gewinner.join(", ")}` : "Bingo!"}
              </h2>
            ) : !runde ? (
              <p className={leise}>Bereit?</p>
            ) : dreht ? (
              <p className={leise}>Das Rad dreht …</p>
            ) : aufgeloest ? (
              <>
                <p className={`text-xs tracking-widest uppercase ${etikett}`}>
                  Lösung · {runde.kategorie.name}
                </p>
                <h2
                  className={`line-clamp-2 font-schild leading-none font-bold text-balance text-akzent ${loesung.length > 16 ? "text-[2.7rem]" : "text-[3.6rem]"}`}
                >
                  {loesung}
                </h2>
              </>
            ) : musik ? (
              <Musikspur
                key={musik.start}
                farbe={runde.kategorie.farbe}
                laeuft={musik.laeuft}
                dauerMs={musik.dauerMs}
              />
            ) : (
              <p className="text-lg">Song läuft</p>
            )}
          </div>

          {/* Mitte: links Cover oder Platte, rechts die vier Angaben, verdeckt bis zur Auflösung. */}
          <div className="grid min-h-0 grid-cols-1 items-center justify-items-center gap-6 sm:grid-cols-[var(--cover)_minmax(0,1fr)] sm:justify-items-stretch [--cover:clamp(9rem,30vw,15rem)] @5xl:[--cover:clamp(11rem,36vh,22rem)]">
            <div className="grid aspect-square w-[var(--cover)] max-w-full place-items-center overflow-hidden rounded-xl bg-grund shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
              {aufgeloest && runde?.song.cover ? (
                // Ein Bild von Spotify am Tisch: next/image bräuchte eine Freigabe der Adresse und spart hier nichts.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={runde.song.cover}
                  alt={`Cover von ${runde.song.titel}`}
                  className="size-full object-cover"
                />
              ) : (
                // Platte, bis das Cover kommt. Sie dreht sich, solange der Song läuft.
                <div
                  className={`relative aspect-square w-[78%] rounded-full bg-[repeating-radial-gradient(circle,var(--color-grund)_0_2px,var(--color-flaeche)_2px_4px)] ${offen && (musik ? musik.laeuft : true) ? "animate-[spin_2.4s_linear_infinite] motion-reduce:animate-none" : ""}`}
                >
                  <span
                    className="absolute inset-[36%] rounded-full bg-flaeche"
                    style={
                      runde && !dreht
                        ? { backgroundColor: runde.kategorie.farbe }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
            <dl className="grid w-full min-w-0 gap-3.5 text-left">
              {angaben.map(({ id, name, wert }) => {
                const markiert = id === gesucht;
                const farbe =
                  markiert && runde ? { color: runde.kategorie.farbe } : {};
                return (
                  <div
                    key={id}
                    data-gesucht={markiert || undefined}
                    className="grid min-w-0 gap-0.5"
                  >
                    <dt
                      style={farbe}
                      className={`text-xs tracking-widest uppercase ${markiert ? "font-semibold" : etikett}`}
                    >
                      {name}
                      {markiert && !aufgeloest && " · gesucht"}
                    </dt>
                    <dd
                      style={aufgeloest ? farbe : {}}
                      className={`line-clamp-2 text-[1.55rem] leading-tight font-semibold break-words ${aufgeloest ? "" : "tracking-[0.2em] text-licht/25"}`}
                    >
                      {aufgeloest ? wert : "· · ·"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {/* Fuß: Hinweis und Knöpfe, beide mit fester Mindesthöhe. */}
          <div className="grid gap-3">
            <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-licht/70">
              {aufgeloest && !bingo && (
                <p>Richtig? Hake ein Feld {runde!.kategorie.name} ab.</p>
              )}
              {aufgeloest && stapelLeer && !bingo && (
                <p className="font-semibold text-licht">Alle Songs gespielt</p>
              )}
              {aufgeloest &&
                onJahrKorrigieren &&
                (jahrFeld === null ? (
                  <button
                    className="text-akzent underline outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2"
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
                        className="w-24 rounded-lg bg-grund px-2 py-1 text-licht outline-akzent focus-visible:outline-2"
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
            </div>

            <div className="flex min-h-[3.4rem] flex-wrap items-center justify-end gap-2.5">
              {bingo && <Knopf onClick={onNeuesSpiel}>Neues Spiel</Knopf>}
              {!bingo && !runde && <Knopf onClick={drehen}>Rad drehen</Knopf>}
              {!bingo && offen && (
                <>
                  {musik?.vorbei && (
                    <>
                      <Knopf art="neben" onClick={musik.onNochmal}>
                        Nochmal
                      </Knopf>
                      {!musik.fehler && (
                        <Knopf art="neben" onClick={musik.onWeiterhoeren}>
                          Weiterhören
                        </Knopf>
                      )}
                    </>
                  )}
                  {musik?.laeuft && (
                    <Knopf art="neben" onClick={musik.onAnhalten}>
                      Anhalten
                    </Knopf>
                  )}
                  <Knopf onClick={onLoesungAnzeigen}>Lösung anzeigen</Knopf>
                </>
              )}
              {!bingo && aufgeloest && (
                // Läuft der Song, "Anhalten", steht er, "Weiterhören".
                <>
                  {musik && (
                    <Knopf
                      art="neben"
                      onClick={
                        musik.laeuft ? musik.onAnhalten : musik.onWeiterhoeren
                      }
                    >
                      {musik.laeuft ? "Anhalten" : "Weiterhören"}
                    </Knopf>
                  )}
                  {stapelLeer ? (
                    <Knopf onClick={onVonVorn}>Von vorn</Knopf>
                  ) : (
                    <Knopf onClick={drehen}>Nächste Runde</Knopf>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
