import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { antwort } from "../hilfen/antwort";
import { nachgebauterRaum } from "../hilfen/raum-kanal";
import Start from "@/app/ui/start";
import { tischRaumLaden, tischRaumSpeichern } from "@/lib/raum/speicher";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Ohne Supabase wie in den Vorschauen, Tests mit Raum schalten es ein.
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
});

function mitSupabase() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
}

afterEach(() => {
  push.mockClear();
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
    screen.getByText(
      "Spotify ist hier nicht eingerichtet, nur die Demo. Lokal: NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local eintragen.",
    ),
  ).toBeDefined();
  expect(
    screen.getByRole<HTMLButtonElement>("button", { name: "Demo starten" })
      .disabled,
  ).toBe(false);
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
    vi.fn(async (url: string) =>
      url.endsWith("/v1/me")
        ? antwort({ id: "dj" })
        : antwort({
            items: [
              {
                id: "p1",
                name: "Partyhits",
                owner: { id: "dj" },
                items: { total: 98 },
              },
            ],
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

test("ein Klick auf eine Playlist öffnet das Vorbereiten, Zurück führt zur Liste", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(Date.now() + 3_600_000);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/v1/me")
        ? antwort({ id: "dj" })
        : url.includes("/me/playlists")
          ? antwort({
              items: [
                {
                  id: "p1",
                  name: "Partyhits",
                  owner: { id: "dj" },
                  items: { total: 98 },
                },
              ],
              next: null,
            })
          : antwort({ items: [], next: null }),
    ),
  );
  render(<Start />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Partyhits (98 Songs)" }),
  );
  expect(screen.getByRole("heading", { name: "Partyhits" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
  expect(
    await screen.findByRole("heading", { name: "Deine Playlists" }),
  ).toBeDefined();
});

test("Raum eröffnen zeigt den Raum-Kopf, danach Demo und Anmelden", async () => {
  mitSupabase();
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  fireEvent.click(await screen.findByRole("button", { name: "Raum eröffnen" }));
  expect(screen.queryByRole("button", { name: "Raum eröffnen" })).toBeNull();
  const raum = tischRaumLaden();
  expect(raum?.code).toMatch(/^[A-Z]{4}$/);
  expect(screen.getByText(raum!.code)).toBeDefined();
  expect(screen.getByRole("button", { name: "Raum schließen" })).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Demo starten" })).toBeDefined();
});

test("mit Supabase kommen Anmelden und Demo erst nach dem Eröffnen", async () => {
  mitSupabase();
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  await screen.findByRole("button", { name: "Raum eröffnen" });
  expect(screen.queryByRole("button", { name: "Demo starten" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeNull();
});

test("gespeicherter Raum ist nach dem Neuladen wieder da", async () => {
  mitSupabase();
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(await screen.findByText("ABCD")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Raum eröffnen" })).toBeNull();
});

test("Raum schließen führt zurück zu Eröffnen und Beitreten", async () => {
  mitSupabase();
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Raum schließen" }),
  );
  expect(
    await screen.findByRole("button", { name: "Raum eröffnen" }),
  ).toBeDefined();
});

test("Beitreten öffnet den Raum mit dem gelesenen Code", async () => {
  mitSupabase();
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  const beitreten = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Beitreten",
  });
  expect(beitreten.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Raum-Code"), {
    target: { value: "ab cd" },
  });
  expect(beitreten.disabled).toBe(false);
  fireEvent.click(beitreten);
  expect(push).toHaveBeenCalledWith("/raum/ABCD");
});

test("ohne Supabase sind Raum-Knöpfe aus, die Demo geht", async () => {
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  const eroeffnen = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Raum eröffnen",
  });
  expect(eroeffnen.disabled).toBe(true);
  expect(
    screen.getByRole<HTMLButtonElement>("button", { name: "Beitreten" })
      .disabled,
  ).toBe(true);
  expect(
    screen.getByText(
      "Supabase ist hier nicht eingerichtet, nur die Demo ohne Raum.",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  expect(screen.getByRole("button", { name: "Spiel starten" })).toBeDefined();
});

test("Demo im Raum zeigt den Tisch ohne Karte und meldet den Stand", async () => {
  mitSupabase();
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  const raum = nachgebauterRaum();
  render(<Start kanalOeffnen={raum.oeffnen} />);
  fireEvent.click(await screen.findByRole("button", { name: "Demo starten" }));
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getByRole("region", { name: "Tisch" })).toBeDefined();
  expect(screen.queryByRole("region", { name: "Karte" })).toBeNull();
  await waitFor(() =>
    expect(raum.angemeldet.at(-1)).toMatchObject({
      rolle: "tisch",
      stand: { runde: null, bingo: [] },
    }),
  );
});
