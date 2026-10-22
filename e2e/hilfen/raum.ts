import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

// Bots für Browser-Tests im Demo-Raum: ein Tisch und Spieler, jeder in einem eigenen Browser-Kontext wie auf eigenen
// Geräten. Fehler im Browser (pageerror) sammelt jeder in fehler, damit der Test sie am Ende prüfen kann.

// Die 12 Linien einer 5×5-Karte wie in lib/bingo.ts.
const NULL_BIS_VIER = [0, 1, 2, 3, 4];
const LINIEN: number[][] = [
  ...NULL_BIS_VIER.map((zeile) => NULL_BIS_VIER.map((s) => zeile * 5 + s)),
  ...NULL_BIS_VIER.map((spalte) => NULL_BIS_VIER.map((z) => z * 5 + spalte)),
  NULL_BIS_VIER.map((i) => i * 6),
  NULL_BIS_VIER.map((i) => (i + 1) * 4),
];

type Feld = { kategorie: string; abgehakt: boolean };

export class Tisch {
  readonly fehler: string[] = [];
  readonly code: string;
  private constructor(
    readonly seite: Page,
    code: string | null,
  ) {
    expect(code).toMatch(/^[A-Z]{4}$/);
    this.code = code!;
    seite.on("pageerror", (e) => this.fehler.push(e.message));
  }

  static async eroeffnen(browser: Browser): Promise<Tisch> {
    const seite = await (await browser.newContext()).newPage();
    await seite.goto("/");
    await seite.getByRole("button", { name: "Raum eröffnen" }).click();
    return new Tisch(seite, await seite.getByText(/^[A-Z]{4}$/).textContent());
  }

  async demoStarten() {
    await this.seite.getByRole("button", { name: "Demo starten" }).click();
    await this.seite.getByRole("button", { name: "Spiel starten" }).click();
  }

  // Dreht das Rad, wartet auf den Stillstand und zeigt die Lösung. Liefert den Namen der Kategorie.
  async drehen(): Promise<string> {
    const vonVorn = this.seite.getByRole("button", { name: "Von vorn" });
    if (await vonVorn.isVisible()) await vonVorn.click();
    await this.seite
      .getByRole("button", { name: /^(Rad drehen|Nächste Runde)$/ })
      .click();
    // Das Rad dreht 4 Sekunden, erst dann erscheint der Knopf.
    await this.seite
      .getByRole("button", { name: "Lösung anzeigen" })
      .click({ timeout: 15_000 });
    return (await this.seite.getByRole("status").textContent())!;
  }

  // Die Leiste zeigt "Anna 3" für verbundene Spieler mit Stand im laufenden Spiel.
  async zeigt(name: string, abgehakt: number) {
    await expect(
      this.seite.getByText(`${name} ${abgehakt}`, { exact: true }),
    ).toBeVisible();
  }

  bingo() {
    return this.seite.getByRole("heading", { name: /^Bingo!/ });
  }
}

export class Spieler {
  readonly fehler: string[] = [];
  private constructor(
    readonly name: string,
    readonly kontext: BrowserContext,
    readonly seite: Page,
  ) {
    seite.on("pageerror", (e) => this.fehler.push(e.message));
  }

  static async beitreten(
    browser: Browser,
    code: string,
    name: string,
  ): Promise<Spieler> {
    const kontext = await browser.newContext();
    const seite = await kontext.newPage();
    const spieler = new Spieler(name, kontext, seite);
    await seite.goto(`/raum/${code}`);
    await seite.getByLabel("Dein Name").fill(name);
    await seite.getByRole("button", { name: "Beitreten" }).click();
    await expect(
      seite.getByText(`Du bist im Raum ${code} als ${name}.`),
    ).toBeVisible();
    return spieler;
  }

  felder() {
    return this.seite.getByRole("button", { name: /^Feld / });
  }

  // Frei sind Felder, die weder grau noch abgehakt sind.
  freieFelder() {
    return this.seite.locator(
      'button[aria-label^="Feld "]:not([aria-disabled="true"]):not([aria-pressed="true"])',
    );
  }

  abgehakteFelder() {
    return this.seite.locator(
      'button[aria-label^="Feld "][aria-pressed="true"]',
    );
  }

  async karte(): Promise<Feld[]> {
    await expect(this.felder()).toHaveCount(25);
    return this.felder().evaluateAll((knoepfe) =>
      knoepfe.map((k) => ({
        kategorie: k.getAttribute("aria-label")!.replace(/^Feld /, ""),
        abgehakt: k.getAttribute("aria-pressed") === "true",
      })),
    );
  }

  async hatBingo(): Promise<boolean> {
    const karte = await this.karte();
    return LINIEN.some((linie) => linie.every((i) => karte[i].abgehakt));
  }

  // Hakt nach der Auflösung das Feld der Kategorie ab, das ihn seinem Bingo am nächsten bringt (als läge er richtig).
  // Liefert die Zahl abgehakter Felder danach, oder null, wenn kein Feld der Kategorie mehr frei ist.
  async abhaken(kategorie: string): Promise<number | null> {
    const karte = await this.karte();
    const kandidaten = karte.flatMap((f, i) =>
      f.kategorie === kategorie && !f.abgehakt ? [i] : [],
    );
    const vorher = karte.filter((f) => f.abgehakt).length;
    if (kandidaten.length === 0) return null;
    const naehe = (i: number) =>
      Math.max(
        ...LINIEN.filter((l) => l.includes(i)).map(
          (l) => l.filter((j) => karte[j].abgehakt).length,
        ),
      );
    const bestes = kandidaten.reduce((a, b) => (naehe(b) > naehe(a) ? b : a));
    const feld = this.felder().nth(bestes);
    // Erst wenn die Auflösung angekommen ist, ist das Feld frei.
    await expect(feld).not.toHaveAttribute("aria-disabled", "true");
    await feld.click();
    await expect(this.abgehakteFelder()).toHaveCount(vorher + 1);
    await expect(this.freieFelder()).toHaveCount(0);
    return vorher + 1;
  }
}
