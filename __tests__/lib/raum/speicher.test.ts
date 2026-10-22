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
  raumSichtbar,
  raumSichtbarSpeichern,
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
  karte: Array.from({ length: 25 }, (_, i) => ({
    kategorie: "titel",
    abgehakt: i === 0,
  })),
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

test("eine beschädigte Karte im Speicher ergibt null", () => {
  localStorage.setItem("musik-app:handy-karte", "{kaputt");
  expect(handyKarteLaden()).toBeNull();
  localStorage.setItem(
    "musik-app:handy-karte",
    JSON.stringify({ spiel: "s1" }),
  );
  expect(handyKarteLaden()).toBeNull();
});

// Zwei Tabs im selben Browser: localStorage teilen sie, sessionStorage hat jeder für sich.
function tabWechseln(inhalt: Record<string, string>) {
  sessionStorage.clear();
  for (const [k, v] of Object.entries(inhalt)) sessionStorage.setItem(k, v);
}

test("zwei Tabs behalten nach dem Neuladen jeder Raum und Karte", () => {
  const karteB = { ...karte, spiel: "s2" };
  handyRaumSpeichern({ code: "ABCD", name: "Anna" });
  handyKarteSpeichern(karte);
  const tabA = { ...sessionStorage };

  tabWechseln({});
  handyRaumSpeichern({ code: "ABCD", name: "Ben" });
  handyKarteSpeichern(karteB);

  tabWechseln(tabA);
  expect(handyRaumLaden("ABCD")?.name).toBe("Anna");
  expect(handyKarteLaden()).toEqual(karte);

  // Ein neuer Tab, z. B. nach erneutem Scannen des QR-Codes, nimmt den zuletzt gespeicherten Stand.
  tabWechseln({});
  expect(handyRaumLaden("ABCD")?.name).toBe("Ben");
  expect(handyKarteLaden()).toEqual(karteB);
});

test("Raum ist sichtbar, bis er ausgeblendet wird, und bleibt es über ein Neuladen", () => {
  expect(raumSichtbar()).toBe(true);
  raumSichtbarSpeichern(false);
  expect(raumSichtbar()).toBe(false);
  raumSichtbarSpeichern(true);
  expect(localStorage.getItem("musik-app:raum-sichtbar")).toBeNull();
});
