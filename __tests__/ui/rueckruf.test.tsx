import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { antwort } from "../hilfen/antwort";
import Rueckruf from "@/app/ui/rueckruf";
import { anmeldungStarten } from "@/lib/spotify/sitzung";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, "", "/");
});

test("zeigt „Anmeldung abgebrochen“ und einen Weg zurück", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  await anmeldungStarten("abc");
  window.history.replaceState({}, "", "/callback?error=access_denied");
  const onFertig = vi.fn();
  render(<Rueckruf onFertig={onFertig} />);
  expect(await screen.findByText(/Anmeldung abgebrochen/)).toBeDefined();
  expect(
    screen.getByRole("link", { name: "Zur Startseite" }).getAttribute("href"),
  ).toBe("/");
  expect(onFertig).not.toHaveBeenCalled();
});

test("tauscht den Code auch im StrictMode nur einmal und meldet fertig", async () => {
  vi.stubEnv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID", "abc");
  await anmeldungStarten("abc");
  const { state } = JSON.parse(sessionStorage.getItem("musik-app:anmeldung")!);
  window.history.replaceState({}, "", `/callback?code=c1&state=${state}`);
  const abruf = vi.fn(async () =>
    antwort({ access_token: "a1", refresh_token: "r1", expires_in: 3600 }),
  );
  vi.stubGlobal("fetch", abruf);
  const onFertig = vi.fn();
  render(
    <StrictMode>
      <Rueckruf onFertig={onFertig} />
    </StrictMode>,
  );
  expect(screen.getByText("Anmeldung läuft …")).toBeDefined();
  await waitFor(() => expect(onFertig).toHaveBeenCalledTimes(1));
  expect(abruf).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/ungültig/)).toBeNull();
});
