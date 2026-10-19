import { useState } from "react";
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
  onRadDrehen,
  onLoesungAnzeigen,
  onVonVorn,
  onNeuesSpiel,
  onRadSteht,
  musik,
  onJahrKorrigieren,
}: {
  runde: Runde | null;
  stapelLeer: boolean;
  bingo: boolean;
  onRadDrehen: () => void;
  onLoesungAnzeigen: () => void;
  onVonVorn: () => void;
  onNeuesSpiel: () => void;
  // Nur mit Spotify: Das Rad steht, jetzt soll der Song laufen.
  onRadSteht?: () => void;
  // Nur mit Spotify, sonst steht dort wie in der Demo "Song läuft".
  musik?: {
    laeuft: boolean;
    // Der Ausschnitt ist zu Ende, der Song pausiert.
    vorbei: boolean;
    dauerMs: number | null;
    // Neuer Wert: Musikspur beginnt von vorn.
    start: number;
    onNochmal: () => void;
    onWeiterhoeren: () => void;
  };
  // Nur mit Spotify: Der DJ korrigiert in der Auflösung das Jahr.
  onJahrKorrigieren?: (jahr: number) => void;
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

  return (
    <section
      aria-label="Tisch"
      className="flex flex-col items-center gap-4 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700"
    >
      {bingo && (
        <>
          <h2 className="text-5xl font-bold">Bingo!</h2>
          <Knopf onClick={onNeuesSpiel}>Neues Spiel</Knopf>
        </>
      )}

      {/* In der Auflösung nur verstecken, nicht aushängen: Ein neu eingehängtes Rad hat keinen alten Winkel,
          der Browser spielt dann keinen Übergang ab, und "Rad steht" (transitionend) käme nie. */}
      <div
        aria-hidden={runde?.aufgeloest || undefined}
        className={runde?.aufgeloest ? "invisible h-0 overflow-hidden" : ""}
      >
        <RadAnsicht
          runde={runde}
          onStillstand={() => {
            setDreht(false);
            onRadSteht?.();
          }}
        />
      </div>

      {!runde && <Knopf onClick={drehen}>Rad drehen</Knopf>}

      {runde && !dreht && (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Runde {runde.nummer}
          </p>
          <p
            role="status"
            style={{ backgroundColor: runde.kategorie.farbe }}
            className="rounded-lg px-6 py-3 text-2xl font-bold text-zinc-950"
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
                  <Knopf onClick={musik.onNochmal}>Nochmal</Knopf>
                  <Knopf onClick={musik.onWeiterhoeren}>Weiterhören</Knopf>
                </div>
              )}
            </>
          ) : (
            <p className="text-lg">Song läuft</p>
          )}
          <Knopf onClick={onLoesungAnzeigen}>Lösung anzeigen</Knopf>
        </>
      )}

      {runde?.aufgeloest && (
        <>
          {runde.song.cover && (
            // Ein Bild von Spotify am Tisch: next/image bräuchte eine Freigabe der Adresse und spart hier nichts.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={runde.song.cover}
              alt={`Cover von ${runde.song.titel}`}
              className="h-48 w-48 rounded-lg object-cover shadow"
            />
          )}
          <h2 className="text-4xl font-bold">
            {runde.kategorie.loesung(runde.song)}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-left">
            <dt className="text-zinc-600 dark:text-zinc-400">Titel</dt>
            <dd>{runde.song.titel}</dd>
            <dt className="text-zinc-600 dark:text-zinc-400">Interpret</dt>
            <dd>{runde.song.interpret}</dd>
            <dt className="text-zinc-600 dark:text-zinc-400">Jahr</dt>
            <dd>{runde.song.jahr}</dd>
            <dt className="text-zinc-600 dark:text-zinc-400">Jahrzehnt</dt>
            <dd>{jahrzehnt.loesung(runde.song)}</dd>
          </dl>
          {musik && !musik.laeuft && !bingo && (
            <Knopf onClick={musik.onWeiterhoeren}>Weiterhören</Knopf>
          )}
          {onJahrKorrigieren &&
            (jahrFeld === null ? (
              <button className="underline" onClick={() => setJahrFeld("")}>
                Jahr korrigieren
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  Jahr
                  <input
                    type="number"
                    className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700"
                    value={jahrFeld}
                    onChange={(e) => setJahrFeld(e.target.value)}
                  />
                </label>
                <Knopf
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
          {!bingo && <p>Richtig? Hake ein Feld {runde.kategorie.name} ab.</p>}
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
    </section>
  );
}

function Knopf({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
