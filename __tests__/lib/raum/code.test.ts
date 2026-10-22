import { expect, test } from "vitest";
import { neuerRaumCode, raumCodeLesen } from "@/lib/raum/code";

test("neuerRaumCode nimmt vier Buchstaben aus dem Alphabet", () => {
  expect(neuerRaumCode(() => 0)).toBe("AAAA");
  expect(neuerRaumCode(() => 0.999)).toBe("ZZZZ");
});

test("neuerRaumCode enthält nie I, L oder O", () => {
  for (let i = 0; i < 200; i++) {
    expect(neuerRaumCode()).not.toMatch(/[ILO]/);
  }
});

test("raumCodeLesen nimmt Kleinbuchstaben und Leerzeichen an", () => {
  expect(raumCodeLesen(" ab cd ")).toBe("ABCD");
});

test("raumCodeLesen lehnt falsche Länge und verwechselbare Buchstaben ab", () => {
  expect(raumCodeLesen("ABC")).toBeNull();
  expect(raumCodeLesen("ABCDE")).toBeNull();
  expect(raumCodeLesen("ABIO")).toBeNull();
  expect(raumCodeLesen("AB1D")).toBeNull();
});
