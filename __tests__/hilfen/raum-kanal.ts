import type { KanalOeffnen, RaumNachricht } from "@/lib/raum/kanal";
import type { Anwesend } from "@/lib/raum/spieler";

// Nachbau eines Raums für die Tests der Ansichten: Der Test bestimmt, wer anwesend ist, und
// schickt Nachrichten; was die Ansicht anmeldet und sendet, steht in angemeldet und gesendet.
export function nachgebauterRaum() {
  let anwesende: Anwesend[] = [];
  const anwesendeRueckrufe = new Set<(anwesende: Anwesend[]) => void>();
  const nachrichtRueckrufe = new Set<(nachricht: RaumNachricht) => void>();
  const gesendet: RaumNachricht[] = [];
  const angemeldet: Anwesend[] = [];

  const oeffnen: KanalOeffnen = () => ({
    verbinden: async () => anwesende,
    anmelden: async (ich) => {
      angemeldet.push(ich);
    },
    beiAnwesenden(rueckruf) {
      anwesendeRueckrufe.add(rueckruf);
      return () => anwesendeRueckrufe.delete(rueckruf);
    },
    senden: async (nachricht) => {
      gesendet.push(nachricht);
    },
    beiNachricht(rueckruf) {
      nachrichtRueckrufe.add(rueckruf);
      return () => nachrichtRueckrufe.delete(rueckruf);
    },
    trennen() {},
  });

  return {
    oeffnen,
    anwesendeSetzen(neu: Anwesend[]) {
      anwesende = neu;
      for (const rueckruf of anwesendeRueckrufe) rueckruf(neu);
    },
    nachrichtSchicken(nachricht: RaumNachricht) {
      for (const rueckruf of nachrichtRueckrufe) rueckruf(nachricht);
    },
    gesendet,
    angemeldet,
  };
}
