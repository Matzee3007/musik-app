import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Tisch from "@/app/ui/tisch";
import { rundeAusStand, type TischStand } from "@/lib/raum/stand";
import type { Runde } from "@/lib/spiel";

afterEach(cleanup);

const offen: TischStand = {
  spiel: "s1",
  online: true,
  runde: { nummer: 3, kategorie: "titel", aufgeloest: false },
  bingo: [],
};
const aufgeloest: TischStand = {
  ...offen,
  runde: {
    ...offen.runde!,
    aufgeloest: true,
    song: { titel: "Bohemian Rhapsody", interpret: "Queen", jahr: 1975 },
  },
};

function tisch(runde: Runde | null) {
  return (
    <Tisch
      zuschauer
      runde={runde}
      stapelLeer={false}
      bingo={false}
      onRadDrehen={() => {}}
      onLoesungAnzeigen={() => {}}
      onVonVorn={() => {}}
      onNeuesSpiel={() => {}}
    />
  );
}

// Zeigt den Tisch eines Spielers im Online-Raum, neu() zeigt ihn mit einem neuen Stand.
function zeigen(stand: TischStand | null) {
  const { rerender } = render(tisch(stand && rundeAusStand(stand)));
  return { neu: (s: TischStand) => rerender(tisch(rundeAusStand(s))) };
}

test("Zuschauer sieht keine Knöpfe", () => {
  zeigen(offen);
  expect(screen.queryByRole("button")).toBeNull();
});

test("neue Runde: Kategorie erst, wenn das Rad steht", () => {
  const { neu } = zeigen(null);
  neu(offen);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("Das Rad dreht …")).toBeDefined();
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
  expect(screen.getByRole("status").textContent).toBe("Titel");
});

test("Beitritt in einer aufgelösten Runde: Lösung sofort, das Rad dreht nicht", () => {
  zeigen(aufgeloest);
  expect(screen.getByRole("status").textContent).toBe("Titel");
  expect(
    screen.getByRole("heading", { level: 2, name: "Bohemian Rhapsody" }),
  ).toBeDefined();
  expect(screen.getByText("Queen")).toBeDefined();
  expect(screen.getByText("Richtig? Hake ein Feld Titel ab.")).toBeDefined();
});

test("die Auflösung derselben Runde dreht das Rad nicht", () => {
  const { neu } = zeigen(offen);
  neu(aufgeloest);
  expect(screen.getByRole("status").textContent).toBe("Titel");
});
