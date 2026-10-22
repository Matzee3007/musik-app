import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import HandyRaum from "@/app/ui/handy-raum";
import { handyRaumLaden, handyRaumSpeichern } from "@/lib/raum/speicher";

const tisch = { schluessel: "t", rolle: "tisch" } as const;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllEnvs();
});

function raumMitTisch() {
  const raum = nachgebauterRaum();
  raum.anwesendeSetzen([tisch]);
  return raum;
}

async function nameEingeben(name: string) {
  fireEvent.change(await screen.findByLabelText("Dein Name"), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Beitreten" }));
}

test("Name eingeben und beitreten meldet den Spieler an", async () => {
  const raum = raumMitTisch();
  render(<HandyRaum code="ABCD" kanalOeffnen={raum.oeffnen} />);
  const beitreten = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Beitreten",
  });
  expect(beitreten.disabled).toBe(true);
  await nameEingeben("  Anna ");
  expect(
    await screen.findByText("Du bist im Raum ABCD als Anna."),
  ).toBeDefined();
  expect(screen.getByText("Warte auf das Spiel …")).toBeDefined();
  expect(raum.angemeldet).toContainEqual({
    schluessel: expect.any(String),
    rolle: "spieler",
    name: "Anna",
  });
  expect(handyRaumLaden("ABCD")).toEqual({ code: "ABCD", name: "Anna" });
});

test("Name schon vergeben", async () => {
  const raum = nachgebauterRaum();
  raum.anwesendeSetzen([
    tisch,
    { schluessel: "s9", rolle: "spieler", name: "Anna" },
  ]);
  render(<HandyRaum code="ABCD" kanalOeffnen={raum.oeffnen} />);
  await nameEingeben("anna");
  expect(screen.getByText("Name schon vergeben")).toBeDefined();
  expect(raum.angemeldet).toEqual([]);
});

test("Raum-Code klein in der Adresse wird gelesen", async () => {
  render(<HandyRaum code="abcd" kanalOeffnen={raumMitTisch().oeffnen} />);
  expect(
    await screen.findByRole("heading", { name: "Raum ABCD" }),
  ).toBeDefined();
});

test("ohne Tisch im Kanal: Kein Tisch mit dem Code", async () => {
  render(<HandyRaum code="ABCD" kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(
    await screen.findByText("Kein Tisch mit dem Code ABCD. Code prüfen."),
  ).toBeDefined();
});

test("gespeicherter Raum tritt nach dem Neuladen ohne Namensabfrage bei", async () => {
  handyRaumSpeichern({ code: "ABCD", name: "Anna" });
  const raum = nachgebauterRaum();
  render(<HandyRaum code="ABCD" kanalOeffnen={raum.oeffnen} />);
  expect(
    await screen.findByText("Du bist im Raum ABCD als Anna."),
  ).toBeDefined();
  expect(screen.queryByLabelText("Dein Name")).toBeNull();
  expect(raum.angemeldet).toContainEqual({
    schluessel: expect.any(String),
    rolle: "spieler",
    name: "Anna",
  });
});

test("Raum geschlossen", async () => {
  handyRaumSpeichern({ code: "ABCD", name: "Anna" });
  const raum = raumMitTisch();
  render(<HandyRaum code="ABCD" kanalOeffnen={raum.oeffnen} />);
  await screen.findByText("Du bist im Raum ABCD als Anna.");
  act(() => raum.nachrichtSchicken({ art: "geschlossen" }));
  expect(screen.getByText("Raum geschlossen")).toBeDefined();
  expect(handyRaumLaden("ABCD")).toBeNull();
});

test("ungültiger Code", () => {
  render(<HandyRaum code="AB1" kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(screen.getByText("Ungültiger Raum-Code.")).toBeDefined();
  expect(
    screen.getByRole("link", { name: "Zur Startseite" }).getAttribute("href"),
  ).toBe("/");
});

test("ohne Supabase", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  render(<HandyRaum code="ABCD" kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(
    screen.getByText("Supabase ist hier nicht eingerichtet."),
  ).toBeDefined();
});
