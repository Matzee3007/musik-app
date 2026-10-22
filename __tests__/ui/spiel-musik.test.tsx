import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import { PlayerFehler, type Abspieler } from "@/lib/spotify/player";
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
  // Einmal angehalten hat die Lösung, der alte Zeitgeber darf nicht noch einmal.
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  await vergehen(15_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  await vergehen(15_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(2);
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
function bisZumBingo() {
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
    // In der letzten Auflösung läuft die Musik weiter, das Bingo soll sie anhalten.
    if (runde === 4) klick("Weiterhören");
    fireEvent.click(
      screen.getAllByRole("button", { name: /^Feld / })[20 + runde],
    );
  }
}

test("Bingo hält die Musik an", () => {
  bisZumBingo();
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  expect(abspieler.abspielen).toHaveBeenCalledTimes(5);
  // 5-mal beim Aufdecken, einmal beim Bingo.
  expect(abspieler.pausieren).toHaveBeenCalledTimes(6);
});

test("ohne Abspieler bleibt alles wie in der Demo", () => {
  render(<SpielAnsicht songs={SONGS} zufall={() => 0} sofort />);
  drehen("Rad drehen");
  expect(screen.getByText("Song läuft")).toBeDefined();
  expect(screen.queryByRole("combobox", { name: "Ausschnitt" })).toBeNull();
  expect(screen.queryByRole("img", { name: /Musikspur/ })).toBeNull();
});

test("Lösung anzeigen stoppt den Song, Weiterhören in der Auflösung spielt ohne Ende weiter", async () => {
  starten();
  await vergehen(10_000);
  klick("Lösung anzeigen");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  klick("Weiterhören");
  expect(abspieler.fortsetzen).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("button", { name: "Weiterhören" })).toBeNull();
  await vergehen(120_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
});

test("ist der Ausschnitt schon vorbei, pausiert die Lösung nicht doppelt", async () => {
  starten();
  await vergehen(30_000);
  klick("Lösung anzeigen");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Weiterhören" })).toBeDefined();
});

test("in der Demo gibt es in der Auflösung kein Weiterhören", () => {
  render(<SpielAnsicht songs={SONGS} zufall={() => 0} sofort />);
  drehen("Rad drehen");
  klick("Lösung anzeigen");
  expect(screen.queryByRole("button", { name: "Weiterhören" })).toBeNull();
});

test("Nächste Runde stoppt einen weiterlaufenden Song sofort, nicht erst wenn das Rad steht", () => {
  starten();
  klick("Lösung anzeigen");
  klick("Weiterhören");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  klick("Nächste Runde");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(2);
  expect(abspieler.abspielen).toHaveBeenCalledTimes(1);
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
  expect(abspieler.abspielen).toHaveBeenCalledTimes(2);
});

test("ist Spotify nicht erreichbar, steht die Musik mit Meldung und Nochmal startet den Song neu", async () => {
  abspieler.abspielen.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  starten();
  await vergehen(0);
  expect(screen.getByRole("alert").textContent).toBe("Spotify reagiert nicht.");
  expect(screen.getByRole("img", { name: "Musikspur steht" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Weiterhören" })).toBeNull();
  klick("Nochmal");
  await vergehen(0);
  expect(abspieler.abspielen).toHaveBeenCalledTimes(2);
  expect(abspieler.vonVorn).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
});

test("scheitert das Pausieren am Ende des Ausschnitts, bleiben Nochmal und Weiterhören", async () => {
  abspieler.pausieren.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  starten();
  await vergehen(30_000);
  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByRole("button", { name: "Weiterhören" })).toBeDefined();
  klick("Nochmal");
  expect(abspieler.vonVorn).toHaveBeenCalledTimes(1);
  expect(abspieler.abspielen).toHaveBeenCalledTimes(1);
});

test("scheitert das Pausieren beim Aufdecken, steht die Meldung in der Auflösung", async () => {
  abspieler.pausieren.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  starten();
  klick("Lösung anzeigen");
  await vergehen(0);
  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByRole("button", { name: "Weiterhören" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Nächste Runde" })).toBeDefined();
});

test("scheitert das Pausieren beim Bingo, steht die Meldung beim Bingo", async () => {
  // Die ersten 5 Pausen beim Aufdecken klappen, die beim Bingo scheitert.
  abspieler.pausieren
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new TypeError("Failed to fetch"));
  bisZumBingo();
  await vergehen(0);
  expect(screen.getByRole("heading", { name: "Bingo!" })).toBeDefined();
  expect(screen.getByRole("alert")).toBeDefined();
});

test("ein später Fehler eines älteren Befehls trifft den neuen Song nicht", async () => {
  let pauseScheitert: (fehler: Error) => void = () => {};
  abspieler.pausieren.mockReturnValueOnce(
    new Promise((_, abgelehnt) => (pauseScheitert = abgelehnt)),
  );
  starten();
  naechsteRunde();
  await act(async () => pauseScheitert(new TypeError("Failed to fetch")));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("img", { name: "Musikspur läuft" })).toBeDefined();
  await vergehen(30_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(2);
});

test("ist die Anmeldung abgelaufen, sagt die Meldung das", async () => {
  abspieler.abspielen.mockRejectedValueOnce(
    new PlayerFehler("Spotify-Anmeldung abgelaufen."),
  );
  starten();
  await vergehen(0);
  expect(screen.getByRole("alert").textContent).toBe(
    "Spotify-Anmeldung abgelaufen.",
  );
});

test("scheitert Weiterhören in der Auflösung, bleibt der Knopf und spielt den Song neu ab", async () => {
  abspieler.fortsetzen.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  starten();
  klick("Lösung anzeigen");
  klick("Weiterhören");
  await vergehen(0);
  expect(screen.getByRole("alert")).toBeDefined();
  klick("Weiterhören");
  expect(abspieler.abspielen).toHaveBeenCalledTimes(2);
  expect(abspieler.fortsetzen).toHaveBeenCalledTimes(1);
});

test("beim Drehen verschwindet die Meldung, ein später Fehler der alten Runde erscheint nicht", async () => {
  let startScheitert: (fehler: Error) => void = () => {};
  abspieler.abspielen.mockReturnValueOnce(
    new Promise((_, abgelehnt) => (startScheitert = abgelehnt)),
  );
  abspieler.pausieren.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  starten();
  klick("Lösung anzeigen");
  await vergehen(0);
  expect(screen.getByRole("alert")).toBeDefined();
  // Das Rad dreht noch, der neue Song ist noch nicht angefragt.
  klick("Nächste Runde");
  expect(screen.queryByRole("alert")).toBeNull();
  await act(async () => startScheitert(new TypeError("Failed to fetch")));
  expect(screen.queryByRole("alert")).toBeNull();
});

test("Anhalten pausiert den Song, Weiterhören setzt ihn fort", async () => {
  starten();
  klick("Anhalten");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("img", { name: "Musikspur steht" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Anhalten" })).toBeNull();
  klick("Weiterhören");
  expect(abspieler.fortsetzen).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Anhalten" })).toBeDefined();
  // Das Ende des Ausschnitts ist mit dem Anhalten weg, es pausiert nicht noch einmal.
  await vergehen(60_000);
  expect(abspieler.pausieren).toHaveBeenCalledTimes(1);
});

test("nach der Auflösung lässt sich der weiterlaufende Song anhalten", () => {
  starten();
  klick("Lösung anzeigen");
  expect(screen.queryByRole("button", { name: "Anhalten" })).toBeNull();
  klick("Weiterhören");
  klick("Anhalten");
  expect(abspieler.pausieren).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Weiterhören" })).toBeDefined();
});
