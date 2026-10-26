import type { SupabaseClient } from "@supabase/supabase-js";
import type { Anwesend } from "@/lib/raum/spieler";
import {
  istSpielerStand,
  istTischStand,
  type SpielerStand,
  type TischStand,
} from "@/lib/raum/stand";
import { supabaseClient } from "@/lib/supabase";

// Der Spielstand läuft über Broadcast (ADR 0006). Wer neu dazukommt oder wieder verbunden ist, schickt
// "anfrage", und jedes Gerät antwortet mit seinem Stand.
export type RaumNachricht =
  | { art: "geschlossen" }
  | { art: "anfrage" }
  | { art: "tisch"; stand: TischStand | null }
  | { art: "spieler"; name: string; stand: SpielerStand };

// Nachrichten kommen von anderen Geräten, etwa einer älteren Fassung der App: Form prüfen.
export function raumNachrichtLesen(wert: unknown): RaumNachricht | null {
  const n = wert as Record<string, unknown> | null;
  switch (n?.art) {
    case "geschlossen":
    case "anfrage":
      return { art: n.art };
    case "tisch":
      return n.stand === null || istTischStand(n.stand)
        ? { art: "tisch", stand: n.stand }
        : null;
    case "spieler":
      return typeof n.name === "string" && istSpielerStand(n.stand)
        ? { art: "spieler", name: n.name, stand: n.stand }
        : null;
    default:
      return null;
  }
}

export interface RaumKanal {
  // Abonniert den Kanal und liefert die Anwesenden nach dem ersten Presence-Abgleich ("sync").
  verbinden(): Promise<Anwesend[]>;
  // Meldet das eigene Gerät an (Presence "track").
  anmelden(ich: Anwesend): Promise<void>;
  // Jede Änderung der Anwesenden, liefert eine Funktion zum Abmelden des Rückrufs.
  beiAnwesenden(rueckruf: (anwesende: Anwesend[]) => void): () => void;
  senden(nachricht: RaumNachricht): Promise<void>;
  beiNachricht(rueckruf: (nachricht: RaumNachricht) => void): () => void;
  // Jedes SUBSCRIBED, auch nach einem Wiederbeitritt, liefert eine Funktion zum Abmelden des Rückrufs.
  beiVerbunden(rueckruf: () => void): () => void;
  trennen(): void;
}

// Name des Broadcast-Ereignisses, unter dem alle Raum-Nachrichten laufen.
const NACHRICHT = "nachricht";

export type KanalOeffnen = (code: string, schluessel: string) => RaumKanal;

// Je Presence-Schlüssel der erste Eintrag, ohne die Felder, die Supabase ergänzt (presence_ref).
function anwesendeLesen(zustand: Record<string, Anwesend[]>): Anwesend[] {
  return Object.values(zustand).map(([a]) => {
    if (a.rolle === "tisch") {
      const { schluessel, rolle, name } = a;
      return name === undefined
        ? { schluessel, rolle }
        : { schluessel, rolle, name };
    }
    const { schluessel, rolle, name } = a;
    return { schluessel, rolle, name };
  });
}

// Supabase meldet nur ok, wenn track() oder send() angekommen sind, statt bei Fehlern zu werfen.
function pruefen(antwort: string): void {
  if (antwort !== "ok") throw new Error("Keine Verbindung zum Raum.");
}

// Der Client wird übergeben, damit Tests einen Nachbau einsetzen können.
export function raumKanalUeber(
  client: Pick<SupabaseClient, "channel" | "removeChannel">,
): KanalOeffnen {
  // Supabase liefert für denselben Raum denselben Kanal, auf dem schon abonniert ist. Deshalb je Raum
  // ein RaumKanal, bis er getrennt wird, etwa wenn ein Handy die Raum-Seite verlässt und zurückkehrt.
  const offen = new Map<string, RaumKanal>();
  return (code, schluessel) => {
    const vorhanden = offen.get(code);
    if (vorhanden) return vorhanden;
    const kanal = client.channel(`raum:${code}`, {
      config: { presence: { key: schluessel } },
    });
    let ersterAbgleich: () => void = () => {};
    let abgelehnt: (fehler: Error) => void = () => {};
    const abgeglichen = new Promise<void>((gut, schlecht) => {
      ersterAbgleich = gut;
      abgelehnt = schlecht;
    });
    const anwesendeRueckrufe = new Set<(anwesende: Anwesend[]) => void>();
    kanal.on("presence", { event: "sync" }, () => {
      const anwesende = anwesendeLesen(kanal.presenceState<Anwesend>());
      ersterAbgleich();
      for (const rueckruf of anwesendeRueckrufe) rueckruf(anwesende);
    });
    const nachrichtRueckrufe = new Set<(nachricht: RaumNachricht) => void>();
    kanal.on("broadcast", { event: NACHRICHT }, ({ payload }) => {
      const nachricht = raumNachrichtLesen(payload);
      if (!nachricht) return;
      for (const rueckruf of nachrichtRueckrufe) rueckruf(nachricht);
    });
    const verbundenRueckrufe = new Set<() => void>();

    // React ruft Effekte im Strict Mode doppelt auf, Supabase erlaubt aber nur ein subscribe() je Kanal.
    let abonniert = false;
    // Supabase vergisst die Presence, wenn die Verbindung abreißt (z. B. gesperrter Bildschirm), und
    // tritt beim Zurückkommen ohne sie wieder bei. Deshalb bei jedem SUBSCRIBED neu anmelden.
    let angemeldetAls: Anwesend | null = null;
    // Laufen zwei Anmeldungen gleichzeitig, kann die ältere zuletzt fertig werden. Gemerkt wird nur die neueste.
    let anmeldungen = 0;

    const raumKanal: RaumKanal = {
      verbinden() {
        if (!abonniert) {
          abonniert = true;
          kanal.subscribe((status) => {
            // Scheitert das, hilft der nächste Wiederbeitritt; der Name bleibt bis dahin grau.
            if (status === "SUBSCRIBED" && angemeldetAls) {
              kanal.track(angemeldetAls).catch(() => {});
            }
            if (status === "SUBSCRIBED") {
              for (const rueckruf of verbundenRueckrufe) rueckruf();
            }
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              abgelehnt(new Error("Keine Verbindung zum Raum."));
            }
          });
        }
        // Wer später kommt, bekommt den aktuellen Stand, nicht den des ersten Abgleichs.
        return abgeglichen.then(() =>
          anwesendeLesen(kanal.presenceState<Anwesend>()),
        );
      },
      async anmelden(ich) {
        const nummer = ++anmeldungen;
        pruefen(await kanal.track(ich));
        if (nummer === anmeldungen) angemeldetAls = ich;
      },
      beiAnwesenden(rueckruf) {
        anwesendeRueckrufe.add(rueckruf);
        return () => anwesendeRueckrufe.delete(rueckruf);
      },
      async senden(nachricht) {
        pruefen(
          await kanal.send({
            type: "broadcast",
            event: NACHRICHT,
            payload: nachricht,
          }),
        );
      },
      beiNachricht(rueckruf) {
        nachrichtRueckrufe.add(rueckruf);
        return () => nachrichtRueckrufe.delete(rueckruf);
      },
      beiVerbunden(rueckruf) {
        verbundenRueckrufe.add(rueckruf);
        return () => verbundenRueckrufe.delete(rueckruf);
      },
      trennen() {
        offen.delete(code);
        void client.removeChannel(kanal);
      },
    };
    offen.set(code, raumKanal);
    return raumKanal;
  };
}

// Einmal angelegt, damit alle Ansichten dieselben offenen Räume sehen.
let echterKanal: KanalOeffnen | undefined;
export const supabaseRaumKanal: KanalOeffnen = (code, schluessel) =>
  (echterKanal ??= raumKanalUeber(supabaseClient()))(code, schluessel);
