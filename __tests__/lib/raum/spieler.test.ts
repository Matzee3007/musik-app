import { expect, test } from "vitest";
import {
  nameLesen,
  nameVergeben,
  spielerleiste,
  tischDa,
} from "@/lib/raum/spieler";

const anna = { schluessel: "s1", rolle: "spieler", name: "Anna" } as const;
const tisch = { schluessel: "t", rolle: "tisch" } as const;

test("nameLesen kürzt Leerzeichen und lehnt leere oder zu lange Namen ab", () => {
  expect(nameLesen("  Anna   Lena ")).toBe("Anna Lena");
  expect(nameLesen("   ")).toBeNull();
  expect(nameLesen("x".repeat(20))).toBe("x".repeat(20));
  expect(nameLesen("x".repeat(21))).toBeNull();
});

test("ein Name ist vergeben, wenn ein anderer Spieler ihn trägt, auch anders geschrieben", () => {
  expect(nameVergeben([tisch, anna], "anna", "s2")).toBe(true);
  expect(nameVergeben([tisch, anna], "Ben", "s2")).toBe(false);
});

test("der eigene Eintrag zählt nicht, so übersteht ein Handy das Neuladen", () => {
  expect(nameVergeben([anna], "Anna", "s1")).toBe(false);
});

test("tischDa erkennt den Tisch unter den Anwesenden", () => {
  expect(tischDa([anna])).toBe(false);
  expect(tischDa([tisch, anna])).toBe(true);
});

test("spielerleiste graut bekannte Spieler aus, die nicht verbunden sind, und hängt neue an", () => {
  const ben = { schluessel: "s3", rolle: "spieler", name: "Ben" } as const;
  expect(spielerleiste(["Anna", "Cem"], [tisch, ben, anna], {}, null)).toEqual([
    { name: "Anna", verbunden: true, abgehakt: null },
    { name: "Cem", verbunden: false, abgehakt: null },
    { name: "Ben", verbunden: true, abgehakt: null },
  ]);
});

test("spielerleiste zeigt die Zahl abgehakter Felder nur für das laufende Spiel und nur verbunden", () => {
  const ben = { schluessel: "s3", rolle: "spieler", name: "Ben" } as const;
  const staende = {
    Anna: { spiel: "s1", abgehakt: 3, bingo: false },
    Ben: { spiel: "alt", abgehakt: 9, bingo: false },
    Cem: { spiel: "s1", abgehakt: 4, bingo: false },
  };
  expect(spielerleiste(["Cem"], [tisch, anna, ben], staende, "s1")).toEqual([
    { name: "Cem", verbunden: false, abgehakt: null },
    { name: "Anna", verbunden: true, abgehakt: 3 },
    { name: "Ben", verbunden: true, abgehakt: null },
  ]);
});
