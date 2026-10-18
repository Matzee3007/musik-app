import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("Startseite zeigt den Namen der App", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Musik-App" }),
  ).toBeDefined();
});
