import { expect, test } from "vitest";
import { wellenPunkte } from "@/app/ui/welle";

const ausschlag = (y: number) => Math.abs(y - 50);

test("außen flach, 11 Zacken abwechselnd oben und unten", () => {
  const p = wellenPunkte(1.3, 1);
  expect(p).toHaveLength(15);
  expect([p[0], p[1], p[13], p[14]].every(([, y]) => y === 50)).toBe(true);
  expect(p.slice(2, 13).map(([, y]) => Math.sign(y - 50))).toEqual([
    -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1,
  ]);
});

test("die mittlere Zacke ist höher als die äußeren", () => {
  const p = wellenPunkte(0, 1);
  expect(ausschlag(p[7][1])).toBeGreaterThan(ausschlag(p[2][1]));
  expect(ausschlag(p[7][1])).toBeGreaterThan(ausschlag(p[12][1]));
});

test("Stärke 0 ist eine flache Linie, kein Ausschlag geht über das Feld hinaus", () => {
  expect(wellenPunkte(2, 0).every(([, y]) => y === 50)).toBe(true);
  for (let s = 0; s < 10; s += 0.37)
    expect(wellenPunkte(s, 1).every(([, y]) => y >= 4 && y <= 96)).toBe(true);
});
