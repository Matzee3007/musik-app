import { expect, test, type Page } from "@playwright/test";

// Frei sind Felder, die weder grau noch abgehakt sind.
function freieFelder(seite: Page) {
  return seite.locator(
    'button[aria-label^="Feld "]:not([aria-disabled="true"]):not([aria-pressed="true"])',
  );
}

async function runde(tisch: Page, knopf: string) {
  await tisch.getByRole("button", { name: knopf }).click();
  // Das Rad dreht einige Sekunden, erst dann erscheint der Knopf.
  await tisch
    .getByRole("button", { name: "Lösung anzeigen" })
    .click({ timeout: 15_000 });
}

// Regressionstest: Der Tisch meldete jeden Schritt per Presence und überschritt das Limit von Supabase
// (5 Presence-Änderungen je Gerät in 30 Sekunden). Der Server schloss seinen Kanal, die Handys sahen keinen Tisch mehr.
test("nach dem Abhaken in Runde 1 ist in Runde 2 wieder ein Feld frei", async ({
  browser,
}) => {
  const tisch = await (await browser.newContext()).newPage();
  await tisch.goto("/");
  await tisch.getByRole("button", { name: "Raum eröffnen" }).click();
  const code = await tisch.getByText(/^[A-Z]{4}$/).textContent();

  const anna = await (await browser.newContext()).newPage();
  await anna.goto(`/raum/${code}`);
  await anna.getByLabel("Dein Name").fill("Anna");
  await anna.getByRole("button", { name: "Beitreten" }).click();

  await tisch.getByRole("button", { name: "Demo starten" }).click();
  await tisch.getByRole("button", { name: "Spiel starten" }).click();

  await runde(tisch, "Rad drehen");
  await expect(freieFelder(anna).first()).toBeVisible();
  await freieFelder(anna).first().click();
  await expect(tisch.getByText("Anna 1", { exact: true })).toBeVisible();

  await runde(tisch, "Nächste Runde");
  await expect(tisch.getByText("Runde 2")).toBeVisible();
  await expect(freieFelder(anna).first()).toBeVisible();
});
