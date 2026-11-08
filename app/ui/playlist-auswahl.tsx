import Knopf from "@/app/ui/knopf";
import type { Playlist } from "@/lib/spotify/playlists";

// Playlists des DJs als Raster mit Cover (Plan docs/plaene/2026-11-08-startseite-buehne.md).
// playlists null: Spotify hat noch nicht geantwortet, erst eine leere Liste heißt "keine Playlist".
export default function PlaylistAuswahl({
  playlists,
  hinweis,
  onWaehlen,
  onDemo,
  onAbmelden,
}: {
  playlists: Playlist[] | null;
  hinweis?: React.ReactNode;
  onWaehlen: (p: Playlist) => void;
  onDemo: () => void;
  onAbmelden: () => void;
}) {
  return (
    <div className="w-full max-w-7xl text-left">
      <h2 className="mb-8 font-schild text-[32px] sm:text-[44px]">
        Playlist wählen
      </h2>
      {hinweis}
      {playlists?.length === 0 && (
        <p className="max-w-md text-licht/70">
          Du hast noch keine eigene Playlist mit Songs. Leg in Spotify eine an
          und lade die Seite neu.
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
        {playlists?.map((p) => (
          <li key={p.id} className="min-w-0">
            <button
              className="block w-full rounded-lg text-left outline-akzent focus-visible:outline-2 focus-visible:outline-offset-[6px]"
              onClick={() => onWaehlen(p)}
            >
              {p.cover ? (
                // Ein Bild von Spotify: next/image bräuchte eine Freigabe der Adresse und spart hier nichts.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-md bg-flaeche object-cover"
                />
              ) : (
                <span className="flex aspect-square w-full items-end rounded-md bg-flaeche p-2.5 font-schild text-3xl font-bold text-akzent">
                  {/* Nach Zeichen, nicht nach UTF-16-Einheiten: sonst zerfällt ein Emoji am Anfang. */}
                  {[...p.name][0]}
                </span>
              )}
              <span className="mt-3 line-clamp-2 font-semibold break-words sm:text-lg">
                {p.name}
              </span>
              <span className="block text-[15px] text-licht/70">
                {p.anzahlSongs} Songs
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-licht/10 pt-6">
        <Knopf art="neben" onClick={onDemo}>
          Demo starten
        </Knopf>
        <Knopf art="neben" onClick={onAbmelden}>
          Abmelden
        </Knopf>
      </div>
    </div>
  );
}
