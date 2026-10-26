import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import TonTeilen from "@/app/ui/ton-teilen";
import type { tonSenden } from "@/lib/raum/ton";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

// jsdom kennt MediaStream nicht: Spuren als EventTarget mit stop(), der Strom liefert sie.
function nachgebauterStrom(mitTon = true) {
  const ton = Object.assign(new EventTarget(), { stop: vi.fn() });
  const bild = Object.assign(new EventTarget(), { stop: vi.fn() });
  const strom = {
    getAudioTracks: () => (mitTon ? [ton] : []),
    getVideoTracks: () => [bild],
  } as unknown as MediaStream;
  return { strom, ton, bild };
}

// Zeigt den Knopf. Das Senden ist nachgebaut: beiAnzahl(n) meldet n verbundene Spieler.
function zeigen(teilen: () => Promise<MediaStream>) {
  const stopp = vi.fn();
  let beiAnzahl: (verbunden: number) => void = () => {};
  const senden = vi.fn<typeof tonSenden>((_k, _i, _s, rueckruf) => {
    beiAnzahl = rueckruf;
    return stopp;
  });
  const { unmount } = render(
    <TonTeilen
      kanal={nachgebauterRaum().oeffnen("ABCD", "t")}
      teilen={teilen}
      senden={senden}
    />,
  );
  return {
    senden,
    stopp,
    anzahl: (n: number) => act(() => beiAnzahl(n)),
    unmount,
  };
}

async function klick(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

test("Ton teilen startet das Senden und zeigt die Zahl der Verbundenen", async () => {
  const { strom, bild } = nachgebauterStrom();
  const { senden, anzahl } = zeigen(async () => strom);
  await klick("Ton teilen");
  expect(senden).toHaveBeenCalledWith(
    expect.anything(),
    expect.any(String),
    strom,
    expect.any(Function),
  );
  expect(bild.stop).toHaveBeenCalled();
  expect(screen.getByText("Ton wird geteilt · 0 verbunden")).toBeDefined();
  anzahl(2);
  expect(screen.getByText("Ton wird geteilt · 2 verbunden")).toBeDefined();
});

test("Teilen beenden stoppt die Tonspur und das Senden", async () => {
  const { strom, ton } = nachgebauterStrom();
  const { stopp } = zeigen(async () => strom);
  await klick("Ton teilen");
  await klick("Teilen beenden");
  expect(stopp).toHaveBeenCalled();
  expect(ton.stop).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Ton teilen" })).toBeDefined();
});

test("endet die Tonspur über Chrome, steht wieder Ton teilen da", async () => {
  const { strom, ton } = nachgebauterStrom();
  const { stopp } = zeigen(async () => strom);
  await klick("Ton teilen");
  act(() => {
    ton.dispatchEvent(new Event("ended"));
  });
  expect(stopp).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Ton teilen" })).toBeDefined();
});

test("ohne Tonspur ein Hinweis auf Tab-Audio", async () => {
  const { strom, bild } = nachgebauterStrom(false);
  const { senden } = zeigen(async () => strom);
  await klick("Ton teilen");
  expect(senden).not.toHaveBeenCalled();
  expect(bild.stop).toHaveBeenCalled();
  expect(
    screen.getByText("Kein Ton dabei. Beim Teilen „Tab-Audio teilen“ anhaken."),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Ton teilen" })).toBeDefined();
});

test("abgebrochener Dialog: wieder Ton teilen, kein Hinweis", async () => {
  zeigen(async () => {
    throw new DOMException("abgebrochen", "NotAllowedError");
  });
  await klick("Ton teilen");
  expect(screen.getByRole("button", { name: "Ton teilen" })).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("scheitert das Teilen aus anderem Grund, ein Hinweis", async () => {
  const { senden } = zeigen(async () => {
    throw new Error("kaputt");
  });
  await klick("Ton teilen");
  expect(senden).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toBe(
    "Teilen hat nicht geklappt.",
  );
  expect(screen.getByRole("button", { name: "Ton teilen" })).toBeDefined();
});

test("beim Verschwinden endet das Teilen", async () => {
  const { strom } = nachgebauterStrom();
  const { stopp, unmount } = zeigen(async () => strom);
  await klick("Ton teilen");
  unmount();
  expect(stopp).toHaveBeenCalled();
});
