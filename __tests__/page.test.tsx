import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("Startseite zeigt Überschrift und „Demo starten“", async () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Musik-App" }),
  ).toBeDefined();
  expect(
    await screen.findByRole("button", { name: "Demo starten" }),
  ).toBeDefined();
});
