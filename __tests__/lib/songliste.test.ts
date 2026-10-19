import { expect, test } from "vitest";
import { SONGLISTE } from "@/lib/songliste";

test("25 Songs mit eindeutiger Id", () => {
  expect(SONGLISTE).toHaveLength(25);
  expect(new Set(SONGLISTE.map((s) => s.id)).size).toBe(25);
});

test("mindestens sechs Jahrzehnte, damit die Kategorie Jahrzehnt etwas zu raten hat", () => {
  expect(
    new Set(SONGLISTE.map((s) => Math.floor(s.jahr / 10))).size,
  ).toBeGreaterThanOrEqual(6);
});
