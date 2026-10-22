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
