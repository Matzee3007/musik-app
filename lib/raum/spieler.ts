import type { SpielerStand, TischStand } from "@/lib/raum/stand";

// Ein Gerät im Raum laut Presence. schluessel ist die Kennung des Tabs, zugleich der Presence-Schlüssel.
// stand fehlt, solange das Gerät noch keinen gemeldet hat.
export type Anwesend =
  | { schluessel: string; rolle: "tisch"; stand?: TischStand }
  | {
      schluessel: string;
      rolle: "spieler";
      name: string;
      stand?: SpielerStand;
    };

const NAME_MAX = 20;

// Getippter Name: Leerzeichen am Rand weg, mehrere zu einem. null, wenn leer oder zu lang.
export function nameLesen(eingabe: string): string | null {
  const name = eingabe.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= NAME_MAX ? name : null;
}

// Vergeben, wenn ein anderer Spieler den Namen trägt, ohne Unterschied von Groß- und Kleinschreibung.
// Der eigene Eintrag (ich) zählt nicht: Nach dem Neuladen steht er noch kurz in Presence.
export function nameVergeben(
  anwesende: readonly Anwesend[],
  name: string,
  ich: string,
): boolean {
  const gesucht = name.toLowerCase();
  return anwesende.some(
    (a) =>
      a.rolle === "spieler" &&
      a.schluessel !== ich &&
      a.name.toLowerCase() === gesucht,
  );
}

export function tischDa(anwesende: readonly Anwesend[]): boolean {
  return anwesende.some((a) => a.rolle === "tisch");
}

// Alle bekannten Spieler in ihrer Reihenfolge, dahinter neue verbundene. Der Tisch ist kein Eintrag.
// abgehakt nur bei verbundenen Spielern, die einen Stand für das laufende Spiel gemeldet haben.
export function spielerleiste(
  bekannt: readonly string[],
  anwesende: readonly Anwesend[],
  spiel: string | null,
): { name: string; verbunden: boolean; abgehakt: number | null }[] {
  const verbunden = anwesende.flatMap((a) =>
    a.rolle === "spieler" ? [a.name] : [],
  );
  // Nach dem Neuladen eines Handys steht sein Name kurz doppelt in Presence, deshalb jeden nur einmal.
  const neu = verbunden.filter(
    (name, i) => !bekannt.includes(name) && verbunden.indexOf(name) === i,
  );
  function abgehakt(name: string): number | null {
    for (const a of anwesende) {
      if (a.rolle === "spieler" && a.name === name && a.stand?.spiel === spiel)
        return a.stand.abgehakt;
    }
    return null;
  }
  return [
    ...bekannt.map((name) => ({
      name,
      verbunden: verbunden.includes(name),
      abgehakt: abgehakt(name),
    })),
    ...neu.map((name) => ({ name, verbunden: true, abgehakt: abgehakt(name) })),
  ];
}
