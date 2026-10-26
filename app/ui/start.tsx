"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "@/app/ui/knopf";
import RaumKopf from "@/app/ui/raum-kopf";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import VorbereitenAnsicht from "@/app/ui/vorbereiten-ansicht";
import { neuerRaumCode, raumCodeLesen } from "@/lib/raum/code";
import { nameLesen } from "@/lib/raum/spieler";
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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [gewaehlt, setGewaehlt] = useState<Playlist | null>(null);
  // Wie das Token erst im Effekt gelesen: undefined heißt noch nicht gelesen.
  const [tischRaum, setTischRaum] = useState<TischRaum | null | undefined>(
    undefined,
  );
  const [codeEingabe, setCodeEingabe] = useState("");
  // Name des DJs für einen Online-Raum, null: "Online spielen" noch nicht gewählt.
  const [djEingabe, setDjEingabe] = useState<string | null>(null);
  // Spielstand für die Handys, die Spielansicht meldet ihn, der Raum-Kopf trägt ihn in Presence.
  const [stand, setStand] = useState<TischStand | null>(null);
  const id = clientId();
  const supabase = supabaseKonfiguriert();

  useEffect(() => {
    (id ? gueltigesToken(id) : Promise.resolve(null))
      .catch((fehler) => {
        console.error(fehler);
        setUnerreichbar(true);
        return null;
      })
      .then((t) => {
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
          console.error(fehler);
          setUnerreichbar(true);
        }
      });
  }, [token]);

  if (token === undefined || tischRaum === undefined) return null;

  // Mit dj ein Online-Raum (ADR 0008), ohne ein lokaler.
  function eroeffnen(dj?: string) {
    const raum: TischRaum = {
      code: neuerRaumCode(),
      bekannt: [],
      ...(dj !== undefined && { dj }),
    };
    tischRaumSpeichern(raum);
    setTischRaum(raum);
    setDjEingabe(null);
  }

  const gelesenerCode = raumCodeLesen(codeEingabe);
  const djName = djEingabe === null ? null : nameLesen(djEingabe);
  const raumWahl = (
    <div className="flex flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-3">
          <Knopf disabled={!supabase} onClick={() => eroeffnen()}>
            Lokal spielen
          </Knopf>
          <Knopf
            art="neben"
            disabled={!supabase}
            onClick={() => setDjEingabe("")}
          >
            Online spielen
          </Knopf>
        </div>
        {djEingabe !== null && (
          <div className="flex w-full max-w-xs flex-col items-stretch gap-3">
            <label htmlFor="dj-name" className="text-licht/70">
              Dein Name
            </label>
            <input
              id="dj-name"
              className="rounded-lg bg-flaeche px-4 py-3 text-xl outline-akzent focus-visible:outline-2"
              value={djEingabe}
              onChange={(e) => setDjEingabe(e.target.value)}
            />
            <Knopf disabled={!djName} onClick={() => eroeffnen(djName!)}>
              Online-Raum eröffnen
            </Knopf>
          </div>
        )}
      </div>
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

  // Im Raum wie im Studio: die Bühne über die ganze Breite, links oben die Schublade mit Code und Spielern.
  // Schmaler als lg steht die Schublade über der Bühne, darüber Platz für den Knopf.
  return (
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
      <div className="flex w-full justify-center">{ablauf()}</div>
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
      setPlaylists([]);
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
      return (
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <h2 className="font-schild text-2xl">Deine Playlists</h2>
          {unerreichbarHinweis}
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
        {unerreichbarHinweis}
        {demoKnopf}
      </div>
    );
  }
}
