import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Knopf from "@/app/ui/knopf";

afterEach(cleanup);

test("Knopf meldet Klick und ist deaktiviert ohne Klick", () => {
  const klick = vi.fn();
  const { rerender } = render(<Knopf onClick={klick}>Rad drehen</Knopf>);
  fireEvent.click(screen.getByRole("button", { name: "Rad drehen" }));
  expect(klick).toHaveBeenCalledTimes(1);
  rerender(
    <Knopf onClick={klick} disabled>
      Rad drehen
    </Knopf>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Rad drehen" }));
  expect(klick).toHaveBeenCalledTimes(1);
});
