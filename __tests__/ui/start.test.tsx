import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { antwort } from "../hilfen/antwort";
import Start from "@/app/ui/start";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("abgemeldet: Anmelden und Demo, die Demo startet das Spiel aus Phase 1", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  render(<Start />);
  const anmelden = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Mit Spotify anmelden",
  });
  expect(anmelden.disabled).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  expect(screen.getByRole("button", { name: "Spiel starten" })).toBeDefined();
});

test("ohne Client-ID ist Anmelden aus und ein Hinweis erklärt warum", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "");
  render(<Start />);
  const anmelden = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Mit Spotify anmelden",
  });
  expect(anmelden.disabled).toBe(true);
  expect(
    screen.getByText(/NEXT_PUBLIC_SPOTIFY_CLIENT_ID in \.env\.local/),
  ).toBeDefined();
});

function angemeldet(ablauf: number) {
  localStorage.setItem(
    "musik-app:spotify-token",
    JSON.stringify({ accessToken: "a1", refreshToken: "r1", ablauf }),
  );
}

test("angemeldet: Playlists mit Anzahl, Abmelden führt zurück zum Anmelden", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(Date.now() + 3_600_000);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      antwort({
        items: [{ id: "p1", name: "Partyhits", items: { total: 98 } }],
        next: null,
      }),
    ),
  );
  render(<Start />);
  expect(
    await screen.findByRole("heading", { name: "Deine Playlists" }),
  ).toBeDefined();
  expect(await screen.findByText("Partyhits (98 Songs)")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
  expect(
    await screen.findByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeDefined();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});

test("entzogener Zugriff zeigt wieder „Mit Spotify anmelden“", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(0);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => antwort({ error: "invalid_grant" }, 400)),
  );
  render(<Start />);
  expect(
    await screen.findByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeDefined();
});

test("lehnt Spotify das Token beim Laden ab, wird abgemeldet", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(Date.now() + 3_600_000);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => antwort({ error: { status: 401 } }, 401)),
  );
  render(<Start />);
  expect(
    await screen.findByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeDefined();
  expect(localStorage.getItem("musik-app:spotify-token")).toBeNull();
});
