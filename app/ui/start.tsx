"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "@/app/ui/knopf";
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
    <div className="flex flex-col items-center gap-10">
      <Knopf disabled={!supabase} onClick={eroeffnen}>
        Raum eröffnen
      </Knopf>
      {/* Wie eine Anzeigetafel. Kein maxLength: raumCodeLesen nimmt auch "EH MF" mit Leerzeichen. */}
      <div className="flex flex-col items-center gap-3">
        <label htmlFor="raum-code" className="text-licht/70">
          Raum-Code
        </label>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <input
            id="raum-code"
            className="w-48 rounded-lg bg-flaeche px-4 py-2 text-center font-schild text-3xl tracking-[0.3em] uppercase outline-akzent focus-visible:outline-2 disabled:opacity-40"
            value={codeEingabe}
            onChange={(e) => setCodeEingabe(e.target.value)}
            disabled={!supabase}
          />
          <Knopf
            art="neben"
            disabled={!supabase || !gelesenerCode}
            onClick={() => router.push(`/raum/${gelesenerCode}`)}
          >
            Beitreten
          </Knopf>
        </div>
      </div>
      {!supabase && (
        <p className="max-w-sm text-sm text-licht/70">
          Supabase ist hier nicht eingerichtet, nur die Demo ohne Raum.
        </p>
      )}
    </div>
  );

  // Mit Supabase zuerst der Raum, Anmelden und Demo erst danach.
  if (supabase && !tischRaum) return raumWahl;

  if (!tischRaum || !kanal) {
    return (
      <div className="flex flex-col items-center gap-8">
        {raumWahl}
        {ablauf()}
      </div>
    );
  }

  // Im Raum wie im Studio: links die Kulisse mit Code und Spielern, rechts die Bühne.
  return (
    <div className="grid w-full max-w-6xl items-start gap-12 lg:grid-cols-[16rem_1fr]">
      <RaumKopf
        code={tischRaum.code}
        kanal={kanal}
        stand={stand}
        onGeschlossen={() => {
          setTischRaum(null);
          setStand(null);
        }}
      />
      <div className="flex justify-center">{ablauf()}</div>
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
      <Knopf art="neben" onClick={() => setDemo(true)}>
        Demo starten
      </Knopf>
    );

    if (token) {
      return (
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <h2 className="font-schild text-2xl">Deine Playlists</h2>
          <ul className="flex w-full flex-col gap-2">
            {playlists.map((p) => (
              <li key={p.id}>
                <button
                  className="w-full rounded-lg bg-flaeche px-4 py-3 text-left font-semibold outline-akzent focus-visible:outline-2"
                  onClick={() => setGewaehlt(p)}
                >
                  {p.name} ({p.anzahlSongs} Songs)
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-center gap-3">
            {demoKnopf}
            <Knopf art="neben" onClick={abmeldenKlick}>
              Abmelden
            </Knopf>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <Knopf disabled={!id} onClick={anmelden}>
          Mit Spotify anmelden
        </Knopf>
        {!id && (
          <p className="max-w-sm text-sm text-licht/70">
            Spotify ist hier nicht eingerichtet, nur die Demo. Lokal:
            NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local eintragen.
          </p>
        )}
        {demoKnopf}
      </div>
    );
  }
}
