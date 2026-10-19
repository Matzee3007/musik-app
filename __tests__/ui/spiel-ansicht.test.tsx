import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import type { Song } from "@/lib/song";
import { SONGLISTE } from "@/lib/songliste";
import type { Zufall } from "@/lib/zufall";

const FUENF_SONGS = SONGLISTE.slice(0, 5);
const bohemian = SONGLISTE.find((s) => s.id === "queen-bohemian-rhapsody")!;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function starten(songs: readonly Song[], zufall: Zufall = () => 0) {
  render(<SpielAnsicht songs={songs} zufall={zufall} />);
  klick("Spiel starten");
}

function klick(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// Klickt den Knopf und meldet, dass das Rad steht (jsdom spielt keine Übergänge ab).
function drehen(knopf: string) {
  klick(knopf);
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
}

// Die Karten-Felder zeigen den Kategorie-Namen auch, deshalb nur im Tisch suchen.
function tisch() {
  return within(screen.getByRole("region", { name: "Tisch" }));
}

test("nach „Spiel starten“ gibt es eine Karte mit 25 freien Feldern und „Rad drehen“", () => {
  starten(FUENF_SONGS);
  const felder = screen.getAllByRole("button", { name: /^Feld / });
  expect(felder).toHaveLength(25);
  expect(felder.every((f) => f.getAttribute("aria-pressed") === "false")).toBe(
    true,
  );
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});

test("Rad drehen zeigt Runde und Kategorie, verrät den Song aber nicht", () => {
  starten([bohemian], () => 0);
  drehen("Rad drehen");
  expect(tisch().getByText("Runde 1")).toBeDefined();
  expect(tisch().getByRole("status").textContent).toBe("Titel");
  expect(tisch().getByText("Song läuft")).toBeDefined();
  expect(screen.queryByText(/Bohemian Rhapsody|Queen|1975/)).toBeNull();
});

test("Kategorie und „Lösung anzeigen“ erscheinen erst, wenn das Rad steht", () => {
  starten([bohemian], () => 0);
  klick("Rad drehen");
  expect(tisch().queryByText("Song läuft")).toBeNull();
  expect(screen.queryByRole("button", { name: "Lösung anzeigen" })).toBeNull();
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
  expect(tisch().getByText("Song läuft")).toBeDefined();
  expect(screen.getByRole("button", { name: "Lösung anzeigen" })).toBeDefined();
});

test("Lösung anzeigen zeigt die Lösung groß und alle Angaben zum Song", () => {
  starten([bohemian], () => 0);
  drehen("Rad drehen");
  klick("Lösung anzeigen");
  expect(
    screen.getByRole("heading", { level: 2, name: "Bohemian Rhapsody" }),
  ).toBeDefined();
  for (const text of ["Queen", "1975", "1970er"]) {
    expect(tisch().getByText(text)).toBeDefined();
  }
  expect(tisch().getByText("Richtig? Hake ein Feld Titel ab.")).toBeDefined();
});

test("nach der Auflösung startet „Nächste Runde“ Runde 2", () => {
  starten(FUENF_SONGS, () => 0);
  drehen("Rad drehen");
  klick("Lösung anzeigen");
  drehen("Nächste Runde");
  expect(tisch().getByText("Runde 2")).toBeDefined();
});

function aufgeloest() {
  starten(FUENF_SONGS, () => 0);
  drehen("Rad drehen");
  klick("Lösung anzeigen");
}

test("ein Titel-Feld lässt sich nach der Auflösung abhaken", () => {
  aufgeloest();
  const feld = screen.getAllByRole("button", { name: "Feld Titel" })[0];
  fireEvent.click(feld);
  expect(feld.getAttribute("aria-pressed")).toBe("true");
});

test("Zurücknehmen nur nach Bestätigung", () => {
  aufgeloest();
  const feld = screen.getAllByRole("button", { name: "Feld Titel" })[0];
  fireEvent.click(feld);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(feld);
  expect(feld.getAttribute("aria-pressed")).toBe("true");
  confirm.mockReturnValue(true);
  fireEvent.click(feld);
  expect(feld.getAttribute("aria-pressed")).toBe("false");
  expect(confirm).toHaveBeenCalledWith("Abhaken zurücknehmen?");
});

test("ist der Stapel leer, mischt „Von vorn“ neu und die Karte bleibt", () => {
  starten([bohemian], () => 0);
  drehen("Rad drehen");
  klick("Lösung anzeigen");
  fireEvent.click(screen.getAllByRole("button", { name: "Feld Titel" })[0]);
  expect(tisch().getByText("Alle Songs gespielt")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Nächste Runde" })).toBeNull();
  klick("Von vorn");
  drehen("Nächste Runde");
  expect(tisch().getByText("Runde 2")).toBeDefined();
  expect(
    screen.getAllByRole("button", { name: "Feld Titel", pressed: true }),
  ).toHaveLength(1);
});

// Mit Zufall 0.999 tauscht das Mischen nichts: Die letzte Zeile der Karte
// (Felder 20 bis 24) ist ganz „Jahr ±3“, und das Rad wählt immer „Jahr ±3“.
test("fünf in einer Reihe zeigen Bingo, danach nur noch „Neues Spiel“", () => {
  starten(FUENF_SONGS, () => 0.999);
  for (let runde = 0; runde < 5; runde++) {
    drehen(runde === 0 ? "Rad drehen" : "Nächste Runde");
    klick("Lösung anzeigen");
    fireEvent.click(
      screen.getAllByRole("button", { name: /^Feld / })[20 + runde],
    );
  }
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Nächste Runde" })).toBeNull();
  klick("Neues Spiel");
  expect(
    screen.queryAllByRole("button", { name: /^Feld /, pressed: true }),
  ).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});

test("mit sofort startet das Spiel ohne eigenen Knopf „Spiel starten“", () => {
  render(<SpielAnsicht songs={FUENF_SONGS} zufall={() => 0} sofort />);
  expect(screen.queryByRole("button", { name: "Spiel starten" })).toBeNull();
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
  expect(screen.getAllByRole("button", { name: /^Feld / })).toHaveLength(25);
});
