// Wie lang ein Song in einer Runde läuft (siehe "Ausschnitt" im Glossar), in Sekunden oder ganz.
export type Ausschnitt = 15 | 30 | 45 | 60 | "ganz";

export const AUSSCHNITTE: readonly Ausschnitt[] = [15, 30, 45, 60, "ganz"];

export const STANDARD_AUSSCHNITT: Ausschnitt = 30;

// null: kein Ende, der Song läuft ganz.
export function ausschnittMs(a: Ausschnitt): number | null {
  return a === "ganz" ? null : a * 1000;
}

export function ausschnittName(a: Ausschnitt): string {
  return a === "ganz" ? "ganzer Song" : `${a} Sekunden`;
}
