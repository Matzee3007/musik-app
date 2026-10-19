import type { Zufall } from "@/lib/zufall";

// Gibt die Werte der Reihe nach zurück, danach wieder von vorn.
export function zufallsfolge(...werte: number[]): Zufall {
  let i = 0;
  return () => werte[i++ % werte.length];
}
