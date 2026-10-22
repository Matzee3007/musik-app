"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { raumCodeLesen } from "@/lib/raum/code";
import { supabaseRaumKanal, type KanalOeffnen } from "@/lib/raum/kanal";
import {
  handyRaumLaden,
  handyRaumLoeschen,
  handyRaumSpeichern,
  tabSchluessel,
} from "@/lib/raum/speicher";
import {
  nameLesen,
  nameVergeben,
  tischDa,
  type Anwesend,
} from "@/lib/raum/spieler";
import { supabaseKonfiguriert } from "@/lib/supabase";

type Zustand =
  | { art: "verbinde" }
  | { art: "kein-tisch" }
  | { art: "name" }
  | { art: "drin"; name: string }
  | { art: "geschlossen" }
  | { art: "fehler"; text: string };

// Der Raum am Handy: Name eingeben, beitreten, auf das Spiel warten (Plan C zeigt hier die Karte).
export default function HandyRaum({
  code,
  kanalOeffnen = supabaseRaumKanal,
}: {
  code: string;
  kanalOeffnen?: KanalOeffnen;
}) {
  const raumCode = raumCodeLesen(code);
  const supabase = supabaseKonfiguriert();
  // Nur im Browser: Die Tab-Kennung liegt im sessionStorage, den es auf dem Server nicht gibt.
  const kanal = useMemo(
    () =>
      raumCode && supabase && typeof window !== "undefined"
        ? kanalOeffnen(raumCode, tabSchluessel())
        : null,
    [raumCode, supabase, kanalOeffnen],
  );
  const [zustand, setZustand] = useState<Zustand>({ art: "verbinde" });
  const [anwesende, setAnwesende] = useState<Anwesend[]>([]);
  const [eingabe, setEingabe] = useState("");
  const [vergeben, setVergeben] = useState(false);

  useEffect(() => {
    if (!kanal || !raumCode) return;
    const anwesendeAb = kanal.beiAnwesenden(setAnwesende);
    const nachrichtAb = kanal.beiNachricht((nachricht) => {
      if (nachricht.art !== "geschlossen") return;
      handyRaumLoeschen();
      kanal.trennen();
      setZustand({ art: "geschlossen" });
    });
    kanal
      .verbinden()
      .then((anwesende) => {
        setAnwesende(anwesende);
        // Nach dem Neuladen gleich wieder hinein, auch wenn der Tisch gerade kurz fehlt.
        const gemerkt = handyRaumLaden(raumCode);
        if (gemerkt) {
          setZustand({ art: "drin", name: gemerkt.name });
          return kanal.anmelden({
            schluessel: tabSchluessel(),
            rolle: "spieler",
            name: gemerkt.name,
          });
        }
        setZustand(
          tischDa(anwesende) ? { art: "name" } : { art: "kein-tisch" },
        );
      })
      .catch((e: Error) => setZustand({ art: "fehler", text: e.message }));
    return () => {
      anwesendeAb();
      nachrichtAb();
    };
  }, [kanal, raumCode]);

  if (!raumCode) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p>Ungültiger Raum-Code.</p>
        <Link className="underline" href="/">
          Zur Startseite
        </Link>
      </div>
    );
  }
  if (!supabase) return <p>Supabase ist hier nicht eingerichtet.</p>;

  const name = nameLesen(eingabe);

  async function beitreten() {
    if (!kanal || !name) return;
    const ich = tabSchluessel();
    if (nameVergeben(anwesende, name, ich)) {
      setVergeben(true);
      return;
    }
    await kanal.anmelden({ schluessel: ich, rolle: "spieler", name });
    handyRaumSpeichern({ code: raumCode!, name });
    setZustand({ art: "drin", name });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-semibold">Raum {raumCode}</h1>
      {zustand.art === "kein-tisch" && (
        <p>Kein Tisch mit dem Code {raumCode}. Code prüfen.</p>
      )}
      {zustand.art === "fehler" && <p>{zustand.text}</p>}
      {zustand.art === "name" && (
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="name">Dein Name</label>
          <input
            id="name"
            className="rounded border px-2 py-1"
            value={eingabe}
            onChange={(e) => {
              setEingabe(e.target.value);
              setVergeben(false);
            }}
          />
          <button
            className="rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background disabled:opacity-40"
            disabled={!name}
            onClick={beitreten}
          >
            Beitreten
          </button>
          {vergeben && <p>Name schon vergeben</p>}
        </div>
      )}
      {zustand.art === "drin" && (
        <>
          <p>
            Du bist im Raum {raumCode} als {zustand.name}.
          </p>
          <p>Warte auf das Spiel …</p>
        </>
      )}
      {zustand.art === "geschlossen" && <p>Raum geschlossen</p>}
    </div>
  );
}
