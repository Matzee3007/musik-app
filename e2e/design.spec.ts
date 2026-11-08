import { expect, test, type Page } from "@playwright/test";
import { alleSchliessen, Spieler, Tisch } from "./hilfen/raum";

// Anforderungen aus dem Design (docs/plaene/2026-10-22-design-spielshow.md und 2026-10-22-design-ueberarbeitung.md),
// die sich messen lassen.
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
  // Das Rad ist der Blickfang: groß, aber ohne seitliches Scrollen. Gemessen am Behälter, denn das Rad selbst ist
  // gedreht und sein Rahmen damit größer als die Scheibe.
  const rad = await seite
    .getByRole("img", { name: "Rad" })
    .locator("..")
    .boundingBox();
  expect(rad!.width).toBeGreaterThanOrEqual(480);
  expect(
    await seite.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1280);
  await loesung.click();
  await seite.getByRole("button", { name: "Nächste Runde" }).waitFor();
  expect(await hoehe(seite)).toBeLessThanOrEqual(800);
});

test("Abschnitt zur Runde bleibt in jedem Zustand gleich groß", async ({
  browser,
}) => {
  const tisch = await Tisch.eroeffnen(browser);
  const seite = tisch.seite;
  await seite.setViewportSize({ width: 1280, height: 800 });
  await Spieler.beitreten(browser, tisch.code, "Anna");
  await tisch.demoStarten();
  const runde = seite.getByRole("region", { name: "Runde" });
  const groesse = async () => {
    const box = (await runde.boundingBox())!;
    return `${Math.round(box.width)}×${Math.round(box.height)}`;
  };
  const groessen = [await groesse()];
  await seite.getByRole("button", { name: "Rad drehen" }).click();
  groessen.push(await groesse());
  const loesung = seite.getByRole("button", { name: "Lösung anzeigen" });
  await loesung.waitFor({ timeout: 15_000 });
  groessen.push(await groesse());
  await loesung.click();
  await seite.getByRole("button", { name: "Nächste Runde" }).waitFor();
  groessen.push(await groesse());
  expect(new Set(groessen).size).toBe(1);
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

for (const [breite, hoch] of [
  [390, 844],
  [360, 780],
]) {
  test(`Handy ${breite}×${hoch} mit und ohne Notizen passt ohne Scrollen`, async ({
    browser,
  }) => {
    const tisch = await Tisch.eroeffnen(browser);
    const anna = await Spieler.beitreten(browser, tisch.code, "Anna");
    await anna.seite.setViewportSize({ width: breite, height: hoch });
    await tisch.demoStarten();
    await expect(anna.felder()).toHaveCount(25);
    await expect(
      anna.seite.getByRole("button", { name: "Notizen aus" }),
    ).toBeVisible();
    expect(await hoehe(anna.seite)).toBeLessThanOrEqual(hoch);
    // Ohne Notizen werden die Felder höher (2 : 3) und müssen trotzdem passen.
    await anna.seite.getByRole("button", { name: "Notizen aus" }).click();
    await expect(
      anna.seite.getByRole("button", { name: "Notizen an" }),
    ).toBeVisible();
    expect(await hoehe(anna.seite)).toBeLessThanOrEqual(hoch);
  });
}

// Startseite und Playlist-Auswahl (docs/plaene/2026-11-08-startseite-buehne.md). Spotify ist nachgebaut, damit die
// Playlists ohne echte Anmeldung erscheinen.
const playlists = [
  "80er Party",
  "Indie Abend mit einem ziemlich langen Namen für die Kachel im Raster",
  "Rock Hymnen",
].map((name, i) => ({
  id: `p${i}`,
  name,
  owner: { id: "dj" },
  items: { total: 30 },
  images: null,
}));

for (const [breite, hoch] of [
  [1440, 900],
  [390, 844],
]) {
  test(`Bühne und Playlist-Raster bei ${breite} px ohne seitliches Scrollen, lange Namen höchstens zweizeilig`, async ({
    browser,
  }) => {
    const kontext = await browser.newContext({
      viewport: { width: breite, height: hoch },
    });
    const seite = await kontext.newPage();
    await seite.route("https://api.spotify.com/v1/me", (r) =>
      r.fulfill({ json: { id: "dj" } }),
    );
    await seite.route("https://api.spotify.com/v1/me/playlists**", (r) =>
      r.fulfill({ json: { items: playlists, next: null } }),
    );
    await seite.addInitScript(() =>
      localStorage.setItem(
        "musik-app:spotify-token",
        JSON.stringify({
          accessToken: "a1",
          refreshToken: "r1",
          ablauf: Date.now() + 3_600_000,
        }),
      ),
    );
    const breiteDerSeite = () =>
      seite.evaluate(() => document.documentElement.scrollWidth);
    await seite.goto("/");
    await seite.getByRole("button", { name: "Online spielen" }).click();
    expect(await breiteDerSeite()).toBeLessThanOrEqual(breite);
    await seite.getByRole("button", { name: "Am Tisch spielen" }).click();
    const lang = seite.getByText(/^Indie Abend/);
    await lang.waitFor();
    expect(await breiteDerSeite()).toBeLessThanOrEqual(breite);
    const zeilen = await lang.evaluate(
      (e) => e.clientHeight / parseFloat(getComputedStyle(e).lineHeight),
    );
    expect(zeilen).toBeLessThanOrEqual(2);
    await kontext.close();
  });
}
