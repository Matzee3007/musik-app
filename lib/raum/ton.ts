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
