import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import RaumKopf from "@/app/ui/raum-kopf";
import { tischRaumLaden, tischRaumSpeichern } from "@/lib/raum/speicher";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

function kopf(raum = nachgebauterRaum(), onGeschlossen = () => {}) {
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(
    <RaumKopf
      code="ABCD"
      kanal={raum.oeffnen("ABCD", "t")}
      onGeschlossen={onGeschlossen}
    />,
  );
  return raum;
}

test("zeigt Code und QR-Code mit dem Link zum Raum", () => {
  kopf();
  expect(screen.getByText("ABCD")).toBeDefined();
  expect(screen.getByTitle("QR-Code für Raum ABCD")).toBeDefined();
});

test("meldet den Tisch im Raum an", async () => {
  const raum = kopf();
  await waitFor(() =>
    expect(raum.angemeldet).toContainEqual({
      schluessel: expect.any(String),
      rolle: "tisch",
    }),
  );
});

test("zeigt verbundene Spieler und graut gegangene aus", async () => {
  const raum = kopf();
  const anna = { schluessel: "s1", rolle: "spieler", name: "Anna" } as const;
  const ben = { schluessel: "s2", rolle: "spieler", name: "Ben" } as const;
  act(() => raum.anwesendeSetzen([anna, ben]));
  act(() => raum.anwesendeSetzen([ben]));
  expect(screen.getByText("Anna").getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByText("Ben").getAttribute("aria-disabled")).toBeNull();
  expect(tischRaumLaden()).toEqual({ code: "ABCD", bekannt: ["Anna", "Ben"] });
});

test("Raum schließen sagt es allen und löscht den Raum", async () => {
  const onGeschlossen = vi.fn();
  const raum = kopf(nachgebauterRaum(), onGeschlossen);
  fireEvent.click(screen.getByRole("button", { name: "Raum schließen" }));
  await waitFor(() => expect(onGeschlossen).toHaveBeenCalled());
  expect(raum.gesendet).toEqual([{ art: "geschlossen" }]);
  expect(tischRaumLaden()).toBeNull();
});
