import { useState } from "react";
import RadAnsicht from "@/app/ui/rad-ansicht";
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
}: {
  runde: Runde | null;
  stapelLeer: boolean;
  bingo: boolean;
  onRadDrehen: () => void;
  onLoesungAnzeigen: () => void;
  onVonVorn: () => void;
  onNeuesSpiel: () => void;
}) {
  // Kategorie und Knöpfe erst zeigen, wenn das Rad steht.
  const [dreht, setDreht] = useState(false);

  function drehen() {
    setDreht(true);
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

      {!runde?.aufgeloest && (
        <RadAnsicht runde={runde} onStillstand={() => setDreht(false)} />
      )}

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
          <p className="text-lg">Song läuft</p>
          <Knopf onClick={onLoesungAnzeigen}>Lösung anzeigen</Knopf>
        </>
      )}

      {runde?.aufgeloest && (
        <>
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
