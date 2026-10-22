// Punkte der Wellenlinie in der Musikspur, im Feld 240 × 100 mit der Mitte bei y = 50: außen flach, dazwischen
// Zacken abwechselnd nach oben und unten. Die Hülle ist in der Mitte am höchsten, jede Zacke schwankt mit eigenem
// Takt. staerke 1: Der Song läuft, kleiner: Er steht, 0: flache Linie.
const ZACKEN = 11;
const RAND = 34;
const MITTE = 50;
const HOEHE = 46;

export function wellenPunkte(
  sekunden: number,
  staerke: number,
): [number, number][] {
  const breite = 240 - 2 * RAND;
  const punkte: [number, number][] = [
    [6, MITTE],
    [RAND, MITTE],
  ];
  for (let i = 0; i < ZACKEN; i++) {
    const lage = (i + 0.5) / ZACKEN;
    const huelle = Math.pow(Math.sin(Math.PI * lage), 1.6);
    // Zwischen 0,1 und 1: Keine Zacke kippt auf die andere Seite.
    const wackeln =
      0.55 +
      0.3 * Math.sin(sekunden * (5.1 + i * 0.7) + i * 1.9) +
      0.15 * Math.sin(sekunden * (11.3 - i * 0.4) + i);
    const hoehe = HOEHE * huelle * wackeln * staerke;
    punkte.push([RAND + lage * breite, MITTE + (i % 2 ? hoehe : -hoehe)]);
  }
  punkte.push([240 - RAND, MITTE], [234, MITTE]);
  return punkte;
}
