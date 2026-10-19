"use client";

import { useEffect, useRef, useState } from "react";
import Songliste from "@/app/ui/songliste";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import { MusicBrainzBeschaeftigt } from "@/lib/musicbrainz";
import type { Song } from "@/lib/song";
import { playlistSongs, type PlaylistSong } from "@/lib/spotify/playlist-songs";
import type { Playlist } from "@/lib/spotify/playlists";
import { vorbereiten } from "@/lib/vorbereiten";

type Geladen = { songs: PlaylistSong[]; uebersprungen: number };

// Vorbereiten einer Playlist (siehe Glossar), danach Songliste und Spiel.
export default function VorbereitenAnsicht({
  playlist,
  accessToken,
  onZurueck,
  warten,
}: {
  playlist: Playlist;
  accessToken: string;
  onZurueck: () => void;
  // Tests setzen eine Pause ohne Wartezeit ein.
  warten?: (ms: number) => Promise<void>;
}) {
  const [geladen, setGeladen] = useState<Geladen | null>(null);
  const [spielSongs, setSpielSongs] = useState<Song[] | null>(null);

  const [fehler, setFehler] = useState<string | null>(null);
  const [fortschritt, setFortschritt] = useState<{
    fertig: number;
    gesamt: number;
  } | null>(null);
  // "Nochmal versuchen" zählt hoch und startet das Vorbereiten neu, es setzt beim ersten offenen Song fort.
  const [versuch, setVersuch] = useState(0);

  // React führt Effekte im Dev-Modus doppelt aus. Zweimal gleichzeitig vorbereiten hieße doppelt so
  // viele Anfragen an MusicBrainz wie erlaubt, deshalb startet jeder Versuch nur einmal.
  const gestartet = useRef<number | null>(null);

  useEffect(() => {
    if (gestartet.current === versuch) return;
    gestartet.current = versuch;
    playlistSongs(playlist.id, accessToken)
      .then(async (ergebnis) => {
        await vorbereiten(ergebnis.songs, {
          warten,
          onFortschritt: (fertig, gesamt) => setFortschritt({ fertig, gesamt }),
        });
        setGeladen(ergebnis);
      })
      .catch((e) => {
        if (!(e instanceof MusicBrainzBeschaeftigt)) throw e;
        setFehler(e.message);
      });
  }, [playlist.id, accessToken, warten, versuch]);

  if (spielSongs) return <SpielAnsicht songs={spielSongs} sofort />;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button className="self-start underline" onClick={onZurueck}>
        Zurück
      </button>
      <h2 className="text-3xl font-semibold">{playlist.name}</h2>
      {geladen ? (
        <Songliste
          songs={geladen.songs}
          uebersprungen={geladen.uebersprungen}
          onSpielStarten={setSpielSongs}
        />
      ) : fehler ? (
        <>
          <p>{fehler}</p>
          <button
            className="rounded-lg border px-4 py-2"
            onClick={() => {
              setFehler(null);
              setFortschritt(null);
              setVersuch((v) => v + 1);
            }}
          >
            Nochmal versuchen
          </button>
        </>
      ) : fortschritt ? (
        <>
          <p>{`Erscheinungsjahre: ${fortschritt.fertig} von ${fortschritt.gesamt}`}</p>
          <progress
            aria-label={`Erscheinungsjahre: ${fortschritt.fertig} von ${fortschritt.gesamt}`}
            className="w-64"
            value={fortschritt.fertig}
            max={fortschritt.gesamt}
          />
        </>
      ) : (
        <p>Songs werden geladen …</p>
      )}
    </div>
  );
}
