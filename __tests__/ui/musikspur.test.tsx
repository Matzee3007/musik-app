import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import Musikspur from "@/app/ui/musikspur";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// requestAnimationFrame zum Selbstaufrufen: Der Test spielt die Bilder ab und sieht, ob noch eins aussteht.
function bilderNachbauen() {
  const offen = new Map<number, FrameRequestCallback>();
  let naechste = 0;
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => {
    offen.set(++naechste, f);
    return naechste;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => offen.delete(id));
  let zeit = performance.now();
  return {
    offen,
    abspielen(anzahl: number) {
      for (let i = 0; i < anzahl && offen.size > 0; i++) {
        zeit += 16;
        const [id, f] = offen.entries().next().value!;
        offen.delete(id);
        f(zeit);
      }
    },
  };
}

test("läuft der Song, bewegt sich die Welle weiter", () => {
  const bilder = bilderNachbauen();
  render(<Musikspur farbe="#fff" laeuft dauerMs={null} />);
  bilder.abspielen(200);
  expect(bilder.offen.size).toBe(1);
});

test("steht der Song, hört die Welle nach dem Absinken auf zu rechnen", () => {
  const bilder = bilderNachbauen();
  const { rerender } = render(<Musikspur farbe="#fff" laeuft dauerMs={null} />);
  bilder.abspielen(5);
  rerender(<Musikspur farbe="#fff" laeuft={false} dauerMs={null} />);
  bilder.abspielen(200);
  expect(bilder.offen.size).toBe(0);
});
