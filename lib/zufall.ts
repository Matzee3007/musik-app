// Liefert Werte in [0, 1) wie Math.random. Tests setzen feste Werte ein.
export type Zufall = () => number;

// Fisher-Yates auf einer Kopie, die Eingabe bleibt unverändert.
export function mischen<T>(
  liste: readonly T[],
  zufall: Zufall = Math.random,
): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}
