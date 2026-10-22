"use client";

import { useState } from "react";
import Knopf from "@/app/ui/knopf";
import {
  gueltigesJahr,
  jahrFuerSpiel,
  markierung,
} from "@/lib/erscheinungsjahr";
import type { Song } from "@/lib/song";
import type { PlaylistSong } from "@/lib/spotify/playlist-songs";
import {
  gespeicherteJahre,
  jahreVon,
  korrekturSpeichern,
  spielSongs,
} from "@/lib/vorbereiten";

// Die vorbereitete Playlist zum Prüfen: Songs, bei denen das Jahr fraglich ist, stehen oben.
export default function Songliste({
  songs,
  uebersprungen,
  onSpielStarten,
}: {
  songs: readonly PlaylistSong[];
  uebersprungen: number;
  onSpielStarten: (songs: Song[]) => void;
}) {
  const [gespeichert, setGespeichert] = useState(gespeicherteJahre);

  // Beim Verlassen des Feldes: leer nimmt die Korrektur zurück, ein gültiges Jahr gilt,
  // alles andere wird verworfen und das Feld zeigt wieder den gespeicherten Wert.
  function korrigieren(song: PlaylistSong, feld: HTMLInputElement) {
    const text = feld.value.trim();
    const jahr = gueltigesJahr(text, new Date().getFullYear());
    if (text === "" || jahr !== null) {
      korrekturSpeichern(song.id, jahr);
      setGespeichert(gespeicherteJahre());
    } else {
      feld.value = String(gespeichert[song.id]?.korrigiert ?? "");
    }
  }

  const zeilen = songs.map((song) => {
    const jahre = jahreVon(song, gespeichert);
    return { song, jahre, hinweis: markierung(jahre) };
  });
  // sort ist stabil: Innerhalb der markierten und der übrigen bleibt die Reihenfolge der Playlist.
  zeilen.sort(
    (a, b) => Number(b.hinweis !== null) - Number(a.hinweis !== null),
  );

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4">
      <h2 className="font-schild text-2xl">
        {songs.length} {songs.length === 1 ? "Song" : "Songs"} bereit,{" "}
        {uebersprungen} übersprungen
      </h2>
      {songs.length === 0 ? (
        <p>Keine spielbaren Songs</p>
      ) : (
        <Knopf onClick={() => onSpielStarten(spielSongs(songs, gespeichert))}>
          Spiel starten
        </Knopf>
      )}
      <table className="w-full text-left text-sm [&_td]:py-1 [&_th]:pb-2 [&_th]:text-licht/60">
        <thead>
          <tr>
            <th>Titel</th>
            <th>Interpret</th>
            <th>Spotify</th>
            <th>MusicBrainz</th>
            <th>Jahr</th>
            <th>Hinweis</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map(({ song, jahre, hinweis }) => (
            <tr key={song.id}>
              <td>{song.titel}</td>
              <td>{song.interpret}</td>
              <td>{jahre.spotify}</td>
              <td>{jahre.musicbrainz ?? "–"}</td>
              <td>
                <input
                  type="number"
                  aria-label={`Jahr für ${song.titel}`}
                  className="w-20 rounded bg-flaeche px-1 outline-akzent focus-visible:outline-2"
                  defaultValue={jahre.korrigiert ?? ""}
                  placeholder={String(jahrFuerSpiel(jahre))}
                  onBlur={(e) => korrigieren(song, e.currentTarget)}
                />
              </td>
              <td>{hinweis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
