import { Logo, ring } from "@/app/ui/buehne";
import Knopf from "@/app/ui/knopf";

// Der DJ hat einen Raum eröffnet, ist aber noch nicht bei Spotify angemeldet
// (Plan docs/plaene/2026-11-09-raum-offen-buehne.md). Sieht aus wie die Bühne, die Schublade steht links,
// wo sie auch im Spiel liegt. Die Schublade kommt fertig aus Start. Ton teilen fehlt hier: Vor dem Anmelden gibt es
// noch keinen Ton, und ein Wechsel der Ansicht bräche das Teilen ab (Review PR #85, Fund 1).
export default function RaumOffen({
  code,
  online,
  adresse,
  schublade,
  anmeldenAus,
  hinweis,
  onAnmelden,
  onDemo,
}: {
  code: string;
  online: boolean;
  adresse: string;
  schublade: React.ReactNode;
  anmeldenAus: boolean;
  hinweis?: React.ReactNode;
  onAnmelden: () => void;
  onDemo: () => void;
}) {
  return (
    <div className="flex w-full flex-1 flex-col text-left">
      <section className="relative flex-1 border-b border-licht/10 bg-[radial-gradient(ellipse_at_80%_40%,#2a2620_0,var(--color-grund)_60%)] sm:min-h-[640px]">
        {/* Nur der Ring wird zugeschnitten, sonst schnitte overflow-hidden auch Schublade und Fehlerzeile ab. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute top-[70px] -right-[150px] size-[300px] rounded-full opacity-35 xl:top-[110px] xl:-right-[190px] xl:size-[640px] xl:opacity-90"
            style={ring}
          />
          <div className="absolute top-[110px] right-[112px] z-[1] hidden border-x-[18px] border-t-[34px] border-x-transparent border-t-licht xl:block" />
        </div>
        <header className="relative z-[2] flex h-[60px] items-center px-5 sm:h-[68px] sm:px-12">
          <Logo />
        </header>
        <div className="relative z-[2] grid gap-8 px-5 pt-5 pb-9 sm:px-12 sm:pt-10 sm:pb-14 lg:grid-cols-[256px_minmax(0,600px)] lg:gap-16">
          {/* Die Schublade schwebt ab lg sonst frei (lg:absolute in RaumKopf). Hier steht sie im Fluss, damit die Spalte
              mit vielen Spielern mitwächst. min-h-10: Platz für den Knopf, wenn sie ausgeblendet ist. */}
          <div className="relative order-2 mx-auto min-h-10 w-full max-w-xs lg:order-none lg:mx-0 lg:[&>section]:static">
            {schublade}
          </div>
          <div className="lg:pt-8">
            <h1 className="mb-5 font-schild text-[42px] leading-[0.95] font-bold sm:text-[76px]">
              Raum {code} ist offen. <br />
              <span className="text-akzent">Verbinde die Musik.</span>
            </h1>
            <p className="mb-6 max-w-[540px] text-[17px] text-licht/70 sm:mb-9 sm:text-xl">
              Deine Mitspieler können jetzt beitreten. Melde dich bei Spotify
              an, dann spielst du die Songs aus deinen eigenen Playlists.
            </p>
            <div className="grid max-w-[560px] gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="flex flex-col">
                <Knopf disabled={anmeldenAus} onClick={onAnmelden}>
                  Mit Spotify anmelden
                </Knopf>
                <p className="mt-2.5 text-[15px] text-licht/70">
                  Nur du brauchst ein Konto, deine Mitspieler nicht.
                </p>
              </div>
              <div className="flex flex-col">
                <Knopf art="neben" onClick={onDemo}>
                  Demo starten
                </Knopf>
                <p className="mt-2.5 text-[15px] text-licht/70">
                  Mit Beispielsongs, ganz ohne Spotify.
                </p>
              </div>
            </div>
            {hinweis && <div className="mt-6">{hinweis}</div>}
          </div>
        </div>
      </section>
      <section className="bg-flaeche">
        <div className="flex flex-col gap-1 px-5 py-6 sm:flex-row sm:items-center sm:gap-7 sm:px-12 sm:py-7">
          <h2 className="font-schild text-[28px]">
            So kommen die anderen rein
          </h2>
          <p className="break-words text-licht/70">
            {online
              ? `Link schicken: ${adresse}/raum/${code}`
              : `QR-Code scannen oder ${adresse} öffnen und ${code} eingeben.`}
          </p>
        </div>
      </section>
    </div>
  );
}
