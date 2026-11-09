import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RaumOffen from "@/app/ui/raum-offen";

afterEach(cleanup);

function zeigen(extra: Partial<React.ComponentProps<typeof RaumOffen>> = {}) {
  const handler = { onAnmelden: vi.fn(), onDemo: vi.fn() };
  render(
    <RaumOffen
      code="EHMF"
      online={false}
      adresse="musik-bingo.vercel.app"
      schublade={<p>Schublade</p>}
      anmeldenAus={false}
      {...handler}
      {...extra}
    />,
  );
  return handler;
}

const knopf = (name: string) =>
  screen.getByRole<HTMLButtonElement>("button", { name });

test("zeigt die Schlagzeile mit dem Code als h1 und das Logo", () => {
  zeigen();
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Raum EHMF ist offen. Verbinde die Musik.",
    }),
  ).toBeDefined();
  expect(screen.getByText("Musik-Bingo")).toBeDefined();
});

test("Mit Spotify anmelden und Demo starten rufen ihre Handler", () => {
  const { onAnmelden, onDemo } = zeigen();
  fireEvent.click(knopf("Mit Spotify anmelden"));
  fireEvent.click(knopf("Demo starten"));
  expect(onAnmelden).toHaveBeenCalledOnce();
  expect(onDemo).toHaveBeenCalledOnce();
});

test("anmeldenAus schaltet nur Anmelden aus, der Hinweis steht da", () => {
  zeigen({
    anmeldenAus: true,
    hinweis: <p>Spotify ist hier nicht eingerichtet</p>,
  });
  expect(knopf("Mit Spotify anmelden").disabled).toBe(true);
  expect(knopf("Demo starten").disabled).toBe(false);
  expect(screen.getByText("Spotify ist hier nicht eingerichtet")).toBeDefined();
});

test("am Tisch erklärt das Band QR-Code und Adresse", () => {
  zeigen();
  expect(
    screen.getByText(
      "QR-Code scannen oder musik-bingo.vercel.app öffnen und EHMF eingeben.",
    ),
  ).toBeDefined();
});

test("zeigt die Schublade", () => {
  zeigen();
  expect(screen.getByText("Schublade")).toBeDefined();
});

test("online zeigt das Band einen vollständigen Link mit https", () => {
  zeigen({ online: true, adresse: "https://musik-bingo.vercel.app" });
  expect(
    screen.getByText("Link schicken: https://musik-bingo.vercel.app/raum/EHMF"),
  ).toBeDefined();
});
