import type { SupabaseClient } from "@supabase/supabase-js";
import type { Anwesend } from "@/lib/raum/spieler";
import { supabaseClient } from "@/lib/supabase";

export type RaumNachricht = { art: "geschlossen" }; // Plan C ergänzt Runde und Auflösung

export interface RaumKanal {
  // Abonniert den Kanal und liefert die Anwesenden nach dem ersten Presence-Abgleich ("sync").
  verbinden(): Promise<Anwesend[]>;
  // Meldet das eigene Gerät an (Presence "track").
  anmelden(ich: Anwesend): Promise<void>;
  // Jede Änderung der Anwesenden, liefert eine Funktion zum Abmelden des Rückrufs.
  beiAnwesenden(rueckruf: (anwesende: Anwesend[]) => void): () => void;
  senden(nachricht: RaumNachricht): Promise<void>;
  beiNachricht(rueckruf: (nachricht: RaumNachricht) => void): () => void;
  trennen(): void;
}

// Name des Broadcast-Ereignisses, unter dem alle Raum-Nachrichten laufen.
const NACHRICHT = "nachricht";

export type KanalOeffnen = (code: string, schluessel: string) => RaumKanal;

// Je Presence-Schlüssel der erste Eintrag, ohne die Felder, die Supabase ergänzt (presence_ref).
function anwesendeLesen(zustand: Record<string, Anwesend[]>): Anwesend[] {
  return Object.values(zustand).map(([a]) =>
    a.rolle === "tisch"
      ? { schluessel: a.schluessel, rolle: "tisch" }
      : { schluessel: a.schluessel, rolle: "spieler", name: a.name },
  );
}

// Der Client wird übergeben, damit Tests einen Nachbau einsetzen können.
export function raumKanalUeber(
  client: Pick<SupabaseClient, "channel" | "removeChannel">,
): KanalOeffnen {
  return (code, schluessel) => {
    const kanal = client.channel(`raum:${code}`, {
      config: { presence: { key: schluessel } },
    });
    let ersterAbgleich: (anwesende: Anwesend[]) => void = () => {};
    let abgelehnt: (fehler: Error) => void = () => {};
    const abgeglichen = new Promise<Anwesend[]>((gut, schlecht) => {
      ersterAbgleich = gut;
      abgelehnt = schlecht;
    });
    const anwesendeRueckrufe = new Set<(anwesende: Anwesend[]) => void>();
    kanal.on("presence", { event: "sync" }, () => {
      const anwesende = anwesendeLesen(kanal.presenceState<Anwesend>());
      ersterAbgleich(anwesende);
      for (const rueckruf of anwesendeRueckrufe) rueckruf(anwesende);
    });
    const nachrichtRueckrufe = new Set<(nachricht: RaumNachricht) => void>();
    kanal.on("broadcast", { event: NACHRICHT }, ({ payload }) => {
      for (const rueckruf of nachrichtRueckrufe) rueckruf(payload);
    });

    // React ruft Effekte im Strict Mode doppelt auf, Supabase erlaubt aber nur ein subscribe() je Kanal.
    let abonniert = false;

    return {
      verbinden() {
        if (abonniert) return abgeglichen;
        abonniert = true;
        kanal.subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            abgelehnt(new Error("Keine Verbindung zum Raum."));
          }
        });
        return abgeglichen;
      },
      async anmelden(ich) {
        await kanal.track(ich);
      },
      beiAnwesenden(rueckruf) {
        anwesendeRueckrufe.add(rueckruf);
        return () => anwesendeRueckrufe.delete(rueckruf);
      },
      async senden(nachricht) {
        await kanal.send({
          type: "broadcast",
          event: NACHRICHT,
          payload: nachricht,
        });
      },
      beiNachricht(rueckruf) {
        nachrichtRueckrufe.add(rueckruf);
        return () => nachrichtRueckrufe.delete(rueckruf);
      },
      trennen() {
        void client.removeChannel(kanal);
      },
    };
  };
}

export const supabaseRaumKanal: KanalOeffnen = (code, schluessel) =>
  raumKanalUeber(supabaseClient())(code, schluessel);
