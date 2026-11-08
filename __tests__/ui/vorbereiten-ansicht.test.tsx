import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { antwort } from "../hilfen/antwort";
import VorbereitenAnsicht from "@/app/ui/vorbereiten-ansicht";
import { PlayerFehler, type Abspieler } from "@/lib/spotify/player";
import type { Playlist } from "@/lib/spotify/playlists";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

const partyhits: Playlist = {
  id: "p1",
  name: "Partyhits",
  anzahlSongs: 1,
  cover: null,
};

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

function ansicht(verbinden?: () => Promise<Abspieler>) {
  return render(
    <VorbereitenAnsicht
      playlist={partyhits}
      accessToken="a1"
      onZurueck={vi.fn()}
      warten={async () => {}}
      verbinden={verbinden}
    />,
  );
}

function nachgebauterAbspieler(): Abspieler {
  return {
    aktivieren: vi.fn(async () => {}),
    abspielen: vi.fn(async () => {}),
    pausieren: vi.fn(async () => {}),
    fortsetzen: vi.fn(async () => {}),
    vonVorn: vi.fn(async () => {}),
    trennen: vi.fn(),
  };
}

test("lädt, bereitet vor und zeigt die Zahl der Songs, danach startet das Spiel", async () => {
  netz(() => antwort({ jahr: 1975 }));
  ansicht();
  expect(screen.getByRole("heading", { name: "Partyhits" })).toBeDefined();
  expect(
    await screen.findByText("1 Song bereit, 0 übersprungen"),
  ).toBeDefined();
  // 1975 ist sicher, also kein Hinweis.
  expect(screen.queryByText(/unsicherem Jahr/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
});

test("nach dem Vorbereiten stehen keine Titel und Jahre, nur die Zahl der unsicheren", async () => {
  // MusicBrainz kennt den Song nicht, das Jahr ist unsicher.
  netz(() => antwort({ jahr: null }));
  ansicht();
  await screen.findByText("1 Song bereit, 0 übersprungen");
  expect(
    screen.getByText("1 Song mit unsicherem Jahr. Prüfe es bei der Auflösung."),
  ).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText(/Bohemian Rhapsody/)).toBeNull();
  expect(screen.queryByText(/2011/)).toBeNull();
});

test("ohne spielbare Songs kein Spiel", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => antwort({ next: null, items: [] })),
  );
  ansicht();
  expect(await screen.findByText("Keine spielbaren Songs")).toBeDefined();
  expect(screen.getByText("0 Songs bereit, 0 übersprungen")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Spiel starten" })).toBeNull();
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

test("gibt Spotify die Songs nicht heraus (403), zeigt die Ansicht eine Meldung statt zu laden", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      antwort({ error: { status: 403, message: "Forbidden" } }, 403),
    ),
  );
  ansicht();
  expect(
    await screen.findByText(
      "Spotify gibt die Songs dieser Playlist nicht heraus. Kopiere sie in eine eigene Playlist.",
    ),
  ).toBeDefined();
  expect(screen.queryByText("Songs werden geladen …")).toBeNull();
  // Die Playlist bleibt gesperrt, ein neuer Versuch hilft nicht.
  expect(
    screen.queryByRole("button", { name: "Nochmal versuchen" }),
  ).toBeNull();
});

test("ohne Netz zeigt die Ansicht eine Meldung, Nochmal versuchen lädt neu", async () => {
  let online = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (!online) throw new TypeError("Failed to fetch");
      return url.startsWith("https://api.spotify.com")
        ? spotifySeite.clone()
        : antwort({ jahr: 1975 });
    }),
  );
  ansicht();
  expect(
    await screen.findByText(
      "Keine Verbindung. Prüfe das Internet und versuch es nochmal.",
    ),
  ).toBeDefined();
  online = true;
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

test("Spiel starten aktiviert den Player und spielt mit Musik", async () => {
  netz(() => antwort({ jahr: 1975 }));
  const abspieler = nachgebauterAbspieler();
  ansicht(async () => abspieler);
  await screen.findByText("1 Song bereit, 0 übersprungen");
  await screen.findByText("Musik bereit");
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(abspieler.aktivieren).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("combobox", { name: "Ausschnitt" })).toBeDefined();
});

test("ohne Premium: Meldung, das Spiel startet trotzdem ohne Musik", async () => {
  netz(() => antwort({ jahr: 1975 }));
  ansicht(async () => {
    throw new PlayerFehler("Spotify Premium nötig.");
  });
  expect(
    await screen.findByText("Musik nicht verfügbar: Spotify Premium nötig."),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Spiel starten" }));
  expect(screen.getByRole("button", { name: "Rad drehen" })).toBeDefined();
  expect(screen.queryByRole("combobox", { name: "Ausschnitt" })).toBeNull();
});

test("Zurück während des Vorbereitens: danach keine Anfrage mehr", async () => {
  const track = (id: string) => ({
    is_local: false,
    item: {
      type: "track",
      id,
      name: id,
      artists: [{ name: "Queen" }],
      album: { release_date: "2011" },
      external_ids: { isrc: `GBUM7102960${id.at(-1)}` },
    },
  });
  let ansichtWeg = () => {};
  const fetch = vi.fn(async (url: string) => {
    if (url.startsWith("https://api.spotify.com")) {
      return antwort({ next: null, items: [track("t1"), track("t2")] });
    }
    // Nach der ersten Antwort klickt der DJ "Zurück", die Ansicht verschwindet.
    queueMicrotask(() => ansichtWeg());
    return antwort({ jahr: 1975 });
  });
  vi.stubGlobal("fetch", fetch);
  ansichtWeg = ansicht().unmount;
  await new Promise((fertig) => setTimeout(fertig, 50));
  const anRoute = fetch.mock.calls.filter(([url]) =>
    String(url).startsWith("/api/erscheinungsjahr"),
  );
  expect(anRoute).toHaveLength(1);
});

test("beim Verlassen wird der Player getrennt", async () => {
  netz(() => antwort({ jahr: 1975 }));
  const abspieler = nachgebauterAbspieler();
  const { unmount } = ansicht(async () => abspieler);
  await screen.findByText("Musik bereit");
  expect(abspieler.trennen).not.toHaveBeenCalled();
  unmount();
  expect(abspieler.trennen).toHaveBeenCalledTimes(1);
});
