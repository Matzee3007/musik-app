import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Buehne from "@/app/ui/buehne";

afterEach(cleanup);

function zeigen(supabase = true) {
  const handler = {
    onTisch: vi.fn(),
    onOnline: vi.fn(),
    onBeitreten: vi.fn(),
  };
  render(<Buehne supabase={supabase} {...handler} />);
  return handler;
}

const knopf = (name: string) =>
  screen.getByRole<HTMLButtonElement>("button", { name });

test("zeigt Schlagzeile als h1 und das Logo", () => {
  zeigen();
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Dreh das Rad. Erkenn den Song.",
    }),
  ).toBeDefined();
  expect(screen.getByText("Musik-Bingo")).toBeDefined();
});

test("Am Tisch spielen ruft onTisch", () => {
  const { onTisch } = zeigen();
  fireEvent.click(knopf("Am Tisch spielen"));
  expect(onTisch).toHaveBeenCalledOnce();
});

test("Online spielen fragt nach dem Namen, Online-Raum eröffnen ruft onOnline mit dem Namen", () => {
  const { onOnline } = zeigen();
  expect(screen.queryByLabelText("Dein Name")).toBeNull();
  fireEvent.click(knopf("Online spielen"));
  expect(knopf("Online-Raum eröffnen").disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Dein Name"), {
    target: { value: "  Sam " },
  });
  fireEvent.click(knopf("Online-Raum eröffnen"));
  expect(onOnline).toHaveBeenCalledWith("Sam");
});

test("Beitreten ist erst mit gültigem Code an und ruft onBeitreten", () => {
  const { onBeitreten } = zeigen();
  expect(knopf("Beitreten").disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Raum-Code"), {
    target: { value: "ab cd" },
  });
  fireEvent.click(knopf("Beitreten"));
  expect(onBeitreten).toHaveBeenCalledWith("ABCD");
});

test("ohne Supabase sind Raum-Knöpfe aus, ein Hinweis erklärt warum, Mitspielen entfällt", () => {
  zeigen(false);
  expect(knopf("Am Tisch spielen").disabled).toBe(true);
  expect(knopf("Online spielen").disabled).toBe(true);
  // Ohne Supabase gibt es keinen Raum zum Beitreten, das Band "Mitspielen" entfällt.
  expect(screen.queryByLabelText("Raum-Code")).toBeNull();
  expect(
    screen.getByText(
      "Supabase ist hier nicht eingerichtet, nur die Demo ohne Raum.",
    ),
  ).toBeDefined();
});
