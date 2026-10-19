import type { Kategorie } from "@/lib/kategorien";
import type { Zufall } from "@/lib/zufall";

export function radDrehen(
  kategorien: readonly Kategorie[],
  zufall: Zufall = Math.random,
): Kategorie {
  return kategorien[Math.floor(zufall() * kategorien.length)];
}
