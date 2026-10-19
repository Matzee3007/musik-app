import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { antwort } from "../hilfen/antwort";
import VorbereitenAnsicht from "@/app/ui/vorbereiten-ansicht";
import type { Playlist } from "@/lib/spotify/playlists";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

const partyhits: Playlist = { id: "p1", name: "Partyhits", anzahlSongs: 1 };

const spotifySeite = antwort({
  next: null,
  items: [
    {
      is_local: false,
      item: {
        type: "track",
        id: "t1",
        name: "Bohemian Rhapsody",
        artists: [{ name: "Queen" }],
        album: { release_date: "2011-01-01" },
        external_ids: { isrc: "GBUM71029604" },
      },
    },
  ],
});

// Spotify-Adressen liefern die Songs, die eigene Route die Antworten der Reihe nach.
function netz(...jahrAntworten: (() => Response | Promise<Response>)[]) {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.startsWith("https://api.spotify.com")
        ? spotifySeite.clone()
        : jahrAntworten[Math.min(i++, jahrAntworten.length - 1)](),
    ),
  );
}

function ansicht() {
  render(
    <VorbereitenAnsicht
      playlist={partyhits}
      accessToken="a1"
      onZurueck={vi.fn()}
      warten={async () => {}}
    />,
  );
}

test("lädt, bereitet vor und zeigt die Songliste, danach startet das Spiel", async () => {
  netz(() => antwort({ jahr: 1975 }));
  ansicht();
  expect(screen.getByRole("heading", { name: "Partyhits" })).toBeDefined();
  expect(
    await screen.findByText("1 Song bereit, 0 übersprungen"),
  ).toBeDefined();
  expect(screen.getByText("1975")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});

test("bereitet auch im StrictMode nur einmal vor", async () => {
  netz(() => antwort({ jahr: 1975 }));
  render(
    <StrictMode>
      <VorbereitenAnsicht
        playlist={partyhits}
        accessToken="a1"
        onZurueck={vi.fn()}
        warten={async () => {}}
      />
    </StrictMode>,
  );
  await screen.findByText("1 Song bereit, 0 übersprungen");
  const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
  expect(
    urls.filter((u) => u.startsWith("/api/erscheinungsjahr")),
  ).toHaveLength(1);
  expect(
    urls.filter((u) => u.startsWith("https://api.spotify.com")),
  ).toHaveLength(1);
});

test("überlastetes MusicBrainz zeigt die Meldung, Nochmal versuchen setzt fort", async () => {
  const beschaeftigt = () => antwort({ fehler: "beschäftigt" }, 503);
  // Fünf Versuche schlagen fehl (siehe lib/vorbereiten.ts), erst danach die Meldung.
  netz(...Array<() => Response>(5).fill(beschaeftigt), () =>
    antwort({ jahr: 1975 }),
  );
  ansicht();
  expect(
    await screen.findByText("MusicBrainz ist gerade überlastet."),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Nochmal versuchen" }));
  expect(
    await screen.findByText("1 Song bereit, 0 übersprungen"),
  ).toBeDefined();
});

test("zeigt beim Vorbereiten den Fortschritt", async () => {
  let freigeben = () => {};
  netz(
    () =>
      new Promise<Response>((fertig) => {
        freigeben = () => fertig(antwort({ jahr: 1975 }));
      }),
  );
  ansicht();
  const balken = await screen.findByRole("progressbar", {
    name: "Erscheinungsjahre: 0 von 1",
  });
  expect(balken.getAttribute("value")).toBe("0");
  expect(balken.getAttribute("max")).toBe("1");
  freigeben();
  expect(
    await screen.findByText("1 Song bereit, 0 übersprungen"),
  ).toBeDefined();
});
