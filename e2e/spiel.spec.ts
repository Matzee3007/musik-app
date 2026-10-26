import { expect, test, type Page } from "@playwright/test";

function felder(seite: Page) {
  return seite.getByRole("button", { name: /^Feld / });
}

// Frei sind Felder, die weder grau noch abgehakt sind.
function freieFelder(seite: Page) {
  return seite.locator(
    'button[aria-label^="Feld "]:not([aria-disabled="true"]):not([aria-pressed="true"])',
  );
}

function abgehakteFelder(seite: Page) {
  return seite.locator('button[aria-label^="Feld "][aria-pressed="true"]');
}

async function beitreten(seite: Page, code: string, name: string) {
  await seite.goto(`/raum/${code}`);
  await seite.getByLabel("Dein Name").fill(name);
  await seite.getByRole("button", { name: "Beitreten" }).click();
}

// Tisch und zwei Handys als getrennte Browser-Kontexte, verbunden über das echte Supabase. Bingo hängt vom
// Zufall ab und wird in Vitest und mit echten Handys geprüft.
test("eine Runde im Demo-Raum: abhaken, neu laden, mitten im Spiel beitreten", async ({
  browser,
}) => {
  const tisch = await (await browser.newContext()).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Lokal spielen" }).click();
  const code = await tisch.getByText(/^[A-Z]{4}$/).textContent();
  expect(code).toMatch(/^[A-Z]{4}$/);

  const anna = await (await browser.newContext()).newPage();
  await beitreten(anna, code!, "Anna");
  await expect(anna.getByText("Warte auf das Spiel …")).toBeVisible();

  await tisch.getByRole("button", { name: "Demo starten" }).click();
  await tisch.getByRole("button", { name: "Spiel starten" }).click();
  await expect(felder(anna)).toHaveCount(25);
  await expect(anna.locator('[aria-disabled="true"]')).toHaveCount(25);

  await tisch.getByRole("button", { name: "Rad drehen" }).click();
  // Das Rad dreht einige Sekunden, erst dann erscheint der Knopf.
  await tisch
    .getByRole("button", { name: "Lösung anzeigen" })
    .click({ timeout: 15_000 });
  await expect(freieFelder(anna)).toHaveCount(5);
  await freieFelder(anna).first().click();
  await expect(tisch.getByText("Anna 1", { exact: true })).toBeVisible();

  await anna.reload();
  await expect(abgehakteFelder(anna)).toHaveCount(1);
  await expect(freieFelder(anna)).toHaveCount(0);

  const ben = await (await browser.newContext()).newPage();
  await beitreten(ben, code!, "Ben");
  await expect(felder(ben)).toHaveCount(25);
  await expect(tisch.getByText("Ben 0", { exact: true })).toBeVisible();
});
