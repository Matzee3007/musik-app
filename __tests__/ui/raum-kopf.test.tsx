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
import type { TischStand } from "@/lib/raum/stand";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

function kopf(
  raum = nachgebauterRaum(),
  onGeschlossen = () => {},
  stand: TischStand | null = null,
) {
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  const zeigen = (stand: TischStand | null) => (
    <RaumKopf
      code="ABCD"
      kanal={raum.oeffnen("ABCD", "t")}
      stand={stand}
      onGeschlossen={onGeschlossen}
    />
  );
  const { rerender } = render(zeigen(stand));
  return Object.assign(raum, {
    neuerStand: (stand: TischStand) => rerender(zeigen(stand)),
  });
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
  expect(raum.gesendet).toContainEqual({ art: "geschlossen" });
  expect(tischRaumLaden()).toBeNull();
});

test("Raum schließen ohne Verbindung behält den Raum und zeigt den Fehler", async () => {
  const onGeschlossen = vi.fn();
  const raum = kopf(nachgebauterRaum(), onGeschlossen);
  await waitFor(() => expect(raum.angemeldet).toHaveLength(1));
  raum.stoerung = "Keine Verbindung zum Raum.";
  fireEvent.click(screen.getByRole("button", { name: "Raum schließen" }));
  expect(await screen.findByText("Keine Verbindung zum Raum.")).toBeDefined();
  expect(onGeschlossen).not.toHaveBeenCalled();
  expect(tischRaumLaden()?.code).toBe("ABCD");
});

test("ein Abgleich nach dem Schließen speichert den Raum nicht wieder", async () => {
  const onGeschlossen = vi.fn();
  const raum = kopf(nachgebauterRaum(), onGeschlossen);
  fireEvent.click(screen.getByRole("button", { name: "Raum schließen" }));
  await waitFor(() => expect(onGeschlossen).toHaveBeenCalled());
  act(() =>
    raum.anwesendeSetzen([
      { schluessel: "s1", rolle: "spieler", name: "Anna" },
    ]),
  );
  expect(tischRaumLaden()).toBeNull();
});

const stand: TischStand = { spiel: "s1", runde: null, bingo: [] };

function runde(nummer: number): TischStand {
  return { ...stand, runde: { nummer, kategorie: "jahr", aufgeloest: false } };
}

test("schickt jeden neuen Stand an alle", async () => {
  const raum = kopf(nachgebauterRaum(), () => {}, stand);
  await waitFor(() =>
    expect(raum.gesendet).toContainEqual({ art: "tisch", stand }),
  );
  raum.neuerStand(runde(1));
  await waitFor(() =>
    expect(raum.gesendet.at(-1)).toEqual({ art: "tisch", stand: runde(1) }),
  );
});

test("der Tisch meldet sich nur einmal per Presence an", async () => {
  const raum = kopf(nachgebauterRaum(), () => {}, stand);
  for (const nummer of [1, 2, 3]) {
    raum.neuerStand(runde(nummer));
    await waitFor(() =>
      expect(raum.gesendet.at(-1)).toEqual({
        art: "tisch",
        stand: runde(nummer),
      }),
    );
  }
  expect(raum.angemeldet).toEqual([
    { schluessel: expect.any(String), rolle: "tisch" },
  ]);
});

test("beantwortet eine Anfrage mit dem aktuellen Stand", async () => {
  const raum = kopf(nachgebauterRaum(), () => {}, stand);
  raum.neuerStand(runde(2));
  await waitFor(() =>
    expect(raum.gesendet.at(-1)).toEqual({ art: "tisch", stand: runde(2) }),
  );
  raum.gesendet.length = 0;
  act(() => raum.nachrichtSchicken({ art: "anfrage" }));
  await waitFor(() =>
    expect(raum.gesendet).toEqual([{ art: "tisch", stand: runde(2) }]),
  );
});

test("Raum-Kopf fragt nach und zeigt die Antworten in der Leiste", async () => {
  const raum = kopf(nachgebauterRaum(), () => {}, stand);
  await waitFor(() => expect(raum.gesendet).toContainEqual({ art: "anfrage" }));
  act(() =>
    raum.anwesendeSetzen([
      { schluessel: "s1", rolle: "spieler", name: "Anna" },
    ]),
  );
  act(() =>
    raum.nachrichtSchicken({
      art: "spieler",
      name: "Anna",
      stand: { spiel: "s1", abgehakt: 7, bingo: false },
    }),
  );
  expect(screen.getByText("Anna 7")).toBeDefined();

  // Wiederbeitritt: Der Tisch fragt erneut nach.
  raum.gesendet.length = 0;
  act(() => raum.verbundenMelden());
  expect(raum.gesendet).toContainEqual({ art: "anfrage" });
});
