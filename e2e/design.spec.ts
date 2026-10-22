import { expect, test, type Page } from "@playwright/test";
import { alleSchliessen, Spieler } from "./hilfen/raum";

// Anforderungen aus dem Design (docs/plaene/2026-10-22-design-spielshow.md), die sich messen lassen.

test.afterEach(alleSchliessen);

// Höhe des Inhalts: Ist sie größer als das Fenster, muss man scrollen.
function hoehe(seite: Page) {
  return seite.evaluate(() => document.documentElement.scrollHeight);
}

test("Tisch passt im Spiel ohne Scrollen auf den Laptop", async ({
  browser,
}) => {
  const tisch = await (
    await browser.newContext({ viewport: { width: 1280, height: 800 } })
  ).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Raum eröffnen" }).click();
  const code = (await tisch.getByText(/^[A-Z]{4}$/).textContent())!;
  await Spieler.beitreten(browser, code, "Anna");
  await tisch.getByRole("button", { name: "Demo starten" }).click();
  await tisch.getByRole("button", { name: "Spiel starten" }).click();
  await tisch.getByRole("button", { name: "Rad drehen" }).click();
  // Das Rad dreht 4 Sekunden, erst dann erscheint der Knopf.
  const loesung = tisch.getByRole("button", { name: "Lösung anzeigen" });
  await loesung.waitFor({ timeout: 15_000 });
  expect(await hoehe(tisch)).toBeLessThanOrEqual(800);
  await loesung.click();
  await tisch.getByRole("button", { name: "Nächste Runde" }).waitFor();
  expect(await hoehe(tisch)).toBeLessThanOrEqual(800);
  await tisch.context().close();
});

test("bei „Bewegung reduzieren“ läuft kein Lauflicht", async ({ browser }) => {
  const tisch = await (
    await browser.newContext({ reducedMotion: "reduce" })
  ).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Raum eröffnen" }).click();
  await tisch.getByRole("button", { name: "Demo starten" }).click();
  await tisch.getByRole("button", { name: "Spiel starten" }).click();
  await tisch.getByRole("button", { name: "Rad drehen" }).click();
  await expect(tisch.locator('[data-modus="lauf"] .birne').first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await tisch.context().close();
});

test("Felder am Handy zeigen ihr Wort ganz", async ({ browser }) => {
  const tisch = await (await browser.newContext()).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Raum eröffnen" }).click();
  const code = (await tisch.getByText(/^[A-Z]{4}$/).textContent())!;
  const anna = await Spieler.beitreten(browser, code, "Anna");
  await anna.seite.setViewportSize({ width: 360, height: 780 });
  await tisch.getByRole("button", { name: "Demo starten" }).click();
  await tisch.getByRole("button", { name: "Spiel starten" }).click();
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
  await tisch.context().close();
});
