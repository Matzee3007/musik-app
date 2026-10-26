import { expect, test } from "@playwright/test";
import { alleSchliessen, Spieler, Tisch } from "./hilfen/raum";

test.afterEach(alleSchliessen);

// Online-Modus (ADR 0008): Der DJ spielt mit eigener Karte, der Spieler sieht Rad, Kategorie und Auflösung selbst.
test("Online-Raum: DJ und Spieler sehen dieselbe Runde und haken beide ab", async ({
  browser,
}) => {
  const dj = await Tisch.eroeffnen(browser, "Matthias");
  await dj.demoStarten();

  // Den Namen des DJs nimmt niemand sonst, auch nicht kleingeschrieben.
  const fremd = await browser.newContext();
  const versuch = await fremd.newPage();
  await versuch.goto(`/raum/${dj.code}`);
  await versuch.getByLabel("Dein Name").fill("matthias");
  await versuch.getByRole("button", { name: "Beitreten" }).click();
  await expect(versuch.getByText("Name schon vergeben")).toBeVisible();
  await fremd.close();

  const anna = await Spieler.beitreten(browser, dj.code, "Anna");
  await expect(anna.felder()).toHaveCount(25);
  await expect(anna.seite.getByRole("img", { name: "Rad" })).toBeVisible();

  // Die Kategorie erscheint bei Anna erst, wenn ihr Rad steht.
  await dj.seite.getByRole("button", { name: "Rad drehen" }).click();
  await expect(anna.seite.getByText("Das Rad dreht …")).toBeVisible();
  await dj.seite
    .getByRole("button", { name: "Lösung anzeigen" })
    .click({ timeout: 15_000 });
  const kategorie = (await dj.seite.getByRole("status").textContent())!;
  await expect(anna.seite.getByRole("status")).toHaveText(kategorie, {
    timeout: 15_000,
  });

  // Beide sehen dieselbe Lösung.
  const loesung = (await dj.seite
    .getByRole("heading", { level: 2 })
    .textContent())!;
  await expect(anna.seite.getByRole("heading", { level: 2 })).toHaveText(
    loesung,
  );

  expect(await anna.abhaken(kategorie)).toBe(1);
  await dj.zeigt("Anna", 1);
  await dj.seite
    .locator(`button[aria-label="Feld ${kategorie}"]`)
    .first()
    .click();
  await expect(
    dj.seite.locator('button[aria-label^="Feld "][aria-pressed="true"]'),
  ).toHaveCount(1);

  expect(dj.fehler).toEqual([]);
  expect(anna.fehler).toEqual([]);
});
