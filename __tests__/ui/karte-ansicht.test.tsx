import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import KarteAnsicht from "@/app/ui/karte-ansicht";
import { KATEGORIEN } from "@/lib/kategorien";
import { feldSetzen, karteAusteilen } from "@/lib/karte";

const karte = karteAusteilen(
  KATEGORIEN.map((k) => k.id),
  () => 0,
);

afterEach(cleanup);

function felder() {
  return screen.getAllByRole("button", { name: /^Feld / });
}

test("graut die genannten Felder aus, der Klick kommt trotzdem an", () => {
  const klick = vi.fn();
  render(
    <KarteAnsicht
      karte={karte}
      onFeldKlick={klick}
      ausgegraut={(i) => i > 0}
    />,
  );
  const grau = felder().filter(
    (f) => f.getAttribute("aria-disabled") === "true",
  );
  expect(grau).toHaveLength(24);
  fireEvent.click(felder()[3]);
  expect(klick).toHaveBeenCalledWith(3);
});

test("hebt die Bingo-Reihe hervor", () => {
  render(
    <KarteAnsicht
      karte={karte}
      onFeldKlick={() => {}}
      hervorgehoben={[0, 1, 2, 3, 4]}
    />,
  );
  const bingo = felder().filter((f) => f.dataset.bingo === "true");
  expect(bingo).toHaveLength(5);
  expect(felder()[0].dataset.bingo).toBe("true");
});

test("ohne Angaben ist kein Feld grau oder hervorgehoben", () => {
  render(<KarteAnsicht karte={karte} onFeldKlick={() => {}} />);
  expect(
    felder().some((f) => f.hasAttribute("aria-disabled") || f.dataset.bingo),
  ).toBe(false);
});

test("ein abgehaktes Feld zeigt ein Kreuz, ein freies keins", () => {
  render(
    <KarteAnsicht karte={feldSetzen(karte, 2, true)} onFeldKlick={() => {}} />,
  );
  expect(felder()[2].querySelector("[data-kreuz]")).not.toBeNull();
  expect(felder()[3].querySelector("[data-kreuz]")).toBeNull();
});

test("ohne Angabe sind die Felder quadratisch, am Handy hochkant", () => {
  const { rerender } = render(
    <KarteAnsicht karte={karte} onFeldKlick={() => {}} />,
  );
  expect(felder()[0].className).toContain("aspect-square");
  rerender(<KarteAnsicht karte={karte} onFeldKlick={() => {}} felder="hoch" />);
  expect(felder()[0].className).toContain("aspect-[3/4]");
  rerender(
    <KarteAnsicht karte={karte} onFeldKlick={() => {}} felder="hoeher" />,
  );
  expect(felder()[0].className).toContain("aspect-[2/3]");
});
