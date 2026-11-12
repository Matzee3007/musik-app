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

// Der DJ "dj" teilt Ton, anna und ben stehen als Spieler in Presence. schicken() spielt ein Signal eines anderen
// Geräts ein und wartet auf die Verarbeitung.
function senden() {
  const raum = nachgebauterRaum();
  raum.anwesendeSetzen([
    { schluessel: "dj", rolle: "tisch", name: "Dora" },
    { schluessel: "anna", rolle: "spieler", name: "Anna" },
    { schluessel: "ben", rolle: "spieler", name: "Ben" },
  ]);
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

test("auf hallo: Angebot an genau diesen Spieler und Versuch mit der Tonspur", async () => {
  const { raum, alle, schicken } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  expect(alle).toHaveLength(1);
  expect(alle[0].spuren).toEqual([spur]);
  expect(raum.gesendet.at(-1)).toEqual(
    ton({ art: "angebot", an: "anna", von: "dj", versuch: "a1", sdp: angebot }),
  );
  alle[0].kandidatFinden({ candidate: "k-dj" });
  await ruhe();
  expect(raum.gesendet.at(-1)).toEqual(
    ton({
      art: "kandidat",
      an: "anna",
      von: "dj",
      versuch: "a1",
      kandidat: { candidate: "k-dj" },
    }),
  );
});

test("Antwort und Kandidaten gehen an die Verbindung des Spielers, fremde nicht", async () => {
  const { alle, schicken, beiFehler } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  await schicken({ art: "hallo", von: "ben", versuch: "b1" });
  await schicken({
    art: "antwort",
    an: "dj",
    von: "anna",
    versuch: "a1",
    sdp: antwort,
  });
  await schicken({
    art: "kandidat",
    an: "dj",
    von: "anna",
    versuch: "a1",
    kandidat: { candidate: "k-anna" },
  });
  // Für einen anderen DJ bestimmt: geht niemanden hier etwas an.
  await schicken({
    art: "antwort",
    an: "anderer",
    von: "ben",
    versuch: "b1",
    sdp: antwort,
  });
  expect(alle[0].entfernt).toEqual(antwort);
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-anna" }]);
  expect(alle[1].entfernt).toBeNull();
  expect(beiFehler).not.toHaveBeenCalled();
});

// Fund aus dem Test am Gerät: Zwei hallo kurz hintereinander (Strict Mode), die Antwort auf das erste Angebot landete
// in der zweiten Verbindung.
test("eine Antwort zu einem alten Versuch geht nicht in die neue Verbindung", async () => {
  const { alle, schicken } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  await schicken({ art: "hallo", von: "anna", versuch: "a2" });
  await schicken({
    art: "antwort",
    an: "dj",
    von: "anna",
    versuch: "a1",
    sdp: antwort,
  });
  expect(alle[1].entfernt).toBeNull();
  await schicken({
    art: "antwort",
    an: "dj",
    von: "anna",
    versuch: "a2",
    sdp: antwort,
  });
  expect(alle[1].entfernt).toEqual(antwort);
});

test("ein Kandidat vor der fertigen Antwort wird erst danach eingetragen", async () => {
  const { alle, schicken, beiFehler } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  alle[0].verzoegern();
  await schicken({
    art: "antwort",
    an: "dj",
    von: "anna",
    versuch: "a1",
    sdp: antwort,
  });
  await schicken({
    art: "kandidat",
    an: "dj",
    von: "anna",
    versuch: "a1",
    kandidat: { candidate: "k-anna" },
  });
  expect(alle[0].kandidaten).toEqual([]);
  alle[0].weiter();
  await ruhe();
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-anna" }]);
  expect(beiFehler).not.toHaveBeenCalled();
});

test("ein Fehler geht an beiFehler, die nächsten Signale kommen trotzdem dran", async () => {
  const { alle, schicken, beiFehler } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  // Ein Kandidat ohne Antwort davor: Der Nachbau lehnt ab wie das Original.
  await schicken({
    art: "kandidat",
    an: "dj",
    von: "anna",
    versuch: "a1",
    kandidat: { candidate: "zu-frueh" },
  });
  expect(beiFehler).toHaveBeenCalledTimes(1);
  await schicken({
    art: "antwort",
    an: "dj",
    von: "anna",
    versuch: "a1",
    sdp: antwort,
  });
  await schicken({
    art: "kandidat",
    an: "dj",
    von: "anna",
    versuch: "a1",
    kandidat: { candidate: "k-anna" },
  });
  expect(alle[0].entfernt).toEqual(antwort);
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-anna" }]);
});

test("neues hallo desselben Spielers schließt die alte Verbindung und zählt ihn einmal", async () => {
  const { alle, schicken, beiAnzahl } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  alle[0].zustand("connected");
  expect(beiAnzahl).toHaveBeenLastCalledWith(1);
  await schicken({ art: "hallo", von: "anna", versuch: "a2" });
  expect(alle[0].geschlossen).toBe(true);
  alle[1].zustand("connected");
  expect(beiAnzahl).toHaveBeenLastCalledWith(1);
});

test("beenden schließt alle Verbindungen und hört nicht mehr zu", async () => {
  const { alle, schicken, beenden } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  await schicken({ art: "hallo", von: "ben", versuch: "b1" });
  beenden();
  expect(alle.map((v) => v.geschlossen)).toEqual([true, true]);
  await schicken({ art: "hallo", von: "anna", versuch: "a2" });
  expect(alle).toHaveLength(2);
});

// ADR 0010: Ton nur an Geräte, die als Spieler in der Spielerleiste stehen.
test("kein Angebot an ein Gerät, das nicht als Spieler in Presence steht", async () => {
  const { raum, alle, schicken } = senden();
  await schicken({ art: "hallo", von: "lauscher", versuch: "l1" });
  await schicken({ art: "hallo", von: "dj", versuch: "d1" });
  expect(alle).toHaveLength(0);
  expect(raum.gesendet.filter((n) => n.art === "ton")).toEqual([
    ton({ art: "bereit", von: "dj" }),
  ]);
});

test("ein hallo vor der Presence bekommt sein Angebot, sobald der Spieler sichtbar wird", async () => {
  const { raum, alle, schicken } = senden();
  await schicken({ art: "hallo", von: "cem", versuch: "c1" });
  await schicken({ art: "hallo", von: "cem", versuch: "c2" });
  expect(alle).toHaveLength(0);
  raum.anwesendeSetzen([{ schluessel: "cem", rolle: "spieler", name: "Cem" }]);
  await ruhe();
  expect(alle).toHaveLength(1);
  expect(raum.gesendet.at(-1)).toEqual(
    ton({ art: "angebot", an: "cem", von: "dj", versuch: "c2", sdp: angebot }),
  );
  raum.anwesendeSetzen([{ schluessel: "cem", rolle: "spieler", name: "Cem" }]);
  await ruhe();
  expect(alle).toHaveLength(1);
});

// Spielerin "anna" möchte Ton. schicken() spielt ein Signal eines anderen Geräts ein und wartet auf die Verarbeitung.
// versuch() ist der Versuch ihres letzten hallo.
function empfangen() {
  const raum = nachgebauterRaum();
  const fabrik = verbindungsFabrik();
  const beiStrom = vi.fn<(strom: MediaStream | null) => void>();
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
  function hallos() {
    return raum.gesendet.flatMap((n) =>
      n.art === "ton" && n.signal.art === "hallo" ? [n.signal] : [],
    );
  }
  const versuch = () => hallos().at(-1)!.versuch;
  return {
    raum,
    ...fabrik,
    beiStrom,
    beiFehler,
    beenden,
    schicken,
    hallos,
    versuch,
  };
}

test("tonEmpfangen meldet hallo beim Start und nach einem Wiederbeitritt, jedes mit neuem Versuch", async () => {
  const { raum, hallos } = empfangen();
  await ruhe();
  expect(hallos()).toEqual([
    { art: "hallo", von: "anna", versuch: expect.any(String) },
  ]);
  raum.verbundenMelden();
  await ruhe();
  const [erstes, zweites] = hallos();
  expect(zweites.von).toBe("anna");
  expect(zweites.versuch).not.toBe(erstes.versuch);
});

test("nimmt das Angebot zum letzten hallo, antwortet ihm, übergeht ein zweites", async () => {
  const { raum, alle, schicken, versuch, beiFehler } = empfangen();
  const v = versuch();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: v,
    sdp: angebot,
  });
  expect(alle[0].entfernt).toEqual(angebot);
  expect(raum.gesendet.at(-1)).toEqual(
    ton({ art: "antwort", an: "dj", von: "anna", versuch: v, sdp: antwort }),
  );
  const vorher = raum.gesendet.length;
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj2",
    versuch: v,
    sdp: angebot,
  });
  expect(raum.gesendet).toHaveLength(vorher);
  // Für jemand anderen bestimmt.
  await schicken({
    art: "angebot",
    an: "ben",
    von: "dj",
    versuch: v,
    sdp: angebot,
  });
  expect(raum.gesendet).toHaveLength(vorher);
  expect(beiFehler).not.toHaveBeenCalled();
});

// Fund aus dem Test am Gerät: Das Angebot zum ersten von zwei hallo darf nicht angenommen werden.
test("ein Angebot zu einem alten hallo wird übergangen", async () => {
  const { raum, alle, schicken, hallos } = empfangen();
  raum.verbundenMelden();
  await ruhe();
  const [alt, neu] = hallos();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: alt.versuch,
    sdp: angebot,
  });
  expect(alle).toHaveLength(0);
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: neu.versuch,
    sdp: angebot,
  });
  expect(alle[0].entfernt).toEqual(angebot);
});

test("Kandidaten nur vom gewählten DJ und Versuch", async () => {
  const { raum, alle, schicken, versuch } = empfangen();
  const v = versuch();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: v,
    sdp: angebot,
  });
  await schicken({
    art: "kandidat",
    an: "anna",
    von: "dj",
    versuch: v,
    kandidat: { candidate: "k-dj" },
  });
  await schicken({
    art: "kandidat",
    an: "anna",
    von: "dj2",
    versuch: v,
    kandidat: { candidate: "k-dj2" },
  });
  await schicken({
    art: "kandidat",
    an: "anna",
    von: "dj",
    versuch: "alt",
    kandidat: { candidate: "k-alt" },
  });
  expect(alle[0].kandidaten).toEqual([{ candidate: "k-dj" }]);
  alle[0].kandidatFinden({ candidate: "k-anna" });
  await ruhe();
  expect(raum.gesendet.at(-1)).toEqual(
    ton({
      art: "kandidat",
      an: "dj",
      von: "anna",
      versuch: v,
      kandidat: { candidate: "k-anna" },
    }),
  );
});

test("bereit eines DJs beginnt neu: alte Verbindung zu, neues hallo", async () => {
  const { alle, schicken, versuch, hallos } = empfangen();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: versuch(),
    sdp: angebot,
  });
  await schicken({ art: "bereit", von: "dj" });
  expect(alle[0].geschlossen).toBe(true);
  expect(hallos()).toHaveLength(2);
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: versuch(),
    sdp: angebot,
  });
  expect(alle.at(-1)!.entfernt).toEqual(angebot);
});

test("eine ankommende Tonspur geht an beiStrom", async () => {
  const { alle, schicken, beiStrom, versuch } = empfangen();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: versuch(),
    sdp: angebot,
  });
  const ankommend = {} as MediaStream;
  alle[0].spurKommt(ankommend);
  expect(beiStrom).toHaveBeenCalledWith(ankommend);
});

test("beenden schließt die Verbindung und sagt kein hallo mehr", async () => {
  const { raum, alle, beenden, hallos } = empfangen();
  await ruhe();
  beenden();
  expect(alle.every((v) => v.geschlossen)).toBe(true);
  raum.verbundenMelden();
  await ruhe();
  expect(hallos()).toHaveLength(1);
});

// Funde aus dem Review von PR #66.
test("nach einem Wiederbeitritt des DJs meldet er erneut bereit", async () => {
  const { raum } = senden();
  raum.verbundenMelden();
  await ruhe();
  expect(raum.gesendet).toEqual([
    ton({ art: "bereit", von: "dj" }),
    ton({ art: "bereit", von: "dj" }),
  ]);
});

test("eine abgebrochene Verbindung fliegt raus und zählt nicht mehr", async () => {
  const { alle, schicken, beiAnzahl } = senden();
  await schicken({ art: "hallo", von: "anna", versuch: "a1" });
  alle[0].zustand("connected");
  expect(beiAnzahl).toHaveBeenLastCalledWith(1);
  alle[0].zustand("failed");
  expect(alle[0].geschlossen).toBe(true);
  expect(beiAnzahl).toHaveBeenLastCalledWith(0);
  await schicken({
    art: "antwort",
    an: "dj",
    von: "anna",
    versuch: "a1",
    sdp: antwort,
  });
  expect(alle[0].entfernt).toBeNull();
});

test("beenden meldet ende, auch Wiederbeitritte sagen kein bereit mehr", async () => {
  const { raum, beenden } = senden();
  await ruhe();
  beenden();
  await ruhe();
  expect(raum.gesendet.at(-1)).toEqual(ton({ art: "ende", von: "dj" }));
  const vorher = raum.gesendet.length;
  raum.verbundenMelden();
  await ruhe();
  expect(raum.gesendet).toHaveLength(vorher);
});

test("ende vom DJ: Verbindung zu, kein Strom mehr, kein neues hallo", async () => {
  const { alle, schicken, versuch, beiStrom, hallos } = empfangen();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: versuch(),
    sdp: angebot,
  });
  await schicken({ art: "ende", von: "dj" });
  expect(alle[0].geschlossen).toBe(true);
  expect(beiStrom).toHaveBeenLastCalledWith(null);
  expect(hallos()).toHaveLength(1);
});

test("bricht die Verbindung ab, kein Strom mehr und ein neues hallo", async () => {
  const { alle, schicken, versuch, beiStrom, hallos } = empfangen();
  await schicken({
    art: "angebot",
    an: "anna",
    von: "dj",
    versuch: versuch(),
    sdp: angebot,
  });
  alle[0].zustand("failed");
  await ruhe();
  expect(alle[0].geschlossen).toBe(true);
  expect(beiStrom).toHaveBeenLastCalledWith(null);
  expect(hallos()).toHaveLength(2);
});
