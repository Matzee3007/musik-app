import { expect, test } from "@playwright/test";

// Ein Handy verliert das Netz (wie bei gesperrtem Bildschirm) und kommt zurück, ohne neu zu laden.
test("ein Handy, das zurückkommt, wird am Tisch wieder normal", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const tisch = await (await browser.newContext()).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Raum eröffnen" }).click();
  const code = await tisch.getByText(/^[A-Z]{4}$/).textContent();

  const handyKontext = await browser.newContext();
  const handy = await handyKontext.newPage();
  await handy.goto(`/raum/${code}`);
  await handy.getByLabel("Dein Name").fill("Anna");
  await handy.getByRole("button", { name: "Beitreten" }).click();
  const anna = tisch.getByText("Anna", { exact: true });
  await expect(anna).not.toHaveAttribute("aria-disabled");

  await handyKontext.setOffline(true);
  await expect(anna).toHaveAttribute("aria-disabled", "true", {
    timeout: 90_000,
  });

  await handyKontext.setOffline(false);
  await expect(anna).not.toHaveAttribute("aria-disabled", { timeout: 60_000 });
});
