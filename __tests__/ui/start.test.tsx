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
  vi.restoreAllMocks();
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
    await screen.findByRole("heading", { name: "Playlist wählen" }),
  ).toBeDefined();
  expect(
    (await screen.findByRole("button", { name: /Partyhits/ })).textContent,
  ).toContain("98 Songs");
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

test("ohne Netz: Anmelden und Demo mit Hinweis, das Token bleibt gespeichert", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(0);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
  render(<Start />);
  expect(
    await screen.findByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeDefined();
  expect(
    screen.getByText(
      "Spotify ist gerade nicht erreichbar. Verbindung prüfen und die Seite neu laden.",
    ),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Demo starten" })).toBeDefined();
  expect(localStorage.getItem("musik-app:spotify-token")).not.toBeNull();
});

test("im Raum ohne Netz: Raum offen mit Hinweis, das Token bleibt gespeichert", async () => {
  mitSupabase();
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(0);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(
    await screen.findByText(
      "Spotify ist gerade nicht erreichbar. Verbindung prüfen und die Seite neu laden.",
    ),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { level: 1, name: /^Raum ABCD ist offen\./ }),
  ).toBeDefined();
  expect(localStorage.getItem("musik-app:spotify-token")).not.toBeNull();
});

test("ohne Netz mit gültigem Token: Hinweis statt leerer Playlist-Liste", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(Date.now() + 3_600_000);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
  render(<Start />);
  expect(
    await screen.findByText(
      "Spotify ist gerade nicht erreichbar. Verbindung prüfen und die Seite neu laden.",
    ),
  ).toBeDefined();
  expect(localStorage.getItem("musik-app:spotify-token")).not.toBeNull();
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
  fireEvent.click(await screen.findByRole("button", { name: /Partyhits/ }));
  expect(screen.getByRole("heading", { name: "Partyhits" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
  expect(
    await screen.findByRole("heading", { name: "Playlist wählen" }),
  ).toBeDefined();
});

test("Am Tisch spielen zeigt den Raum-Kopf, danach Demo und Anmelden", async () => {
  mitSupabase();
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Am Tisch spielen" }),
  );
  expect(screen.queryByRole("button", { name: "Am Tisch spielen" })).toBeNull();
  const raum = tischRaumLaden();
  expect(raum?.code).toMatch(/^[A-Z]{4}$/);
  expect(screen.getByText(raum!.code)).toBeDefined();
  expect(screen.getByRole("button", { name: "Raum schließen" })).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Mit Spotify anmelden" }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Demo starten" })).toBeDefined();
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: `Raum ${raum!.code} ist offen. Verbinde die Musik.`,
    }),
  ).toBeDefined();
  expect(screen.queryByRole("heading", { name: "Musik-Bingo" })).toBeNull();
});

test("im Raum ohne Client-ID ist Anmelden aus, der Hinweis steht da, die Demo geht", async () => {
  mitSupabase();
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "");
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  const anmelden = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Mit Spotify anmelden",
  });
  expect(anmelden.disabled).toBe(true);
  expect(
    screen.getByText(
      "Spotify ist hier nicht eingerichtet, nur die Demo. Lokal: NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local eintragen.",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  expect(screen.getByRole("button", { name: "Spiel starten" })).toBeDefined();
});

test("im Raum nach dem Anmelden kommt die Playlist-Auswahl wie bisher", async () => {
  mitSupabase();
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(Date.now() + 3_600_000);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/v1/me")
        ? antwort({ id: "dj" })
        : antwort({ items: [], next: null }),
    ),
  );
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(
    await screen.findByRole("heading", { name: "Playlist wählen" }),
  ).toBeDefined();
  expect(screen.queryByRole("heading", { name: /ist offen/ })).toBeNull();
});

test("mit Supabase kommen Anmelden und Demo erst nach dem Eröffnen", async () => {
  mitSupabase();
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  await screen.findByRole("button", { name: "Am Tisch spielen" });
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
  expect(screen.queryByRole("button", { name: "Am Tisch spielen" })).toBeNull();
  expect(
    screen.getByRole("heading", { level: 1, name: /^Raum ABCD ist offen\./ }),
  ).toBeDefined();
});

test("Raum schließen führt zurück zu Eröffnen und Beitreten", async () => {
  mitSupabase();
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Raum schließen" }),
  );
  expect(
    await screen.findByRole("button", { name: "Am Tisch spielen" }),
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
    name: "Am Tisch spielen",
  });
  expect(eroeffnen.disabled).toBe(true);
  expect(screen.queryByRole("button", { name: "Beitreten" })).toBeNull();
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
    expect(raum.gesendet.at(-1)).toMatchObject({
      art: "tisch",
      stand: { runde: null, bingo: [] },
    }),
  );
});

test("Online spielen fragt nach dem Namen und eröffnet einen Online-Raum", async () => {
  mitSupabase();
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Online spielen" }),
  );
  const eroeffnen = screen.getByRole<HTMLButtonElement>("button", {
    name: "Online-Raum eröffnen",
  });
  expect(eroeffnen.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Dein Name"), {
    target: { value: "  Matthias " },
  });
  expect(eroeffnen.disabled).toBe(false);
  fireEvent.click(eroeffnen);
  expect(tischRaumLaden()).toMatchObject({ dj: "Matthias" });
  expect(screen.getByRole("button", { name: "Raum schließen" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getAllByRole("button", { name: /^Feld / })).toHaveLength(25);
});

test("gespeicherter Online-Raum ist nach dem Neuladen wieder online", async () => {
  mitSupabase();
  tischRaumSpeichern({ code: "ABCD", bekannt: [], dj: "Matthias" });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  fireEvent.click(await screen.findByRole("button", { name: "Demo starten" }));
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getAllByRole("button", { name: /^Feld / })).toHaveLength(25);
});

test("im Online-Raum gibt es Ton teilen erst nach Raum offen, im lokalen nicht", async () => {
  mitSupabase();
  tischRaumSpeichern({ code: "ABCD", bekannt: [], dj: "Matthias" });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  // Vor dem Anmelden gibt es noch keinen Ton (Review PR #85, Fund 1).
  await screen.findByRole("heading", { level: 1, name: /ist offen/ });
  expect(screen.queryByRole("button", { name: "Ton teilen" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Demo starten" }));
  expect(
    await screen.findByRole("button", { name: "Ton teilen" }),
  ).toBeDefined();
  cleanup();
  localStorage.clear();
  tischRaumSpeichern({ code: "ABCD", bekannt: [] });
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  await screen.findByText("ABCD");
  expect(screen.queryByRole("button", { name: "Ton teilen" })).toBeNull();
});

test("mit Supabase steht die Bühne sofort da, auch wenn Spotify noch nicht geantwortet hat", async () => {
  mitSupabase();
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  angemeldet(0);
  // Das abgelaufene Token wird erneuert, die Antwort kommt nie.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>(() => {})),
  );
  render(<Start kanalOeffnen={nachgebauterRaum().oeffnen} />);
  expect(
    await screen.findByRole("button", { name: "Am Tisch spielen" }),
  ).toBeDefined();
});

test("Demo beenden führt nach einer Rückfrage zurück zu Anmelden und Demo", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  render(<Start />);
  fireEvent.click(await screen.findByRole("button", { name: "Demo starten" }));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Demo beenden" }));
  expect(confirm).toHaveBeenCalledWith("Spiel beenden?");
  expect(screen.queryByRole("button", { name: "Demo starten" })).toBeNull();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Demo beenden" }));
  expect(screen.getByRole("button", { name: "Demo starten" })).toBeDefined();
});
