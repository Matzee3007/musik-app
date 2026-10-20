import { expect, test } from "vitest";
import {
  AUSSCHNITTE,
  ausschnittMs,
  ausschnittName,
  STANDARD_AUSSCHNITT,
} from "@/lib/ausschnitt";

test("Ausschnitte von 15 Sekunden bis ganz, Standard 30", () => {
  expect(AUSSCHNITTE).toEqual([15, 30, 45, 60, "ganz"]);
  expect(STANDARD_AUSSCHNITT).toBe(30);
});

test("Länge in Millisekunden und Name", () => {
  expect(ausschnittMs(30)).toBe(30_000);
  expect(ausschnittMs(15)).toBe(15_000);
  expect(ausschnittMs("ganz")).toBeNull();
  expect(ausschnittName(15)).toBe("15 Sekunden");
  expect(ausschnittName("ganz")).toBe("ganzer Song");
});
