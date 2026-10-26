import { expect, test, vi } from "vitest";
import { nachgebauterRaum } from "../../hilfen/raum-kanal";
import { ruhe, verbindungsFabrik } from "../../hilfen/verbindung";
import type { RaumNachricht } from "@/lib/raum/kanal";
import { tonEmpfangen, tonSenden, type TonSignal } from "@/lib/raum/ton";

const spur = { kind: "audio" } as MediaStreamTrack;
const strom = { getAudioTracks: () => [spur] } as unknown as MediaStream;
const angebot = { type: "offer" as const, sdp: "angebot" };
const antwort = { type: "answer" as const, sdp: "antwort" };

function ton(signal: TonSignal): RaumNachricht {
  return { art: "ton", signal };
}

// Der DJ "dj" teilt Ton. schicken() spielt ein Signal eines anderen Geräts ein und wartet auf die Verarbeitung.
function senden() {
  const raum = nachgebauterRaum();
  const fabrik = verbindungsFabrik();
  const beiAnzahl = vi.fn<(verbunden: number) => void>();
  const beiFehler = vi.fn();
  const beenden = tonSenden(
    raum.oeffnen("ABCD", "dj"),
    "dj",
    strom,
    beiAnzahl,
    fabrik.neu,
    beiFehler,
  );
  async function schicken(signal: TonSignal) {
    raum.nachrichtSchicken(ton(signal));
    await ruhe();
  }
  return { raum, ...fabrik, beiAnzahl, beiFehler, beenden, schicken };
}

test("tonSenden meldet bereit", async () => {
  const { raum } = senden();
  await ruhe();
  expect(raum.gesendet).toEqual([ton({ art: "bereit", von: "dj" })]);
});

test("auf hallo: Angebot an genau diesen Spieler mit der Tonspur", async () => {
  const { raum, alle, schicken } = senden();
  await schicken({ art: "hallo", von: "anna" });
  expect(alle).toHaveLength(1);
  expect(alle[0].spuren).toEqual([spur]);
  expect(raum.gesendet.at(-1)).toEqual(
    ton({ art: "angebot", an: "anna", von: "dj", sdp: angebot }),
  );
  alle[0].kandidatFinden({ candidate: "k-dj" });
  await ruhe();
  expect(raum.gesendet.at(-1)).toEqual(
    ton({
      art: "kandidat",
      an: "anna",
      von: "dj",
      kandidat: { candidate: "k-dj" },
    }),
  );
});

test("Antwort und Kandidaten gehen an die Verbindung des Spielers, fremde nicht", async () => {
  const { alle, schicken, beiFehler } = senden();
  await schicken({ art: "hallo", von: "anna" });
  await schicken({ art: "hallo", von: "ben" });
  await schicken({ art: "antwort", an: "dj", von: "anna", sdp: antwort });
  await schicken({
    art: "kandidat",
    an: "dj",
    von: "anna",
    kandidat: { candidate: "k-anna" },
  });
  // Für einen anderen DJ bestimmt: geht niemanden hier etwas an.
  await schicken({ art: "antwort", an: "anderer", von: "ben", sdp: antwort });
  expect(alle[0].entfernt).toEqual(antwort);
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-anna" }]);
  expect(alle[1].entfernt).toBeNull();
  expect(beiFehler).not.toHaveBeenCalled();
});

test("ein Kandidat vor der fertigen Antwort wird erst danach eingetragen", async () => {
  const { alle, schicken, beiFehler } = senden();
  await schicken({ art: "hallo", von: "anna" });
  alle[0].verzoegern();
  await schicken({ art: "antwort", an: "dj", von: "anna", sdp: antwort });
  await schicken({
    art: "kandidat",
    an: "dj",
    von: "anna",
    kandidat: { candidate: "k-anna" },
  });
  expect(alle[0].kandidaten).toEqual([]);
  alle[0].weiter();
  await ruhe();
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-anna" }]);
  expect(beiFehler).not.toHaveBeenCalled();
});

test("neues hallo desselben Spielers schließt die alte Verbindung und zählt ihn einmal", async () => {
  const { alle, schicken, beiAnzahl } = senden();
  await schicken({ art: "hallo", von: "anna" });
  alle[0].zustand("connected");
  expect(beiAnzahl).toHaveBeenLastCalledWith(1);
  await schicken({ art: "hallo", von: "anna" });
  expect(alle[0].geschlossen).toBe(true);
  alle[1].zustand("connected");
  expect(beiAnzahl).toHaveBeenLastCalledWith(1);
});

test("beenden schließt alle Verbindungen und hört nicht mehr zu", async () => {
  const { alle, schicken, beenden } = senden();
  await schicken({ art: "hallo", von: "anna" });
  await schicken({ art: "hallo", von: "ben" });
  beenden();
  expect(alle.map((v) => v.geschlossen)).toEqual([true, true]);
  await schicken({ art: "hallo", von: "cem" });
  expect(alle).toHaveLength(2);
});

// Spielerin "anna" möchte Ton. schicken() spielt ein Signal eines anderen Geräts ein und wartet auf die Verarbeitung.
function empfangen() {
  const raum = nachgebauterRaum();
  const fabrik = verbindungsFabrik();
  const beiStrom = vi.fn<(strom: MediaStream) => void>();
  const beiFehler = vi.fn();
  const beenden = tonEmpfangen(
    raum.oeffnen("ABCD", "anna"),
    "anna",
    beiStrom,
    fabrik.neu,
    beiFehler,
  );
  async function schicken(signal: TonSignal) {
    raum.nachrichtSchicken(ton(signal));
    await ruhe();
  }
  return { raum, ...fabrik, beiStrom, beiFehler, beenden, schicken };
}

const hallo = ton({ art: "hallo", von: "anna" });

test("tonEmpfangen meldet hallo beim Start und nach einem Wiederbeitritt", async () => {
  const { raum } = empfangen();
  await ruhe();
  expect(raum.gesendet).toEqual([hallo]);
  raum.verbundenMelden();
  await ruhe();
  expect(raum.gesendet).toEqual([hallo, hallo]);
});

test("nimmt das erste Angebot, antwortet ihm, übergeht ein zweites", async () => {
  const { raum, alle, schicken, beiFehler } = empfangen();
  await schicken({ art: "angebot", an: "anna", von: "dj", sdp: angebot });
  expect(alle[0].entfernt).toEqual(angebot);
  expect(raum.gesendet.at(-1)).toEqual(
    ton({ art: "antwort", an: "dj", von: "anna", sdp: antwort }),
  );
  const vorher = raum.gesendet.length;
  await schicken({ art: "angebot", an: "anna", von: "dj2", sdp: angebot });
  expect(raum.gesendet).toHaveLength(vorher);
  // Für jemand anderen bestimmt.
  await schicken({ art: "angebot", an: "ben", von: "dj", sdp: angebot });
  expect(raum.gesendet).toHaveLength(vorher);
  expect(beiFehler).not.toHaveBeenCalled();
});

test("Kandidaten nur vom gewählten DJ", async () => {
  const { raum, alle, schicken } = empfangen();
  await schicken({ art: "angebot", an: "anna", von: "dj", sdp: angebot });
  await schicken({
    art: "kandidat",
    an: "anna",
    von: "dj",
    kandidat: { candidate: "k-dj" },
  });
  await schicken({
    art: "kandidat",
    an: "anna",
    von: "dj2",
    kandidat: { candidate: "k-dj2" },
  });
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-dj" }]);
  alle[0].kandidatFinden({ candidate: "k-anna" });
  await ruhe();
  expect(raum.gesendet.at(-1)).toEqual(
    ton({
      art: "kandidat",
      an: "dj",
      von: "anna",
      kandidat: { candidate: "k-anna" },
    }),
  );
});

test("bereit eines DJs beginnt neu: alte Verbindung zu, neues hallo", async () => {
  const { raum, alle, schicken } = empfangen();
  await schicken({ art: "angebot", an: "anna", von: "dj", sdp: angebot });
  await schicken({ art: "bereit", von: "dj" });
  expect(alle[0].geschlossen).toBe(true);
  expect(raum.gesendet.at(-1)).toEqual(hallo);
  await schicken({ art: "angebot", an: "anna", von: "dj", sdp: angebot });
  expect(alle.at(-1)!.entfernt).toEqual(angebot);
});

test("eine ankommende Tonspur geht an beiStrom", async () => {
  const { alle, schicken, beiStrom } = empfangen();
  await schicken({ art: "angebot", an: "anna", von: "dj", sdp: angebot });
  const ankommend = {} as MediaStream;
  alle[0].spurKommt(ankommend);
  expect(beiStrom).toHaveBeenCalledWith(ankommend);
});

test("beenden schließt die Verbindung und sagt kein hallo mehr", async () => {
  const { raum, alle, beenden } = empfangen();
  await ruhe();
  beenden();
  expect(alle.every((v) => v.geschlossen)).toBe(true);
  raum.verbundenMelden();
  await ruhe();
  expect(raum.gesendet).toEqual([hallo]);
});
