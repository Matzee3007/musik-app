// Ein Gerät im Raum laut Presence. schluessel ist die Kennung des Tabs, zugleich der Presence-Schlüssel.
export type Anwesend =
  | { schluessel: string; rolle: "tisch" }
  | { schluessel: string; rolle: "spieler"; name: string };

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
export function spielerleiste(
  bekannt: readonly string[],
  anwesende: readonly Anwesend[],
): { name: string; verbunden: boolean }[] {
  const verbunden = anwesende.flatMap((a) =>
    a.rolle === "spieler" ? [a.name] : [],
  );
  // Nach dem Neuladen eines Handys steht sein Name kurz doppelt in Presence, deshalb jeden nur einmal.
  const neu = verbunden.filter(
    (name, i) => !bekannt.includes(name) && verbunden.indexOf(name) === i,
  );
  return [
    ...bekannt.map((name) => ({ name, verbunden: verbunden.includes(name) })),
    ...neu.map((name) => ({ name, verbunden: true })),
  ];
}
