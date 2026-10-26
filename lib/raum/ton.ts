import type { RaumKanal } from "@/lib/raum/kanal";

// Ton vom DJ im Online-Modus (ADR 0008): Der DJ schickt die Tonspur seines Tabs per WebRTC an jeden Spieler, eine
// Verbindung je Spieler. Die Verbindungsdaten (Signaling) laufen als Raum-Nachricht "ton" über den Kanal des Raums.
// von und an sind Tab-Kennungen (tabSchluessel). "bereit": Der DJ teilt jetzt Ton. "hallo": Ein Spieler möchte ihn.
export type TonSignal =
  | { art: "bereit"; von: string }
  | { art: "hallo"; von: string }
  | { art: "angebot"; an: string; von: string; sdp: RTCSessionDescriptionInit }
  | { art: "antwort"; an: string; von: string; sdp: RTCSessionDescriptionInit }
  | { art: "kandidat"; an: string; von: string; kandidat: RTCIceCandidateInit };

function istBeschreibung(wert: unknown): wert is RTCSessionDescriptionInit {
  const b = wert as RTCSessionDescriptionInit | null;
  return typeof b?.type === "string" && typeof b.sdp === "string";
}

// Signale kommen von anderen Geräten: Form prüfen, bevor eine Verbindung sie bekommt.
export function istTonSignal(wert: unknown): wert is TonSignal {
  const s = wert as Record<string, unknown> | null;
  if (typeof s?.von !== "string") return false;
  switch (s.art) {
    case "bereit":
    case "hallo":
      return true;
    case "angebot":
    case "antwort":
      return typeof s.an === "string" && istBeschreibung(s.sdp);
    case "kandidat":
      return (
        typeof s.an === "string" &&
        typeof s.kandidat === "object" &&
        s.kandidat !== null
      );
    default:
      return false;
  }
}

// Was ton.ts von einer RTCPeerConnection braucht. Die Tests geben einen Nachbau hinein, jsdom kennt kein WebRTC.
export type Verbindung = Pick<
  RTCPeerConnection,
  | "addTrack"
  | "createOffer"
  | "createAnswer"
  | "setLocalDescription"
  | "setRemoteDescription"
  | "addIceCandidate"
  | "close"
  | "localDescription"
  | "connectionState"
  | "onicecandidate"
  | "ontrack"
  | "onconnectionstatechange"
>;

// Öffentlicher STUN-Server, über den zwei Browser hinter ihren Routern zueinander finden. Kein TURN (ADR 0008).
export const ICE: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function signalSenden(kanal: RaumKanal, signal: TonSignal): Promise<void> {
  return kanal.senden({ art: "ton", signal });
}

// Ton-Signale der Reihe nach verarbeiten: Ein Kandidat darf erst nach Angebot bzw. Antwort eingetragen werden
// (Lehre aus dem Durchstich). Ein Fehler geht an beiFehler, die nächsten Signale kommen trotzdem dran.
function nacheinander(
  kanal: RaumKanal,
  verarbeiten: (signal: TonSignal) => Promise<void>,
  beiFehler: (fehler: unknown) => void,
): () => void {
  let kette = Promise.resolve();
  return kanal.beiNachricht((nachricht) => {
    if (nachricht.art !== "ton") return;
    kette = kette.then(() => verarbeiten(nachricht.signal)).catch(beiFehler);
  });
}

// Der DJ schickt die Tonspur aus strom an jeden Spieler, der "hallo" sagt. beiAnzahl meldet, wie viele Spieler
// verbunden sind. Liefert eine Funktion, die alle Verbindungen schließt.
export function tonSenden(
  kanal: RaumKanal,
  ich: string,
  strom: MediaStream,
  beiAnzahl: (verbunden: number) => void,
  neu: () => Verbindung = () => new RTCPeerConnection(ICE),
  beiFehler: (fehler: unknown) => void = console.error,
): () => void {
  const spur = strom.getAudioTracks()[0];
  // Je Spieler (Tab-Kennung) seine Verbindung. Ein neues "hallo", etwa nach dem Neuladen, ersetzt die alte.
  const verbindungen = new Map<string, Verbindung>();
  function zaehlen() {
    beiAnzahl(
      [...verbindungen.values()].filter(
        (v) => v.connectionState === "connected",
      ).length,
    );
  }

  const abmelden = nacheinander(
    kanal,
    async (signal) => {
      if (signal.art === "hallo") {
        const spieler = signal.von;
        verbindungen.get(spieler)?.close();
        const v = neu();
        verbindungen.set(spieler, v);
        zaehlen();
        v.addTrack(spur, strom);
        v.onicecandidate = (e) => {
          if (!e.candidate) return;
          signalSenden(kanal, {
            art: "kandidat",
            an: spieler,
            von: ich,
            kandidat: e.candidate.toJSON(),
          }).catch(beiFehler);
        };
        v.onconnectionstatechange = zaehlen;
        await v.setLocalDescription(await v.createOffer());
        await signalSenden(kanal, {
          art: "angebot",
          an: spieler,
          von: ich,
          sdp: v.localDescription!,
        });
        return;
      }
      if (signal.art !== "antwort" && signal.art !== "kandidat") return;
      if (signal.an !== ich) return;
      const v = verbindungen.get(signal.von);
      if (!v) return;
      if (signal.art === "antwort") await v.setRemoteDescription(signal.sdp);
      else await v.addIceCandidate(signal.kandidat);
    },
    beiFehler,
  );
  signalSenden(kanal, { art: "bereit", von: ich }).catch(beiFehler);

  return () => {
    abmelden();
    for (const v of verbindungen.values()) v.close();
    verbindungen.clear();
  };
}
