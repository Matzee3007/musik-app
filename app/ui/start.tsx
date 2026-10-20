"use client";

import { useEffect, useState } from "react";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import VorbereitenAnsicht from "@/app/ui/vorbereiten-ansicht";
import { SpotifyFehler } from "@/lib/spotify/abruf";
import { clientId } from "@/lib/spotify/konfig";
import { eigenePlaylists, type Playlist } from "@/lib/spotify/playlists";
import {
  abmelden,
  anmeldungStarten,
  gueltigesToken,
} from "@/lib/spotify/sitzung";
import type { Token } from "@/lib/spotify/token";
import { SONGLISTE } from "@/lib/songliste";

const knopf =
  "rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background";

export default function Start() {
  const [demo, setDemo] = useState(false);
  // undefined: noch nicht gelesen. Erst ein Effekt liest den Speicher, sonst gäbe es auf Server
  // und Browser verschiedenes HTML (Hydration-Fehler).
  const [token, setToken] = useState<Token | null | undefined>(undefined);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [gewaehlt, setGewaehlt] = useState<Playlist | null>(null);
  const id = clientId();

  useEffect(() => {
    (id ? gueltigesToken(id) : Promise.resolve(null)).then(setToken);
  }, [id]);

  useEffect(() => {
    if (!token) return;
    eigenePlaylists(token.accessToken)
      .then(setPlaylists)
      .catch((fehler) => {
        // 401: Spotify nimmt das Token nicht mehr an, also neu anmelden lassen.
        if (fehler instanceof SpotifyFehler && fehler.status === 401) {
          abmelden();
          setToken(null);
        } else {
          throw fehler;
        }
      });
  }, [token]);

  if (demo) return <SpielAnsicht songs={SONGLISTE} />;
  if (token === undefined) return null;
  if (token && gewaehlt) {
    return (
      <VorbereitenAnsicht
        playlist={gewaehlt}
        accessToken={token.accessToken}
        onZurueck={() => setGewaehlt(null)}
      />
    );
  }

  async function anmelden() {
    window.location.assign(await anmeldungStarten(id!));
  }

  function abmeldenKlick() {
    abmelden();
    setToken(null);
    setPlaylists([]);
  }

  const demoKnopf = (
    <button className={knopf} onClick={() => setDemo(true)}>
      Demo starten
    </button>
  );

  if (token) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold">Deine Playlists</h2>
        <ul className="flex flex-col gap-1">
          {playlists.map((p) => (
            <li key={p.id}>
              <button className="underline" onClick={() => setGewaehlt(p)}>
                {p.name} ({p.anzahlSongs} Songs)
              </button>
            </li>
          ))}
        </ul>
        <button className={knopf} onClick={abmeldenKlick}>
          Abmelden
        </button>
        {demoKnopf}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        className={`${knopf} disabled:opacity-40`}
        disabled={!id}
        onClick={anmelden}
      >
        Mit Spotify anmelden
      </button>
      {!id && (
        <p className="max-w-sm text-sm">
          Spotify ist hier nicht eingerichtet, nur die Demo. Lokal:
          NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local eintragen.
        </p>
      )}
      {demoKnopf}
    </div>
  );
}
