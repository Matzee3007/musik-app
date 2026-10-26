import { expect, test } from "@playwright/test";

// Tisch und zwei Handys als getrennte Browser-Kontexte, verbunden über das echte Supabase.
test("Spieler treten bei, laden neu und erfahren, dass der Raum geschlossen ist", async ({
  browser,
}) => {
  const tisch = await (await browser.newContext()).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Lokal spielen" }).click();
  const code = await tisch.getByText(/^[A-Z]{4}$/).textContent();
  expect(code).toMatch(/^[A-Z]{4}$/);

  const handy1 = await (await browser.newContext()).newPage();
  await handy1.goto(`/raum/${code}`);
  await handy1.getByLabel("Dein Name").fill("Anna");
  await handy1.getByRole("button", { name: "Beitreten" }).click();
  await expect(
    handy1.getByText(`Du bist im Raum ${code} als Anna.`),
  ).toBeVisible();
  await expect(tisch.getByText("Anna", { exact: true })).toBeVisible();

  const handy2 = await (await browser.newContext()).newPage();
  await handy2.goto(`/raum/${code}`);
  await handy2.getByLabel("Dein Name").fill("anna");
  await handy2.getByRole("button", { name: "Beitreten" }).click();
  await expect(handy2.getByText("Name schon vergeben")).toBeVisible();

  await handy1.reload();
  await expect(
    handy1.getByText(`Du bist im Raum ${code} als Anna.`),
  ).toBeVisible();
  await expect(handy1.getByLabel("Dein Name")).toHaveCount(0);

  tisch.once("dialog", (dialog) => dialog.accept());
  await tisch.getByRole("button", { name: "Raum schließen" }).click();
  await expect(handy1.getByText("Raum geschlossen")).toBeVisible();
});
