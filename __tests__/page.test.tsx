import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

test("Startseite zeigt Schlagzeile und „Demo starten“", async () => {
  // Ohne Supabase wie in den Vorschauen: Bühne mit Schlagzeile und darunter die Demo.
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  render(<Page />);
  // Start zeichnet erst, nachdem ein Effekt den Speicher gelesen hat.
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Dreh das Rad. Erkenn den Song.",
    }),
  ).toBeDefined();
  expect(
    await screen.findByRole("button", { name: "Demo starten" }),
  ).toBeDefined();
  vi.unstubAllEnvs();
});
