import type { Verbindung } from "@/lib/raum/ton";

// Nachbau einer RTCPeerConnection für die Tests von lib/raum/ton.ts: jsdom kennt kein WebRTC. Merkt sich Tonspuren,
// die Beschreibung der Gegenseite (entfernt), eingetragene Kandidaten und ob die Verbindung zu ist. Wie das Original
// lehnt addIceCandidate ohne Beschreibung der Gegenseite ab. Mit verzoegern() wird setRemoteDescription erst nach
// weiter() fertig, so lässt sich die Reihenfolge prüfen.
export function nachgebauteVerbindung() {
  let verzoegert = false;
  let weiterGehen: () => void = () => {};
  const v = {
    spuren: [] as MediaStreamTrack[],
    entfernt: null as RTCSessionDescriptionInit | null,
    kandidaten: [] as RTCIceCandidateInit[],
    geschlossen: false,
    localDescription: null as RTCSessionDescriptionInit | null,
    connectionState: "new" as RTCPeerConnectionState,
    onicecandidate: null as
      | ((e: { candidate: { toJSON(): RTCIceCandidateInit } | null }) => void)
      | null,
    ontrack: null as ((e: { streams: MediaStream[] }) => void) | null,
    onconnectionstatechange: null as (() => void) | null,
    addTrack(spur: MediaStreamTrack) {
      v.spuren.push(spur);
    },
    async createOffer() {
      return { type: "offer" as const, sdp: "angebot" };
    },
    async createAnswer() {
      return { type: "answer" as const, sdp: "antwort" };
    },
    async setLocalDescription(beschreibung: RTCSessionDescriptionInit) {
      v.localDescription = beschreibung;
    },
    async setRemoteDescription(beschreibung: RTCSessionDescriptionInit) {
      if (verzoegert) await new Promise<void>((gut) => (weiterGehen = gut));
      v.entfernt = beschreibung;
    },
    async addIceCandidate(kandidat: RTCIceCandidateInit) {
      if (!v.entfernt) throw new Error("Keine Beschreibung der Gegenseite");
      v.kandidaten.push(kandidat);
    },
    close() {
      v.geschlossen = true;
    },
    verzoegern() {
      verzoegert = true;
    },
    weiter() {
      weiterGehen();
    },
    zustand(zustand: RTCPeerConnectionState) {
      v.connectionState = zustand;
      v.onconnectionstatechange?.();
    },
    kandidatFinden(kandidat: RTCIceCandidateInit) {
      v.onicecandidate?.({ candidate: { toJSON: () => kandidat } });
    },
    spurKommt(strom: MediaStream) {
      v.ontrack?.({ streams: [strom] });
    },
  };
  return v;
}

export type NachgebauteVerbindung = ReturnType<typeof nachgebauteVerbindung>;

// Fabrik für tonSenden und tonEmpfangen: Jede neue Verbindung landet in alle.
export function verbindungsFabrik() {
  const alle: NachgebauteVerbindung[] = [];
  const neu = () => {
    const v = nachgebauteVerbindung();
    alle.push(v);
    return v as unknown as Verbindung;
  };
  return { neu, alle };
}

// Wartet, bis alle anstehenden Promises der Signal-Verarbeitung durch sind.
export function ruhe() {
  return new Promise((gut) => setTimeout(gut, 0));
}
