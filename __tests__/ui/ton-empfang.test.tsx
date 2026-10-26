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
import { lautstaerke, lautstaerkeSpeichern } from "@/lib/raum/speicher";
import type { tonEmpfangen } from "@/lib/raum/ton";

// jsdom spielt nichts ab: play() ist nachgebaut, srcObject eine einfache Eigenschaft.
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
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

// Nachbau eines AudioContext: Ohne Klick auf der Seite bleibt er "suspended", wenn blockiert gesetzt ist.
function nachgebauterKontext(blockiert = false) {
  const verstaerker = { gain: { value: 1 }, connect: vi.fn() };
  const quellen: { strom: MediaStream; ziel: unknown; getrennt: boolean }[] =
    [];
  const k = {
    state: "suspended" as AudioContextState,
    blockiert,
    onstatechange: null as (() => void) | null,
    destination: {},
    createGain: () => verstaerker,
    createMediaStreamSource(strom: MediaStream) {
      const quelle = { strom, ziel: null as unknown, getrennt: false };
      quellen.push(quelle);
      return {
        connect: (ziel: unknown) => (quelle.ziel = ziel),
        disconnect: () => (quelle.getrennt = true),
      };
    },
    async resume() {
      if (k.blockiert) return;
      k.state = "running";
      k.onstatechange?.();
    },
    close: vi.fn(async () => {}),
  };
  return { k, verstaerker, quellen };
}

// Zeigt den Empfang. Der Empfang ist nachgebaut: strom() lässt den Ton vom DJ ankommen, ohne Strom endet er.
function zeigen(blockiert = false) {
  const ende = vi.fn();
  const kontext = nachgebauterKontext(blockiert);
  let beiStrom: (strom: MediaStream | null) => void = () => {};
  const empfangen = vi.fn<typeof tonEmpfangen>((_k, _i, rueckruf) => {
    beiStrom = rueckruf;
    return ende;
  });
  const { container, unmount } = render(
    <TonEmpfang
      kanal={nachgebauterRaum().oeffnen("ABCD", "a")}
      empfangen={empfangen}
      kontextNeu={() => kontext.k as unknown as AudioContext}
    />,
  );
  const audio = container.querySelector("audio")!;
  const ankommend = {} as MediaStream;
  async function strom(s: MediaStream | null = ankommend) {
    await act(async () => beiStrom(s));
  }
  return { audio, ende, strom, unmount, ankommend, ...kontext };
}

test("vor dem Teilen: noch nicht geteilt", () => {
  zeigen();
  expect(screen.getByText("Ton vom DJ: noch nicht geteilt")).toBeDefined();
});

test("mit Strom: Ton läuft über die Lautstärke, das audio-Element stumm", async () => {
  lautstaerkeSpeichern(0.6);
  const { audio, strom, ankommend, quellen, verstaerker, k } = zeigen();
  await strom();
  expect(audio.srcObject).toBe(ankommend);
  expect(audio.muted).toBe(true);
  expect(quellen[0].strom).toBe(ankommend);
  expect(quellen[0].ziel).toBe(verstaerker);
  expect(verstaerker.connect).toHaveBeenCalledWith(k.destination);
  expect(verstaerker.gain.value).toBe(0.6);
  expect(screen.getByText("Ton vom DJ läuft")).toBeDefined();
});

test("blockiert der Browser, startet Ton einschalten das Abspielen", async () => {
  const { strom, k } = zeigen(true);
  await strom();
  expect(screen.getByText("Ton vom DJ ist da")).toBeDefined();
  k.blockiert = false;
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Ton einschalten" }));
  });
  expect(screen.getByText("Ton vom DJ läuft")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Ton einschalten" })).toBeNull();
});

// Fund aus dem Review von PR #66: audio.volume wirkt auf dem iPhone nicht, deshalb die Lautstärke über Web Audio.
test("der Regler setzt die Lautstärke über Web Audio und merkt sie sich", async () => {
  const { strom, verstaerker } = zeigen();
  await strom();
  const regler = screen.getByRole<HTMLInputElement>("slider", {
    name: "Lautstärke",
  });
  expect(regler.value).toBe("1");
  fireEvent.change(regler, { target: { value: "0.3" } });
  expect(verstaerker.gain.value).toBe(0.3);
  expect(lautstaerke()).toBe(0.3);
});

test("endet der Strom, steht wieder noch nicht geteilt da", async () => {
  const { audio, strom, quellen } = zeigen();
  await strom();
  await strom(null);
  expect(audio.srcObject).toBeNull();
  expect(quellen[0].getrennt).toBe(true);
  expect(screen.getByText("Ton vom DJ: noch nicht geteilt")).toBeDefined();
});

test("beim Verschwinden endet der Empfang", async () => {
  const { ende, strom, unmount, k } = zeigen();
  await strom();
  unmount();
  expect(ende).toHaveBeenCalled();
  expect(k.close).toHaveBeenCalled();
});
