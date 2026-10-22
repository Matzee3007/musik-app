import type { KanalOeffnen, RaumKanal, RaumNachricht } from "@/lib/raum/kanal";
import type { Anwesend } from "@/lib/raum/spieler";

// Nachbau eines Raums für die Tests der Ansichten: Der Test bestimmt, wer anwesend ist, und
// schickt Nachrichten; was die Ansicht anmeldet und sendet, steht in angemeldet und gesendet.
// Mit stoerung scheitern anmelden und senden wie bei Supabase ohne Verbindung.
export function nachgebauterRaum() {
  let anwesende: Anwesend[] = [];
  const anwesendeRueckrufe = new Set<(anwesende: Anwesend[]) => void>();
  const nachrichtRueckrufe = new Set<(nachricht: RaumNachricht) => void>();
  const gesendet: RaumNachricht[] = [];
  const angemeldet: Anwesend[] = [];

  const raum = {
    oeffnen: (() => kanal) as KanalOeffnen,
    anwesendeSetzen(neu: Anwesend[]) {
      anwesende = neu;
      for (const rueckruf of anwesendeRueckrufe) rueckruf(neu);
    },
    nachrichtSchicken(nachricht: RaumNachricht) {
      for (const rueckruf of nachrichtRueckrufe) rueckruf(nachricht);
    },
    gesendet,
    angemeldet,
    stoerung: null as string | null,
  };

  const kanal: RaumKanal = {
    verbinden: async () => anwesende,
    anmelden: async (ich) => {
      if (raum.stoerung) throw new Error(raum.stoerung);
      angemeldet.push(ich);
    },
    beiAnwesenden(rueckruf) {
      anwesendeRueckrufe.add(rueckruf);
      return () => anwesendeRueckrufe.delete(rueckruf);
    },
    senden: async (nachricht) => {
      if (raum.stoerung) throw new Error(raum.stoerung);
      gesendet.push(nachricht);
    },
    beiNachricht(rueckruf) {
      nachrichtRueckrufe.add(rueckruf);
      return () => nachrichtRueckrufe.delete(rueckruf);
    },
    trennen() {},
  };

  return raum;
}
