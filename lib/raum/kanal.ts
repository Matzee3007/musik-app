import type { SupabaseClient } from "@supabase/supabase-js";
import type { Anwesend } from "@/lib/raum/spieler";
import { supabaseClient } from "@/lib/supabase";

// Runde und Auflösung laufen über Presence (ADR 0005), Broadcast nur für "geschlossen".
export type RaumNachricht = { art: "geschlossen" };

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
// stand nur, wenn das Gerät einen gemeldet hat.
function anwesendeLesen(zustand: Record<string, Anwesend[]>): Anwesend[] {
  return Object.values(zustand).map(([a]) => {
    if (a.rolle === "tisch") {
      const { schluessel, rolle, stand } = a;
      return stand ? { schluessel, rolle, stand } : { schluessel, rolle };
    }
    const { schluessel, rolle, name, stand } = a;
    return stand
      ? { schluessel, rolle, name, stand }
      : { schluessel, rolle, name };
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
      for (const rueckruf of nachrichtRueckrufe) rueckruf(payload);
    });

    // React ruft Effekte im Strict Mode doppelt auf, Supabase erlaubt aber nur ein subscribe() je Kanal.
    let abonniert = false;
    // Supabase vergisst die Presence, wenn die Verbindung abreißt (z. B. gesperrter Bildschirm), und
    // tritt beim Zurückkommen ohne sie wieder bei. Deshalb bei jedem SUBSCRIBED neu anmelden.
    let angemeldetAls: Anwesend | null = null;

    const raumKanal: RaumKanal = {
      verbinden() {
        if (!abonniert) {
          abonniert = true;
          kanal.subscribe((status) => {
            // Scheitert das, hilft der nächste Wiederbeitritt; der Name bleibt bis dahin grau.
            if (status === "SUBSCRIBED" && angemeldetAls) {
              kanal.track(angemeldetAls).catch(() => {});
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
        pruefen(await kanal.track(ich));
        angemeldetAls = ich;
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
