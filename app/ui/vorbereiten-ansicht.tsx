"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Knopf from "@/app/ui/knopf";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import type { Song } from "@/lib/song";
import { SpotifyFehler } from "@/lib/spotify/abruf";
import { clientId } from "@/lib/spotify/konfig";
import {
  playerVerbinden,
  PlayerFehler,
  type Abspieler,
} from "@/lib/spotify/player";
import { playlistSongs, type PlaylistSong } from "@/lib/spotify/playlist-songs";
import type { Playlist } from "@/lib/spotify/playlists";
import { gueltigesToken } from "@/lib/spotify/sitzung";
import {
  gespeicherteJahre,
  korrekturSpeichern,
  spielSongs as songsFuersSpiel,
  unsichereJahre,
  vorbereiten,
} from "@/lib/vorbereiten";

type Geladen = { songs: PlaylistSong[]; uebersprungen: number };

// Verbindet den Browser als Spotify-Gerät, das Token holt es bei Bedarf frisch.
function standardVerbinden(): Promise<Abspieler> {
  return playerVerbinden({
    tokenHolen: async () => {
      const token = await gueltigesToken(clientId()!);
      if (!token) throw new PlayerFehler("Spotify-Anmeldung abgelaufen.");
      return token.accessToken;
    },
  });
}

// Vorbereiten einer Playlist (siehe Glossar), danach das Spiel. Keine Songliste, sie verriete dem mitspielenden DJ
// die Lösungen (ADR 0007).
export default function VorbereitenAnsicht({
  playlist,
  accessToken,
  onZurueck,
  warten,
  verbinden = standardVerbinden,
  raum,
}: {
  playlist: Playlist;
  accessToken: string;
  onZurueck: () => void;
  // Tests setzen eine Pause ohne Wartezeit ein.
  warten?: (ms: number) => Promise<void>;
  // Tests setzen einen nachgebauten Player ein.
  verbinden?: () => Promise<Abspieler>;
  // Im Raum: wird an die Spielansicht durchgereicht.
  raum?: ComponentProps<typeof SpielAnsicht>["raum"];
}) {
  const [geladen, setGeladen] = useState<Geladen | null>(null);
  const [spielSongs, setSpielSongs] = useState<Song[] | null>(null);

  const [fehler, setFehler] = useState<{
    meldung: string;
    nochmal: boolean;
  } | null>(null);
  const [fortschritt, setFortschritt] = useState<{
    fertig: number;
    gesamt: number;
  } | null>(null);
  // "Nochmal versuchen" zählt hoch und startet das Vorbereiten neu, es setzt beim ersten offenen Song fort.
  const [versuch, setVersuch] = useState(0);

  // React führt Effekte im Dev-Modus doppelt aus. Zweimal gleichzeitig vorbereiten hieße doppelt so
  // viele Anfragen an MusicBrainz wie erlaubt, deshalb startet jeder Versuch nur einmal.
  const gestartet = useRef<number | null>(null);

  // "Zurück" hängt die Ansicht aus, dann soll das Vorbereiten aufhören. Im Effekt gesetzt, damit der
  // doppelte Durchlauf im StrictMode (ein-, aus-, wieder einhängen) am Ende "sichtbar" ergibt.
  const sichtbar = useRef(true);
  useEffect(() => {
    sichtbar.current = true;
    return () => {
      sichtbar.current = false;
    };
  }, []);

  useEffect(() => {
    if (gestartet.current === versuch) return;
    gestartet.current = versuch;
    playlistSongs(playlist.id, accessToken)
      .then(async (ergebnis) => {
        await vorbereiten(ergebnis.songs, {
          warten,
          onFortschritt: (fertig, gesamt) => setFortschritt({ fertig, gesamt }),
          abgebrochen: () => !sichtbar.current,
        });
        setGeladen(ergebnis);
      })
      .catch((e) => {
        // 403: Die Playlist gehört dem DJ nicht, Spotify gibt ihre Songs seit Februar 2026 nicht heraus.
        // Ein neuer Versuch hilft dann nicht.
        if (e instanceof SpotifyFehler && e.status === 403) {
          setFehler({
            meldung:
              "Spotify gibt die Songs dieser Playlist nicht heraus. Kopiere sie in eine eigene Playlist.",
            nochmal: false,
          });
          return;
        }
        // fetch meldet ein unterbrochenes Netz als TypeError.
        setFehler({
          meldung:
            e instanceof TypeError
              ? "Keine Verbindung. Prüfe das Internet und versuch es nochmal."
              : e.message,
          nochmal: true,
        });
      });
  }, [playlist.id, accessToken, warten, versuch]);

  // Musik: null während des Verbindens, sonst der Player oder der Grund, warum es keine Musik gibt.
  const [musik, setMusik] = useState<
    { abspieler: Abspieler } | { fehler: string } | null
  >(null);
  const verbunden = useRef(false);

  // Verbinden, sobald die Songs vorbereitet sind, damit "Spiel starten" den Player schon im Klick aktivieren kann.
  useEffect(() => {
    if (!geladen || verbunden.current) return;
    verbunden.current = true;
    verbinden()
      .then((abspieler) => setMusik({ abspieler }))
      .catch((e: Error) => setMusik({ fehler: e.message }));
  }, [geladen, verbinden]);

  const abspieler = musik && "abspieler" in musik ? musik.abspieler : undefined;

  // Beim Verlassen trennen, sonst bleibt "Musik-App Tisch" als Gerät in Spotify stehen.
  useEffect(() => {
    if (!abspieler) return;
    return () => abspieler.trennen();
  }, [abspieler]);

  if (spielSongs) {
    return (
      <SpielAnsicht
        songs={spielSongs}
        sofort
        abspieler={abspieler}
        onJahrKorrigiert={korrekturSpeichern}
        raum={raum}
      />
    );
  }

  const unsicher = geladen
    ? unsichereJahre(geladen.songs, gespeicherteJahre())
    : 0;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button
        className="self-start text-akzent underline outline-akzent focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={onZurueck}
      >
        Zurück
      </button>
      <h2 className="font-schild text-3xl text-akzent">{playlist.name}</h2>
      {geladen ? (
        <>
          <p className="text-sm text-licht/70">
            {musik === null
              ? "Musik wird verbunden …"
              : "fehler" in musik
                ? `Musik nicht verfügbar: ${musik.fehler}`
                : "Musik bereit"}
          </p>
          <h2 className="font-schild text-2xl">
            {geladen.songs.length}{" "}
            {geladen.songs.length === 1 ? "Song" : "Songs"} bereit,{" "}
            {geladen.uebersprungen} übersprungen
          </h2>
          {geladen.songs.length === 0 ? (
            <p>Keine spielbaren Songs</p>
          ) : (
            <Knopf
              onClick={() => {
                // Im Klick, sonst lässt der Browser keinen Ton zu.
                abspieler?.aktivieren();
                setSpielSongs(
                  songsFuersSpiel(geladen.songs, gespeicherteJahre()),
                );
              }}
            >
              Spiel starten
            </Knopf>
          )}
          {unsicher > 0 && (
            <p className="text-sm text-licht/70">
              {unsicher} {unsicher === 1 ? "Song" : "Songs"} mit unsicherem
              Jahr. Prüfe es bei der Auflösung.
            </p>
          )}
        </>
      ) : fehler ? (
        <>
          <p className="text-signal">{fehler.meldung}</p>
          {fehler.nochmal && (
            <Knopf
              art="neben"
              onClick={() => {
                setFehler(null);
                setFortschritt(null);
                setVersuch((v) => v + 1);
              }}
            >
              Nochmal versuchen
            </Knopf>
          )}
        </>
      ) : fortschritt ? (
        <>
          <p>{`Erscheinungsjahre: ${fortschritt.fertig} von ${fortschritt.gesamt}`}</p>
          <progress
            aria-label={`Erscheinungsjahre: ${fortschritt.fertig} von ${fortschritt.gesamt}`}
            className="w-64 accent-akzent"
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
