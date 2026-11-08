"use client";

import { useState } from "react";
import Knopf from "@/app/ui/knopf";
import { raumCodeLesen } from "@/lib/raum/code";
import { nameLesen } from "@/lib/raum/spieler";

// Ring aus fünf Segmenten wie das Rad, in Messing-Tönen und Signal. Die Maske lässt nur den Kranz stehen.
const ring: React.CSSProperties = {
  background:
    "conic-gradient(from -20deg, var(--color-akzent) 0 72deg, #3a3226 0 144deg, #dcbd7e 0 216deg, #5a4a2d 0 288deg, var(--color-signal) 0)",
  mask: "radial-gradient(circle, transparent 54%, #000 54.5%, #000 70%, transparent 70.5%)",
};

const logoRing: React.CSSProperties = {
  background:
    "conic-gradient(var(--color-akzent) 0 72deg, #8a6f3b 0 144deg, #dcbd7e 0 216deg, #6e5a35 0 288deg, var(--color-signal) 0)",
  mask: "radial-gradient(circle, transparent 38%, #000 40%)",
};

// Startseite vor dem Raum (Plan docs/plaene/2026-11-08-startseite-buehne.md): oben der DJ, darunter die Mitspieler.
export default function Buehne({
  supabase,
  onTisch,
  onOnline,
  onBeitreten,
}: {
  supabase: boolean;
  onTisch: () => void;
  onOnline: (dj: string) => void;
  onBeitreten: (code: string) => void;
}) {
  // Name des DJs für einen Online-Raum, null: "Online spielen" noch nicht gewählt.
  const [djEingabe, setDjEingabe] = useState<string | null>(null);
  const [codeEingabe, setCodeEingabe] = useState("");
  const djName = djEingabe === null ? null : nameLesen(djEingabe);
  const code = raumCodeLesen(codeEingabe);

  return (
    // Ohne Supabase (Vorschauen) bleibt die Bühne niedrig, damit Demo und Anmelden darunter gleich zu sehen sind.
    <div
      className={`flex w-full flex-col text-left ${supabase ? "flex-1" : ""}`}
    >
      <section
        className={`relative overflow-hidden border-b border-licht/10 bg-[radial-gradient(ellipse_at_80%_40%,#2a2620_0,var(--color-grund)_60%)] ${supabase ? "flex-1 sm:min-h-[640px]" : ""}`}
      >
        <div
          aria-hidden
          className="absolute top-[70px] -right-[150px] size-[300px] rounded-full opacity-35 xl:top-[76px] xl:-right-[140px] xl:size-[720px] xl:opacity-90"
          style={ring}
        />
        <div
          aria-hidden
          className="absolute top-[70px] right-[202px] z-[1] hidden border-x-[18px] border-t-[34px] border-x-transparent border-t-licht xl:block"
        />
        <header className="relative z-[2] flex h-[60px] items-center px-5 sm:h-[68px] sm:px-12">
          <div className="flex items-center gap-2.5">
            <span className="size-[30px] rounded-full" style={logoRing} />
            <span className="font-schild text-2xl font-bold">Musik-Bingo</span>
          </div>
        </header>
        <div className="relative z-[2] max-w-[660px] px-5 pt-7 pb-9 sm:px-12 sm:pt-[72px] sm:pb-16">
          <h1 className="mb-[18px] font-schild text-[52px] leading-[0.95] font-bold sm:text-[84px]">
            Dreh das Rad. <br />
            <span className="text-akzent">Erkenn den Song.</span>
          </h1>
          <p className="mb-6 max-w-[520px] text-[17px] text-licht/70 sm:mb-9 sm:text-xl">
            Musik-Bingo für den Abend mit Freunden. Du bist der DJ und spielst
            die Songs aus deinem Spotify.
          </p>
          <div className="grid max-w-[560px] gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="flex flex-col">
              <Knopf disabled={!supabase} onClick={onTisch}>
                Am Tisch spielen
              </Knopf>
              <p className="mt-2.5 text-[15px] text-licht/70">
                Alle in einem Raum, der Laptop spielt den Ton.
              </p>
            </div>
            <div className="flex flex-col">
              <Knopf
                art="neben"
                disabled={!supabase}
                onClick={() => setDjEingabe("")}
              >
                Online spielen
              </Knopf>
              <p className="mt-2.5 text-[15px] text-licht/70">
                Jeder bei sich, du teilst den Ton über den Browser.
              </p>
            </div>
          </div>
          {djEingabe !== null && (
            <div className="mt-6 flex max-w-[560px] flex-col gap-3">
              <label htmlFor="dj-name" className="font-semibold">
                Dein Name
              </label>
              <input
                id="dj-name"
                className="rounded-lg bg-flaeche px-4 py-3 text-xl outline-akzent focus-visible:outline-2"
                value={djEingabe}
                onChange={(e) => setDjEingabe(e.target.value)}
              />
              <Knopf disabled={!djName} onClick={() => onOnline(djName!)}>
                Online-Raum eröffnen
              </Knopf>
            </div>
          )}
          {!supabase && (
            <p className="mt-6 max-w-sm text-sm text-licht/70">
              Supabase ist hier nicht eingerichtet, nur die Demo ohne Raum.
            </p>
          )}
        </div>
      </section>
      {supabase && (
        <section className="bg-flaeche">
          <div className="flex flex-col items-stretch gap-3.5 px-5 py-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-7 sm:px-12 sm:py-7">
            <div>
              <h2 className="font-schild text-[28px]">Mitspielen</h2>
              <p className="text-licht/70">Code vom DJ eingeben, ohne Konto.</p>
            </div>
            {/* Wie eine Anzeigetafel. Kein maxLength: raumCodeLesen nimmt auch "EH MF" mit Leerzeichen. */}
            <div className="flex flex-col items-stretch gap-3 sm:ml-auto sm:flex-row sm:items-center">
              <input
                aria-label="Raum-Code"
                className="rounded-lg border border-licht/10 bg-grund px-4 py-2 text-center font-schild text-[32px] tracking-[0.3em] uppercase outline-akzent focus-visible:outline-2 disabled:opacity-40 sm:w-[200px]"
                value={codeEingabe}
                onChange={(e) => setCodeEingabe(e.target.value)}
                disabled={!supabase}
              />
              <Knopf
                art="neben"
                disabled={!code}
                onClick={() => onBeitreten(code!)}
              >
                Beitreten
              </Knopf>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
