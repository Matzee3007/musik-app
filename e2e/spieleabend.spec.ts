import { expect, test } from "@playwright/test";
import { alleSchliessen, Spieler, Tisch } from "./hilfen/raum";

test.afterEach(alleSchliessen);

// Ein ganzer Spieleabend im Demo-Raum mit Bots: Runde um Runde bis zum Bingo, unterwegs Notizen, Zurücknehmen,
// Neuladen, Beitritt mitten im Spiel und ein Handy ohne Netz. Am Ende neues Spiel und Raum schließen.
test("Spieleabend: drei Spieler spielen bis zum Bingo", async ({ browser }) => {
  test.setTimeout(600_000);
  const tisch = await Tisch.eroeffnen(browser);
  const anna = await Spieler.beitreten(browser, tisch.code, "Anna");
  const ben = await Spieler.beitreten(browser, tisch.code, "Ben");
  const spieler = [anna, ben];
  const zahlen = new Map<Spieler, number>();

  // Jeder hakt ab (als läge er richtig), danach zeigt die Leiste am Tisch alle Zahlen.
  async function alleHakenAb(kategorie: string) {
    for (const s of spieler) {
      const zahl = await s.abhaken(kategorie);
      if (zahl !== null) zahlen.set(s, zahl);
    }
    for (const s of spieler) await tisch.zeigt(s.name, zahlen.get(s) ?? 0);
  }

  await test.step("Spiel starten", async () => {
    await expect(anna.seite.getByText("Warte auf das Spiel …")).toBeVisible();
    await tisch.demoStarten();
    for (const s of spieler) {
      await expect(s.felder()).toHaveCount(25);
      await tisch.zeigt(s.name, 0);
    }
  });

  await test.step("Runde 1: Notizen, abhaken, zurücknehmen", async () => {
    const kategorie = await tisch.drehen();
    await anna.seite.getByLabel("Notizen").fill("Queen?");
    await anna.abhaken(kategorie);
    await tisch.zeigt("Anna", 1);
    anna.seite.once("dialog", (dialog) => dialog.accept());
    await anna.abgehakteFelder().first().click();
    await expect(anna.abgehakteFelder()).toHaveCount(0);
    await tisch.zeigt("Anna", 0);
    await alleHakenAb(kategorie);
  });

  await test.step("Runde 2: Notizfläche leer, Anna lädt neu", async () => {
    const kategorie = await tisch.drehen();
    await expect(anna.seite.getByLabel("Notizen")).toHaveValue("");
    await anna.seite.reload();
    await expect(anna.abgehakteFelder()).toHaveCount(zahlen.get(anna)!);
    await alleHakenAb(kategorie);
  });

  await test.step("Runde 3: Cem tritt mitten im Spiel bei", async () => {
    const kategorie = await tisch.drehen();
    const cem = await Spieler.beitreten(browser, tisch.code, "Cem");
    await expect(cem.felder()).toHaveCount(25);
    await tisch.zeigt("Cem", 0);
    spieler.push(cem);
    await alleHakenAb(kategorie);
  });

  await test.step("Runde 4: Ben verliert die Verbindung und holt die Runde nach", async () => {
    await ben.trennen();
    await tisch.zeigtVerbunden("Ben", false);
    const kategorie = await tisch.drehen();
    ben.verbinden();
    await expect(ben.freieFelder().first()).toBeVisible({ timeout: 30_000 });
    await tisch.zeigtVerbunden("Ben", true);
    await alleHakenAb(kategorie);
  });

  const gewinner: Spieler[] = [];
  await test.step("weiter bis zum Bingo", async () => {
    for (let runde = 5; runde <= 40 && gewinner.length === 0; runde++) {
      await alleHakenAb(await tisch.drehen());
      for (const s of spieler) if (await s.hatBingo()) gewinner.push(s);
      if (gewinner.length > 0) {
        test.info().annotations.push({
          type: "Bingo",
          description: `Runde ${runde}: ${gewinner.map((s) => s.name).join(", ")}`,
        });
      }
    }
    expect(gewinner.length).toBeGreaterThan(0);
  });

  await test.step("Bingo am Tisch und auf allen Handys", async () => {
    for (const s of gewinner) {
      await expect(tisch.bingo()).toContainText(s.name);
      await expect(
        s.seite.getByRole("heading", { name: "Bingo!", exact: true }),
      ).toBeVisible();
      await expect(s.seite.locator("[data-bingo]")).toHaveCount(5);
    }
    for (const s of spieler.filter((s) => !gewinner.includes(s))) {
      await expect(
        s.seite.getByRole("heading", { name: /^Bingo! / }),
      ).toContainText(gewinner[0].name);
    }
    await expect(
      tisch.seite.getByRole("button", { name: "Nächste Runde" }),
    ).toHaveCount(0);
  });

  await test.step("Neues Spiel teilt neue Karten aus", async () => {
    await tisch.seite.getByRole("button", { name: "Neues Spiel" }).click();
    await expect(tisch.bingo()).toHaveCount(0);
    for (const s of spieler) {
      await expect(s.abgehakteFelder()).toHaveCount(0);
      await tisch.zeigt(s.name, 0);
    }
  });

  await test.step("Raum schließen", async () => {
    await expect(
      tisch.seite.getByText("Keine Verbindung zum Raum."),
    ).toHaveCount(0);
    tisch.seite.once("dialog", (dialog) => dialog.accept());
    await tisch.seite.getByRole("button", { name: "Raum schließen" }).click();
    for (const s of spieler) {
      await expect(s.seite.getByText("Raum geschlossen")).toBeVisible();
    }
  });

  expect(tisch.fehler).toEqual([]);
  for (const s of spieler) expect(s.fehler, s.name).toEqual([]);
});
