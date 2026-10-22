import { istHandyKarte, type HandyKarte } from "@/lib/raum/handy-karte";

// Merkt den Raum über Neuladen hinweg: am Tisch und am Handy im localStorage, die Kennung des Tabs im
// sessionStorage. Die ist je Tab verschieden, damit Tisch und Handy im selben Browser getrennt bleiben.
const TISCH = "musik-app:tisch-raum";
const HANDY = "musik-app:handy-raum";
const GERAET = "musik-app:geraet";
const KARTE = "musik-app:handy-karte";
const NOTIZEN = "musik-app:notizen";

export type TischRaum = { code: string; bekannt: string[] };
export type HandyRaum = { code: string; name: string };

export function tischRaumLaden(): TischRaum | null {
  return JSON.parse(localStorage.getItem(TISCH) ?? "null");
}

export function tischRaumSpeichern(raum: TischRaum): void {
  localStorage.setItem(TISCH, JSON.stringify(raum));
}

export function tischRaumLoeschen(): void {
  localStorage.removeItem(TISCH);
}

// Raum und Karte am Handy liegen in beiden Speichern: Der sessionStorage hält sie je Tab über Neuladen, damit
// zwei Tabs im selben Browser getrennt bleiben. Ein neuer Tab (z. B. QR-Code erneut gescannt) nimmt den
// zuletzt gespeicherten Stand aus dem localStorage.
function handyLesen(schluessel: string): string | null {
  return sessionStorage.getItem(schluessel) ?? localStorage.getItem(schluessel);
}

function handySchreiben(schluessel: string, wert: unknown): void {
  const text = JSON.stringify(wert);
  sessionStorage.setItem(schluessel, text);
  localStorage.setItem(schluessel, text);
}

// Nur für denselben Code: Ein Handy, das einen anderen Raum öffnet, fragt neu nach dem Namen.
export function handyRaumLaden(code: string): HandyRaum | null {
  const raum: HandyRaum | null = JSON.parse(handyLesen(HANDY) ?? "null");
  return raum?.code === code ? raum : null;
}

export function handyRaumSpeichern(raum: HandyRaum): void {
  handySchreiben(HANDY, raum);
}

// Mit dem Raum ist auch die Karte vorbei.
export function handyRaumLoeschen(): void {
  for (const speicher of [sessionStorage, localStorage]) {
    speicher.removeItem(HANDY);
    speicher.removeItem(KARTE);
  }
}

// null auch bei einem beschädigten oder veralteten Eintrag, dann teilt das Handy eine neue Karte aus.
export function handyKarteLaden(): HandyKarte | null {
  try {
    const karte: unknown = JSON.parse(handyLesen(KARTE) ?? "null");
    return istHandyKarte(karte) ? karte : null;
  } catch {
    return null;
  }
}

export function handyKarteSpeichern(karte: HandyKarte): void {
  handySchreiben(KARTE, karte);
}

// Die Notizfläche ist an, bis der Spieler sie ausschaltet. Gilt für alle Räume dieses Handys.
export function notizenAn(): boolean {
  return localStorage.getItem(NOTIZEN) !== "aus";
}

export function notizenSpeichern(an: boolean): void {
  if (an) localStorage.removeItem(NOTIZEN);
  else localStorage.setItem(NOTIZEN, "aus");
}

export function tabSchluessel(): string {
  let schluessel = sessionStorage.getItem(GERAET);
  if (!schluessel) {
    schluessel = crypto.randomUUID();
    sessionStorage.setItem(GERAET, schluessel);
  }
  return schluessel;
}
