import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import type { Abspieler } from "@/lib/spotify/player";
import { SONGLISTE } from "@/lib/songliste";

// Zufall 0: Das Rad wählt Titel, gespielt wird der erste Song im gemischten Stapel.
const SONGS = SONGLISTE.slice(0, 3);

let abspieler: { [K in keyof Abspieler]: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.useFakeTimers();
  abspieler = {
    aktivieren: vi.fn(async () => {}),
    abspielen: vi.fn(async () => {}),
    pausieren: vi.fn(async () => {}),
    fortsetzen: vi.fn(async () => {}),
    vonVorn: vi.fn(async () => {}),
    trennen: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function klick(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// Klickt den Knopf und meldet, dass das Rad steht (jsdom spielt keine Übergänge ab).
function drehen(knopf: string) {
  klick(knopf);
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
}

function starten() {
  render(
    <SpielAnsicht
      songs={SONGS}
      zufall={() => 0}
      sofort
      abspieler={abspieler as unknown as Abspieler}
    />,
  );
  drehen("Rad drehen");
}

function ersterSong() {
  return vi.mocked(abspieler.abspielen).mock.calls[0][0];
}

test("steht das Rad, läuft der Song und die Musikspur", () => {
  starten();
  expect(abspieler.abspielen).toHaveBeenCalledTimes(1);
  expect(SONGS.map((s) => s.id)).toContain(ersterSong());
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  expect(screen.queryByText("Song läuft")).toBeNull();
});

async function vergehen(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

test("nach 30 Sekunden pausiert der Song, Weiterhören läuft ohne neues Ende", async () => {
  starten();
  await vergehen(29_999);
  expect(abspieler.pausieren).not.toHaveBeenCalled();
  await vergehen(1);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("img", { name: "Musikspur steht" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Nochmal" })).toBeDefined();
  klick("Weiterhören");
  expect(abspieler.fortsetzen).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Weiterhören" })).toBeNull();
  await vergehen(120_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
});

test("Nochmal spielt den Ausschnitt von vorn mit neuem Ende", async () => {
  starten();
  await vergehen(30_000);
  klick("Nochmal");
  expect(abspieler.vonVorn).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  await vergehen(29_999);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  await vergehen(1);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Nochmal" })).toBeDefined();
});

function ausschnittWaehlen(wert: string) {
  fireEvent.change(screen.getByRole("combobox", { name: "Ausschnitt" }), {
    target: { value: wert },
  });
}

function naechsteRunde() {
  klick("Lösung anzeigen");
  drehen("Nächste Runde");
}

test("eine neue Länge gilt erst ab dem nächsten Song", async () => {
  starten();
  expect(
    (screen.getByRole("combobox", { name: "Ausschnitt" }) as HTMLSelectElement)
      .value,
  ).toBe("30");
  ausschnittWaehlen("15");
  await vergehen(15_000);
  expect(abspieler.pausieren).not.toHaveBeenCalled();
  await vergehen(15_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  naechsteRunde();
  expect(abspieler.abspielen).toHaveBeenCalledTimes(2);
  await vergehen(15_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(2);
});

test("die nächste Runde vor Ende des Ausschnitts hält den neuen Song nicht an", async () => {
  starten();
  await vergehen(20_000);
  naechsteRunde();
  await vergehen(15_000);
  expect(abspieler.pausieren).not.toHaveBeenCalled();
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  await vergehen(15_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
});

test("ganzer Song: keine Pause", async () => {
  render(
    <SpielAnsicht
      songs={SONGS}
      zufall={() => 0}
      sofort
      abspieler={abspieler as unknown as Abspieler}
    />,
  );
  ausschnittWaehlen("ganz");
  drehen("Rad drehen");
  await vergehen(600_000);
  expect(abspieler.pausieren).not.toHaveBeenCalled();
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
});

// Mit Zufall 0,999 ist die letzte Zeile der Karte (Felder 20 bis 24) ganz „Jahr ±3“,
// und das Rad wählt immer „Jahr ±3“ (wie in spiel-ansicht.test.tsx).
test("Bingo hält die Musik an", () => {
  render(
    <SpielAnsicht
      songs={SONGLISTE.slice(0, 5)}
      zufall={() => 0.999}
      sofort
      abspieler={abspieler as unknown as Abspieler}
    />,
  );
  for (let runde = 0; runde < 5; runde++) {
    drehen(runde === 0 ? "Rad drehen" : "Nächste Runde");
    klick("Lösung anzeigen");
    fireEvent.click(
      screen.getAllByRole("button", { name: /^Feld / })[20 + runde],
    );
  }
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  expect(abspieler.abspielen).toHaveBeenCalledTimes(5);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
});

test("ohne Abspieler bleibt alles wie in der Demo", () => {
  render(<SpielAnsicht songs={SONGS} zufall={() => 0} sofort />);
  drehen("Rad drehen");
  expect(screen.getByText("Song läuft")).toBeDefined();
  expect(screen.queryByRole("combobox", { name: "Ausschnitt" })).toBeNull();
  expect(screen.queryByRole("img", { name: /Musikspur/ })).toBeNull();
});
