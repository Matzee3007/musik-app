import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

test("Startseite zeigt Überschrift und „Demo starten“", async () => {
  // Ohne Supabase wie in den Vorschauen, sonst kommt erst „Raum eröffnen“.
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Musik-Bingo" }),
  ).toBeDefined();
  expect(
    await screen.findByRole("button", { name: "Demo starten" }),
  ).toBeDefined();
  vi.unstubAllEnvs();
});
