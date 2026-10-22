import { afterEach, expect, test } from "vitest";
import type { HandyKarte } from "@/lib/raum/handy-karte";
import {
  handyKarteLaden,
  handyKarteSpeichern,
  handyRaumLaden,
  handyRaumLoeschen,
  handyRaumSpeichern,
  notizenAn,
  notizenSpeichern,
  tabSchluessel,
  tischRaumLaden,
  tischRaumLoeschen,
  tischRaumSpeichern,
} from "@/lib/raum/speicher";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("Tischraum übersteht Speichern und Laden", () => {
  tischRaumSpeichern({ code: "ABCD", bekannt: ["Anna"] });
  expect(tischRaumLaden()).toEqual({ code: "ABCD", bekannt: ["Anna"] });
  tischRaumLoeschen();
  expect(tischRaumLaden()).toBeNull();
});

test("ohne gespeicherten Raum liefert das Laden null", () => {
  expect(tischRaumLaden()).toBeNull();
  expect(handyRaumLaden("ABCD")).toBeNull();
});

test("Handyraum gilt nur für denselben Code", () => {
  handyRaumSpeichern({ code: "ABCD", name: "Anna" });
  expect(handyRaumLaden("ABCD")).toEqual({ code: "ABCD", name: "Anna" });
  expect(handyRaumLaden("WXYZ")).toBeNull();
});

test("tabSchluessel bleibt im selben Tab gleich", () => {
  expect(tabSchluessel()).toBe(tabSchluessel());
});

test("ein neuer Tab bekommt einen neuen Schlüssel", () => {
  const erster = tabSchluessel();
  sessionStorage.clear();
  expect(tabSchluessel()).not.toBe(erster);
});

const karte: HandyKarte = {
  spiel: "s1",
  karte: [{ kategorie: "titel", abgehakt: true }],
  abgehakt: { runde: 2, feld: 0 },
};

test("Karte übersteht das Neuladen", () => {
  expect(handyKarteLaden()).toBeNull();
  handyKarteSpeichern(karte);
  expect(handyKarteLaden()).toEqual(karte);
});

test("Raum löschen löscht auch die Karte", () => {
  handyRaumSpeichern({ code: "ABCD", name: "Anna" });
  handyKarteSpeichern(karte);
  handyRaumLoeschen();
  expect(handyRaumLaden("ABCD")).toBeNull();
  expect(handyKarteLaden()).toBeNull();
});

test("Notizfläche ist anfangs an und merkt sich aus", () => {
  expect(notizenAn()).toBe(true);
  notizenSpeichern(false);
  expect(notizenAn()).toBe(false);
  notizenSpeichern(true);
  expect(notizenAn()).toBe(true);
});
