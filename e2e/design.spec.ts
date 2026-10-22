import { expect, test, type Page } from "@playwright/test";
import { alleSchliessen, Spieler, Tisch } from "./hilfen/raum";

// Anforderungen aus dem Design (docs/plaene/2026-10-22-design-spielshow.md), die sich messen lassen.
// Tisch und Spieler kommen von den Bots, damit alleSchliessen ihre Kontexte auch nach einem Fehlschlag schließt.

test.afterEach(alleSchliessen);

// Höhe des Inhalts: Ist sie größer als das Fenster, muss man scrollen.
function hoehe(seite: Page) {
  return seite.evaluate(() => document.documentElement.scrollHeight);
}

test("Tisch passt im Spiel ohne Scrollen auf den Laptop", async ({
  browser,
}) => {
  const tisch = await Tisch.eroeffnen(browser);
  const seite = tisch.seite;
  await seite.setViewportSize({ width: 1280, height: 800 });
  await Spieler.beitreten(browser, tisch.code, "Anna");
  await tisch.demoStarten();
  await seite.getByRole("button", { name: "Rad drehen" }).click();
  // Das Rad dreht 4 Sekunden, erst dann erscheint der Knopf.
  const loesung = seite.getByRole("button", { name: "Lösung anzeigen" });
  await loesung.waitFor({ timeout: 15_000 });
  expect(await hoehe(seite)).toBeLessThanOrEqual(800);
  await loesung.click();
  await seite.getByRole("button", { name: "Nächste Runde" }).waitFor();
  expect(await hoehe(seite)).toBeLessThanOrEqual(800);
});

test("Tisch scrollt am Handy nicht seitlich", async ({ browser }) => {
  const tisch = await Tisch.eroeffnen(browser);
  const seite = tisch.seite;
  await seite.setViewportSize({ width: 360, height: 780 });
  await tisch.demoStarten();
  expect(
    await seite.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);
});

test("Felder am Handy zeigen ihr Wort ganz", async ({ browser }) => {
  const tisch = await Tisch.eroeffnen(browser);
  const anna = await Spieler.beitreten(browser, tisch.code, "Anna");
  await anna.seite.setViewportSize({ width: 360, height: 780 });
  await tisch.demoStarten();
  await expect(anna.felder()).toHaveCount(25);
  // Das Wort muss innerhalb des Polsters bleiben. scrollWidth genügt nicht: Zentrierter Text ragt nach beiden
  // Seiten hinaus, und nur der Teil rechts zählt.
  const zuBreit = await anna.felder().evaluateAll(
    (felder) =>
      felder.filter((feld) => {
        const text = document.createRange();
        // Nur das Wort, das erste Kind des Felds, ohne den Stempel.
        text.selectNodeContents(feld.firstChild!);
        const stil = getComputedStyle(feld);
        const innen =
          feld.clientWidth -
          parseFloat(stil.paddingLeft) -
          parseFloat(stil.paddingRight);
        return text.getBoundingClientRect().width > innen;
      }).length,
  );
  expect(zuBreit).toBe(0);
});
