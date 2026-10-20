import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import SpielAnsicht from "@/app/ui/spiel-ansicht";
import type { Song } from "@/lib/song";

afterEach(() => {
  cleanup();
});

const bohemian: Song = {
  id: "t1",
  titel: "Bohemian Rhapsody",
  interpret: "Queen",
  jahr: 2011,
  cover: "https://i.scdn.co/image/gross.jpg",
};

function klick(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function drehen(knopf: string) {
  klick(knopf);
  fireEvent.transitionEnd(screen.getByRole("img", { name: "Rad" }));
}

function tisch() {
  return within(screen.getByRole("region", { name: "Tisch" }));
}

// Ein Song, Zufall 0: Das Rad wählt Titel. Bis zur Auflösung.
function aufloesen(onJahrKorrigiert?: (songId: string, jahr: number) => void) {
  render(
    <SpielAnsicht
      songs={[bohemian]}
      zufall={() => 0}
      sofort
      onJahrKorrigiert={onJahrKorrigiert}
    />,
  );
  drehen("Rad drehen");
  klick("Lösung anzeigen");
}

test("die Auflösung zeigt das Cover", () => {
  aufloesen();
  const cover = tisch().getByRole("img", {
    name: "Cover von Bohemian Rhapsody",
  });
  expect(cover.getAttribute("src")).toBe(bohemian.cover);
});

function jahrEintragen(wert: string) {
  klick("Jahr korrigieren");
  fireEvent.change(tisch().getByRole("spinbutton", { name: "Jahr" }), {
    target: { value: wert },
  });
  klick("Speichern");
}

test("Jahr korrigieren zeigt sofort das neue Jahr und meldet es", () => {
  const onJahrKorrigiert = vi.fn();
  aufloesen(onJahrKorrigiert);
  expect(tisch().getByText("2011")).toBeDefined();
  jahrEintragen("1975");
  expect(onJahrKorrigiert).toHaveBeenCalledWith("t1", 1975);
  expect(tisch().getByText("1975")).toBeDefined();
  expect(tisch().getByText("1970er")).toBeDefined();
  expect(tisch().queryByRole("spinbutton", { name: "Jahr" })).toBeNull();
});

test("ein ungültiges Jahr wird nicht gespeichert", () => {
  const onJahrKorrigiert = vi.fn();
  aufloesen(onJahrKorrigiert);
  jahrEintragen("75");
  expect(onJahrKorrigiert).not.toHaveBeenCalled();
  expect(tisch().getByText("2011")).toBeDefined();
});

test("nach Von vorn kommt der Song mit dem korrigierten Jahr wieder", () => {
  aufloesen(vi.fn());
  jahrEintragen("1975");
  klick("Von vorn");
  drehen("Nächste Runde");
  klick("Lösung anzeigen");
  expect(tisch().getByText("1975")).toBeDefined();
  expect(tisch().queryByText("2011")).toBeNull();
});

test("in der Demo gibt es kein Jahr korrigieren", () => {
  aufloesen();
  expect(
    tisch().queryByRole("button", { name: "Jahr korrigieren" }),
  ).toBeNull();
});

test("ein offenes, nicht gespeichertes Feld ist in der nächsten Runde wieder zu", () => {
  render(
    <SpielAnsicht
      songs={[bohemian, { ...bohemian, id: "t2", titel: "Anderer Song" }]}
      zufall={() => 0}
      sofort
      onJahrKorrigiert={vi.fn()}
    />,
  );
  drehen("Rad drehen");
  klick("Lösung anzeigen");
  klick("Jahr korrigieren");
  drehen("Nächste Runde");
  klick("Lösung anzeigen");
  expect(tisch().queryByRole("spinbutton", { name: "Jahr" })).toBeNull();
  expect(
    tisch().getByRole("button", { name: "Jahr korrigieren" }),
  ).toBeDefined();
});
