"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RaumKopf from "@/app/ui/raum-kopf";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import VorbereitenAnsicht from "@/app/ui/vorbereiten-ansicht";
import { neuerRaumCode, raumCodeLesen } from "@/lib/raum/code";
import { supabaseRaumKanal, type KanalOeffnen } from "@/lib/raum/kanal";
import type { TischStand } from "@/lib/raum/stand";
import {
  tabSchluessel,
  tischRaumLaden,
  tischRaumSpeichern,
  type TischRaum,
} from "@/lib/raum/speicher";
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
import { supabaseKonfiguriert } from "@/lib/supabase";

const knopf =
  "rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background";

export default function Start({
  kanalOeffnen = supabaseRaumKanal,
}: {
  kanalOeffnen?: KanalOeffnen;
}) {
  const router = useRouter();
  const [demo, setDemo] = useState(false);
  // undefined: noch nicht gelesen. Erst ein Effekt liest den Speicher, sonst gäbe es auf Server
  // und Browser verschiedenes HTML (Hydration-Fehler).
  const [token, setToken] = useState<Token | null | undefined>(undefined);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [gewaehlt, setGewaehlt] = useState<Playlist | null>(null);
  // Wie das Token erst im Effekt gelesen: undefined heißt noch nicht gelesen.
  const [tischRaum, setTischRaum] = useState<TischRaum | null | undefined>(
    undefined,
  );
  const [codeEingabe, setCodeEingabe] = useState("");
  // Spielstand für die Handys, die Spielansicht meldet ihn, der Raum-Kopf trägt ihn in Presence.
  const [stand, setStand] = useState<TischStand | null>(null);
  const id = clientId();
  const supabase = supabaseKonfiguriert();

  useEffect(() => {
    (id ? gueltigesToken(id) : Promise.resolve(null)).then((t) => {
      setToken(t);
      setTischRaum(tischRaumLaden());
    });
  }, [id]);

  // Ein Kanal je Raum, sonst bräche bei jedem Neuzeichnen die Verbindung ab.
  const code = tischRaum?.code;
  const kanal = useMemo(
    () => (code && supabase ? kanalOeffnen(code, tabSchluessel()) : null),
    [code, supabase, kanalOeffnen],
  );

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

  if (token === undefined || tischRaum === undefined) return null;

  function eroeffnen() {
    const raum = { code: neuerRaumCode(), bekannt: [] };
    tischRaumSpeichern(raum);
    setTischRaum(raum);
  }

  const gelesenerCode = raumCodeLesen(codeEingabe);
  const raumWahl = (
    <div className="flex flex-col items-center gap-4">
      <button
        className={`${knopf} disabled:opacity-40`}
        disabled={!supabase}
        onClick={eroeffnen}
      >
        Raum eröffnen
      </button>
      <div className="flex items-center gap-2">
        <label htmlFor="raum-code">Raum-Code</label>
        <input
          id="raum-code"
          className="w-24 rounded border px-2 py-1 uppercase"
          value={codeEingabe}
          onChange={(e) => setCodeEingabe(e.target.value)}
          disabled={!supabase}
        />
        <button
          className="rounded-lg border px-4 py-1 disabled:opacity-40"
          disabled={!supabase || !gelesenerCode}
          onClick={() => router.push(`/raum/${gelesenerCode}`)}
        >
          Beitreten
        </button>
      </div>
      {!supabase && (
        <p className="max-w-sm text-sm">
          Supabase ist hier nicht eingerichtet, nur die Demo ohne Raum.
        </p>
      )}
    </div>
  );

  // Mit Supabase zuerst der Raum, Anmelden und Demo erst danach.
  if (supabase && !tischRaum) return raumWahl;

  return (
    <div className="flex flex-col items-center gap-8">
      {tischRaum && kanal ? (
        <RaumKopf
          code={tischRaum.code}
          kanal={kanal}
          stand={stand}
          onGeschlossen={() => {
            setTischRaum(null);
            setStand(null);
          }}
        />
      ) : (
        raumWahl
      )}
      {ablauf()}
    </div>
  );

  // Der Ablauf ohne Raum: Anmelden, Playlists, Vorbereiten, Demo.
  function ablauf() {
    const raum = kanal ? { kanal, onStand: setStand } : undefined;
    if (demo) return <SpielAnsicht songs={SONGLISTE} raum={raum} />;
    if (token && gewaehlt) {
      return (
        <VorbereitenAnsicht
          playlist={gewaehlt}
          accessToken={token.accessToken}
          onZurueck={() => setGewaehlt(null)}
          raum={raum}
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
}
