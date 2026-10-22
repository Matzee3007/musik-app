import type { HandyKarte } from "@/lib/raum/handy-karte";

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

// Nur für denselben Code: Ein Handy, das einen anderen Raum öffnet, fragt neu nach dem Namen.
export function handyRaumLaden(code: string): HandyRaum | null {
  const raum: HandyRaum | null = JSON.parse(
    localStorage.getItem(HANDY) ?? "null",
  );
  return raum?.code === code ? raum : null;
}

export function handyRaumSpeichern(raum: HandyRaum): void {
  localStorage.setItem(HANDY, JSON.stringify(raum));
}

// Mit dem Raum ist auch die Karte vorbei.
export function handyRaumLoeschen(): void {
  localStorage.removeItem(HANDY);
  localStorage.removeItem(KARTE);
}

export function handyKarteLaden(): HandyKarte | null {
  return JSON.parse(localStorage.getItem(KARTE) ?? "null");
}

export function handyKarteSpeichern(karte: HandyKarte): void {
  localStorage.setItem(KARTE, JSON.stringify(karte));
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
