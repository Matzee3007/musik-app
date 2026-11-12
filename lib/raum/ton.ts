import type { RaumKanal } from "@/lib/raum/kanal";
import type { Anwesend } from "@/lib/raum/spieler";

// Ton vom DJ im Online-Modus (ADR 0008): Der DJ schickt die Tonspur seines Tabs per WebRTC an jeden Spieler, eine
// Verbindung je Spieler. Die Verbindungsdaten (Signaling) laufen als Raum-Nachricht "ton" über den Kanal des Raums.
// von und an sind Tab-Kennungen (tabSchluessel). "bereit": Der DJ teilt jetzt Ton. "ende": Er hört damit auf.
// "hallo": Ein Spieler möchte Ton.
// versuch kennzeichnet ein "hallo" und alles, was zu seiner Verbindung gehört. Sagt ein Spieler zweimal kurz
// hintereinander "hallo" (React Strict Mode, Wiederbeitritt), passte sonst seine Antwort auf das erste Angebot nicht
// zur zweiten Verbindung des DJs, und der Ton kam nie an.
export type TonSignal =
  | { art: "bereit" | "ende"; von: string }
  | { art: "hallo"; von: string; versuch: string }
  | Beschreibung<"angebot">
  | Beschreibung<"antwort">
  | {
      art: "kandidat";
      an: string;
      von: string;
      versuch: string;
      kandidat: RTCIceCandidateInit;
    };

type Beschreibung<A extends "angebot" | "antwort"> = {
  art: A;
  an: string;
  von: string;
  versuch: string;
  sdp: RTCSessionDescriptionInit;
};

function istBeschreibung(wert: unknown): wert is RTCSessionDescriptionInit {
  const b = wert as RTCSessionDescriptionInit | null;
  return typeof b?.type === "string" && typeof b.sdp === "string";
}

// Signale kommen von anderen Geräten: Form prüfen, bevor eine Verbindung sie bekommt.
export function istTonSignal(wert: unknown): wert is TonSignal {
  const s = wert as Record<string, unknown> | null;
  if (typeof s?.von !== "string") return false;
  if (s.art === "bereit" || s.art === "ende") return true;
  if (typeof s.versuch !== "string") return false;
  switch (s.art) {
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
// einreihen stellt ein Signal von Hand in dieselbe Reihe, abmelden hört auf.
function nacheinander(
  kanal: RaumKanal,
  verarbeiten: (signal: TonSignal) => Promise<void>,
  beiFehler: (fehler: unknown) => void,
): { abmelden: () => void; einreihen: (signal: TonSignal) => void } {
  let kette = Promise.resolve();
  function einreihen(signal: TonSignal) {
    kette = kette.then(() => verarbeiten(signal)).catch(beiFehler);
  }
  const abmelden = kanal.beiNachricht((nachricht) => {
    if (nachricht.art === "ton") einreihen(nachricht.signal);
  });
  return { abmelden, einreihen };
}

// Der DJ schickt die Tonspur aus strom an jeden Spieler, der "hallo" sagt und als Spieler in Presence steht
// (ADR 0010). beiAnzahl meldet, wie viele Spieler verbunden sind. Liefert eine Funktion, die alle Verbindungen
// schließt.
export function tonSenden(
  kanal: RaumKanal,
  ich: string,
  strom: MediaStream,
  beiAnzahl: (verbunden: number) => void,
  neu: () => Verbindung = () => new RTCPeerConnection(ICE),
  beiFehler: (fehler: unknown) => void = console.error,
): () => void {
  const spur = strom.getAudioTracks()[0];
  // Je Spieler (Tab-Kennung) seine Verbindung und der Versuch, zu dem sie gehört. Ein neues "hallo", etwa nach dem
  // Neuladen, ersetzt die alte.
  const verbindungen = new Map<string, { v: Verbindung; versuch: string }>();
  function zaehlen() {
    beiAnzahl(
      [...verbindungen.values()].filter(
        ({ v }) => v.connectionState === "connected",
      ).length,
    );
  }

  // Ein "hallo" kann vor der Presence des Spielers ankommen: Das letzte je Gerät wartet, bis es sichtbar wird.
  let sichtbar = new Set<string>();
  const wartend = new Map<string, TonSignal>();

  const { abmelden, einreihen } = nacheinander(
    kanal,
    async (signal) => {
      if (signal.art === "hallo") {
        const { von: spieler, versuch } = signal;
        if (!sichtbar.has(spieler)) {
          wartend.set(spieler, signal);
          return;
        }
        wartend.delete(spieler);
        verbindungen.get(spieler)?.v.close();
        const v = neu();
        verbindungen.set(spieler, { v, versuch });
        zaehlen();
        v.addTrack(spur, strom);
        v.onicecandidate = (e) => {
          if (!e.candidate) return;
          signalSenden(kanal, {
            art: "kandidat",
            an: spieler,
            von: ich,
            versuch,
            kandidat: e.candidate.toJSON(),
          }).catch(beiFehler);
        };
        v.onconnectionstatechange = () => {
          // Ein gegangener Spieler: Verbindung zu, sonst hielte der DJ sie bis zum Ende des Teilens offen.
          if (
            v.connectionState === "failed" ||
            v.connectionState === "closed"
          ) {
            v.close();
            if (verbindungen.get(spieler)?.v === v)
              verbindungen.delete(spieler);
          }
          zaehlen();
        };
        await v.setLocalDescription(await v.createOffer());
        await signalSenden(kanal, {
          art: "angebot",
          an: spieler,
          von: ich,
          versuch,
          sdp: v.localDescription!,
        });
        return;
      }
      if (signal.art !== "antwort" && signal.art !== "kandidat") return;
      if (signal.an !== ich) return;
      const eintrag = verbindungen.get(signal.von);
      if (eintrag?.versuch !== signal.versuch) return;
      if (signal.art === "antwort")
        await eintrag.v.setRemoteDescription(signal.sdp);
      else await eintrag.v.addIceCandidate(signal.kandidat);
    },
    beiFehler,
  );
  function anwesendeSehen(anwesende: Anwesend[]) {
    sichtbar = new Set(
      anwesende.filter((a) => a.rolle === "spieler").map((a) => a.schluessel),
    );
    for (const [spieler, signal] of wartend) {
      if (!sichtbar.has(spieler)) continue;
      wartend.delete(spieler);
      einreihen(signal);
    }
  }
  const anwesendeAb = kanal.beiAnwesenden(anwesendeSehen);
  kanal.verbinden().then(anwesendeSehen, beiFehler);
  // Auch nach einem Wiederbeitritt des DJs: "hallo" aus der Zeit ohne Verbindung sind verloren.
  function bereit() {
    signalSenden(kanal, { art: "bereit", von: ich }).catch(beiFehler);
  }
  const verbundenAb = kanal.beiVerbunden(bereit);
  bereit();

  return () => {
    abmelden();
    anwesendeAb();
    verbundenAb();
    wartend.clear();
    for (const { v } of verbindungen.values()) v.close();
    verbindungen.clear();
    signalSenden(kanal, { art: "ende", von: ich }).catch(beiFehler);
  };
}

// Ein Spieler bittet mit "hallo" um Ton, beim Start, nach jedem Wiederbeitritt, wenn ein DJ "bereit" meldet und wenn
// die Verbindung abbricht. Er nimmt das erste Angebot zu seinem letzten "hallo" an und gibt die ankommende Tonspur an
// beiStrom, null, sobald sie nicht mehr kommt. Liefert eine Funktion, die den Empfang beendet.
export function tonEmpfangen(
  kanal: RaumKanal,
  ich: string,
  beiStrom: (strom: MediaStream | null) => void,
  neu: () => Verbindung = () => new RTCPeerConnection(ICE),
  beiFehler: (fehler: unknown) => void = console.error,
): () => void {
  let verbindung: Verbindung | null = null;
  // Der DJ, dessen Angebot angenommen ist. Weitere Angebote (etwa eines zweiten Tabs) zählen nicht.
  let dj: string | null = null;
  // Kennung des letzten "hallo". Kein crypto.randomUUID: Das gibt es nur auf sicheren Seiten.
  let versuch = "";

  function trennen() {
    if (verbindung) beiStrom(null);
    verbindung?.close();
    verbindung = null;
    dj = null;
  }

  // Der DJ legt auf "hallo" eine neue Verbindung an und schließt die alte, deshalb hier ebenso von vorn.
  function vonVorn() {
    trennen();
    versuch = Math.random().toString(36).slice(2);
    signalSenden(kanal, { art: "hallo", von: ich, versuch }).catch(beiFehler);
  }

  const { abmelden } = nacheinander(
    kanal,
    async (signal) => {
      if (signal.art === "bereit") {
        vonVorn();
        return;
      }
      if (signal.art === "ende") {
        if (signal.von === dj) trennen();
        return;
      }
      if (signal.art !== "angebot" && signal.art !== "kandidat") return;
      if (signal.an !== ich || signal.versuch !== versuch) return;
      if (signal.art === "kandidat") {
        if (signal.von === dj)
          await verbindung!.addIceCandidate(signal.kandidat);
        return;
      }
      if (dj !== null) return;
      const sender = signal.von;
      dj = sender;
      const v = neu();
      verbindung = v;
      v.ontrack = (e) => beiStrom(e.streams[0]);
      // Abgebrochen (Netz weg, DJ hat neu geladen): neu versuchen.
      v.onconnectionstatechange = () => {
        if (v.connectionState === "failed" && verbindung === v) vonVorn();
      };
      v.onicecandidate = (e) => {
        if (!e.candidate) return;
        signalSenden(kanal, {
          art: "kandidat",
          an: sender,
          von: ich,
          versuch: signal.versuch,
          kandidat: e.candidate.toJSON(),
        }).catch(beiFehler);
      };
      await v.setRemoteDescription(signal.sdp);
      await v.setLocalDescription(await v.createAnswer());
      await signalSenden(kanal, {
        art: "antwort",
        an: sender,
        von: ich,
        versuch: signal.versuch,
        sdp: v.localDescription!,
      });
    },
    beiFehler,
  );
  const verbundenAb = kanal.beiVerbunden(vonVorn);
  vonVorn();

  return () => {
    abmelden();
    verbundenAb();
    verbindung?.close();
    verbindung = null;
  };
}
