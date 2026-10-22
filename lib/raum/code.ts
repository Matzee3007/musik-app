import type { Zufall } from "@/lib/zufall";

// Großbuchstaben ohne I, L und O, die man leicht mit 1, I und 0 verwechselt.
export const RAUM_BUCHSTABEN = "ABCDEFGHJKMNPQRSTUVWXYZ";

const LAENGE = 4;

export function neuerRaumCode(zufall: Zufall = Math.random): string {
  let code = "";
  for (let i = 0; i < LAENGE; i++) {
    code += RAUM_BUCHSTABEN[Math.floor(zufall() * RAUM_BUCHSTABEN.length)];
  }
  return code;
}

// Getippter Code oder Teil der Adresse: Leerzeichen raus, groß geschrieben. null, wenn es kein Raum-Code ist.
export function raumCodeLesen(eingabe: string): string | null {
  const code = eingabe.replace(/\s/g, "").toUpperCase();
  if (code.length !== LAENGE) return null;
  return [...code].every((b) => RAUM_BUCHSTABEN.includes(b)) ? code : null;
}
