import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import TonEmpfang from "@/app/ui/ton-empfang";
import { lautstaerke } from "@/lib/raum/speicher";
import type { tonEmpfangen } from "@/lib/raum/ton";

// jsdom spielt nichts ab: play() ist nachgebaut, srcObject eine einfache Eigenschaft.
const play = vi.fn<() => Promise<void>>();
beforeEach(() => {
  play.mockReset().mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    writable: true,
    value: null,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Zeigt den Empfang. Der Empfang ist nachgebaut: strom() lässt den Ton vom DJ ankommen.
function zeigen() {
  const ende = vi.fn();
  let beiStrom: (strom: MediaStream) => void = () => {};
  const empfangen = vi.fn<typeof tonEmpfangen>((_k, _i, rueckruf) => {
    beiStrom = rueckruf;
    return ende;
  });
  const { container, unmount } = render(
    <TonEmpfang
      kanal={nachgebauterRaum().oeffnen("ABCD", "a")}
      empfangen={empfangen}
    />,
  );
  const audio = container.querySelector("audio")!;
  async function strom() {
    await act(async () => beiStrom({} as MediaStream));
  }
  return { audio, ende, strom, unmount };
}

test("vor dem Teilen: noch nicht geteilt", () => {
  zeigen();
  expect(screen.getByText("Ton vom DJ: noch nicht geteilt")).toBeDefined();
});

test("mit Strom: Ton vom DJ läuft", async () => {
  const { audio, strom } = zeigen();
  await strom();
  expect(audio.srcObject).not.toBeNull();
  expect(play).toHaveBeenCalled();
  expect(screen.getByText("Ton vom DJ läuft")).toBeDefined();
});

test("blockiert der Browser, startet Ton einschalten das Abspielen", async () => {
  play.mockRejectedValueOnce(new DOMException("", "NotAllowedError"));
  const { strom } = zeigen();
  await strom();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Ton einschalten" }));
  });
  expect(play).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Ton vom DJ läuft")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Ton einschalten" })).toBeNull();
});

test("der Regler setzt die Lautstärke und merkt sie sich", () => {
  const { audio } = zeigen();
  const regler = screen.getByRole<HTMLInputElement>("slider", {
    name: "Lautstärke",
  });
  expect(regler.value).toBe("1");
  fireEvent.change(regler, { target: { value: "0.3" } });
  expect(audio.volume).toBe(0.3);
  expect(lautstaerke()).toBe(0.3);
});

test("beim Verschwinden endet der Empfang", () => {
  const { ende, unmount } = zeigen();
  unmount();
  expect(ende).toHaveBeenCalled();
});
