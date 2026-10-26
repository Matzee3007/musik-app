import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type WebSocketRoute,
} from "@playwright/test";
import { LINIEN } from "@/lib/bingo";

// Bots für Browser-Tests im Demo-Raum: ein Tisch und Spieler, jeder in einem eigenen Browser-Kontext wie auf eigenen
// Geräten. Fehler im Browser (pageerror) sammelt jeder in fehler, damit der Test sie am Ende prüfen kann.

type Feld = { kategorie: string; abgehakt: boolean };

// Alle Kontexte der Bots, damit kein alter Tisch oder Spieler mit Supabase verbunden bleibt.
const kontexte: BrowserContext[] = [];

async function geraet(browser: Browser, fehler: string[]) {
  const kontext = await browser.newContext();
  kontexte.push(kontext);
  const seite = await kontext.newPage();
  seite.on("pageerror", (e) => fehler.push(e.message));
  return seite;
}

// Für test.afterEach: schließt alle Kontexte, auch wenn der Test vorher gescheitert ist.
export async function alleSchliessen() {
  await Promise.all(kontexte.splice(0).map((k) => k.close()));
}

export class Tisch {
  readonly fehler: string[] = [];
  seite!: Page;
  code = "";

  // Ohne dj ein lokaler Raum, mit dj ein Online-Raum, in dem der DJ unter diesem Namen mitspielt.
  static async eroeffnen(browser: Browser, dj?: string): Promise<Tisch> {
    const tisch = new Tisch();
    tisch.seite = await geraet(browser, tisch.fehler);
    await tisch.seite.goto("/");
    if (dj === undefined) {
      await tisch.seite.getByRole("button", { name: "Lokal spielen" }).click();
    } else {
      await tisch.seite.getByRole("button", { name: "Online spielen" }).click();
      await tisch.seite.getByLabel("Dein Name").fill(dj);
      await tisch.seite
        .getByRole("button", { name: "Online-Raum eröffnen" })
        .click();
    }
    const code = await tisch.seite.getByText(/^[A-Z]{4}$/).textContent();
    expect(code).toMatch(/^[A-Z]{4}$/);
    tisch.code = code!;
    return tisch;
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

  // Verbundene Spieler stehen normal in der Leiste, gegangene ausgegraut.
  async zeigtVerbunden(name: string, verbunden: boolean) {
    const eintrag = this.seite.getByRole("listitem").filter({
      hasText: new RegExp(`^${name}( \\d+)?$`),
    });
    if (verbunden) {
      await expect(eintrag).not.toHaveAttribute("aria-disabled", {
        timeout: 30_000,
      });
    } else {
      await expect(eintrag).toHaveAttribute("aria-disabled", "true", {
        timeout: 30_000,
      });
    }
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
  seite!: Page;
  // Offene WebSockets zu Supabase, abgefangen mit routeWebSocket, damit trennen() sie schließen kann.
  // Je Verbindung die Seite zum Browser und die zum Server.
  private sockets = new Set<{
    browser: WebSocketRoute;
    server: WebSocketRoute;
  }>();
  private getrennt = false;
  private constructor(readonly name: string) {}

  static async beitreten(
    browser: Browser,
    code: string,
    name: string,
  ): Promise<Spieler> {
    const spieler = new Spieler(name);
    const seite = await geraet(browser, spieler.fehler);
    spieler.seite = seite;
    // Leitet die Verbindung zu Supabase Realtime durch. Solange getrennt, wird jeder neue Versuch sofort geschlossen.
    await seite.routeWebSocket(/\/realtime\//, (socket) => {
      if (spieler.getrennt) {
        void socket.close();
        return;
      }
      spieler.sockets.add({
        browser: socket,
        server: socket.connectToServer(),
      });
    });
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

  // Wie ein gesperrter Bildschirm: Die Verbindung zu Supabase reißt ab, und kein Neuversuch kommt durch.
  // Funktioniert unter Chromium und WebKit, anders als context.setOffline.
  async trennen() {
    this.getrennt = true;
    for (const { browser, server } of this.sockets) {
      await server.close();
      await browser.close();
    }
    this.sockets.clear();
  }

  // Der nächste Neuversuch von realtime-js kommt wieder durch.
  verbinden() {
    this.getrennt = false;
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
