"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Buehne from "@/app/ui/buehne";
import Knopf from "@/app/ui/knopf";
import PlaylistAuswahl from "@/app/ui/playlist-auswahl";
import RaumKopf from "@/app/ui/raum-kopf";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import TonTeilen from "@/app/ui/ton-teilen";
import VorbereitenAnsicht from "@/app/ui/vorbereiten-ansicht";
import { neuerRaumCode } from "@/lib/raum/code";
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
  // Ohne Netz ließ sich das Token nicht erneuern, es bleibt aber gespeichert.
  const [unerreichbar, setUnerreichbar] = useState(false);
  // null: Spotify hat die Playlists noch nicht geliefert.
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [gewaehlt, setGewaehlt] = useState<Playlist | null>(null);
  // Wie das Token erst im Effekt gelesen: undefined heißt noch nicht gelesen.
  const [tischRaum, setTischRaum] = useState<TischRaum | null | undefined>(
    undefined,
  );
  // Spielstand für die Handys, die Spielansicht meldet ihn, der Raum-Kopf trägt ihn in Presence.
  const [stand, setStand] = useState<TischStand | null>(null);
  const id = clientId();
  const supabase = supabaseKonfiguriert();

  useEffect(() => {
    // Den Raum unabhängig vom Token lesen: Die Bühne braucht keins und soll nicht auf Spotify warten. Wie das Token
    // über ein Promise, denn direkt im Effekt Zustand setzen verbietet react-hooks/set-state-in-effect.
    Promise.resolve(tischRaumLaden()).then(setTischRaum);
    (id ? gueltigesToken(id) : Promise.resolve(null))
      .catch((fehler) => {
        console.error(fehler);
        setUnerreichbar(true);
        return null;
      })
      .then(setToken);
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
          console.error(fehler);
          setUnerreichbar(true);
        }
      });
  }, [token]);

  if (tischRaum === undefined) return null;

  // Mit dj ein Online-Raum (ADR 0008), ohne ein lokaler.
  function eroeffnen(dj?: string) {
    const raum: TischRaum = {
      code: neuerRaumCode(),
      bekannt: [],
      ...(dj !== undefined && { dj }),
    };
    tischRaumSpeichern(raum);
    setTischRaum(raum);
  }

  const raumWahl = (
    <Buehne
      supabase={supabase}
      onTisch={() => eroeffnen()}
      onOnline={eroeffnen}
      onBeitreten={(c) => router.push(`/raum/${c}`)}
    />
  );

  // Mit Supabase zuerst der Raum, Anmelden und Demo erst danach.
  if (supabase && !tischRaum) return raumWahl;
  if (token === undefined) return null;

  if (!tischRaum || !kanal) {
    return (
      <div className="flex w-full flex-col">
        {raumWahl}
        <div className="flex flex-col items-center gap-8 p-8 text-center">
          {ablauf()}
        </div>
      </div>
    );
  }

  // Im Raum wie im Studio: die Bühne über die ganze Breite, links oben die Schublade mit Code und Spielern.
  // Schmaler als lg steht die Schublade über der Bühne, darüber Platz für den Knopf.
  // Die Hülle mit der Überschrift stand bis zur Bühne in app/page.tsx, Tisch und Vorbereiten sehen aus wie vorher.
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="font-schild text-4xl text-akzent sm:text-5xl">
        Musik-Bingo
      </h1>
      <div className="relative flex w-full flex-col items-center gap-8 pt-14 lg:pt-0">
        <RaumKopf
          code={tischRaum.code}
          kanal={kanal}
          stand={stand}
          dj={tischRaum.dj}
          onGeschlossen={() => {
            setTischRaum(null);
            setStand(null);
          }}
        />
        {/* Online hört jeder den Song im eigenen Browser (ADR 0008). */}
        {tischRaum.dj !== undefined && <TonTeilen kanal={kanal} />}
        <div className="flex w-full justify-center">{ablauf()}</div>
      </div>
    </div>
  );

  // Der Ablauf ohne Raum: Anmelden, Playlists, Vorbereiten, Demo.
  function ablauf() {
    const raum = kanal
      ? { kanal, onStand: setStand, dj: tischRaum?.dj }
      : undefined;
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
      setPlaylists(null);
    }

    const demoKnopf = (
      <Knopf art="neben" onClick={() => setDemo(true)}>
        Demo starten
      </Knopf>
    );

    const unerreichbarHinweis = unerreichbar && (
      <p className="max-w-sm text-sm text-licht/70">
        Spotify ist gerade nicht erreichbar. Verbindung prüfen und die Seite neu
        laden.
      </p>
    );

    if (token) {
      // Im Raum liegt ab lg links oben die Schublade (w-64) über dem Inhalt, das Raster lässt ihr Platz.
      return (
        <div className={kanal ? "w-full lg:pl-72" : "w-full"}>
          <PlaylistAuswahl
            playlists={playlists}
            hinweis={unerreichbarHinweis}
            onWaehlen={setGewaehlt}
            onDemo={() => setDemo(true)}
            onAbmelden={abmeldenKlick}
          />
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
        {unerreichbarHinweis}
        {demoKnopf}
      </div>
    );
  }
}
