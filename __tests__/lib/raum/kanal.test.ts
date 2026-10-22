import { expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { raumKanalUeber, raumNachrichtLesen } from "@/lib/raum/kanal";

type Rueckruf = (daten: { payload?: unknown }) => void;

// Nachbau des Supabase-Clients: merkt sich, was der Kanal aufruft, und lässt den Test Ereignisse
// auslösen. Wie das Original lehnt er Rückrufe nach subscribe() und ein zweites subscribe() ab und
// liefert für denselben Namen denselben Kanal, bis er entfernt ist.
function nachgebauterClient() {
  const rueckrufe: { art: string; event: string; rueckruf: Rueckruf }[] = [];
  let status: (s: string) => void = () => {};
  const welt = {
    name: "",
    config: undefined as unknown,
    zustand: {} as Record<string, unknown[]>,
    angemeldet: [] as unknown[],
    gesendet: [] as unknown[],
    entfernt: false,
    geoeffnet: 0,
    // Antwort von Supabase auf track() und send(): "ok", "timed out" oder "error"; "wirft" wirft.
    antwort: "ok",
    // Mit zurueckhalten wartet jedes track(), bis der Test es über offen[i]("ok") beantwortet.
    zurueckhalten: false,
    offen: [] as ((antwort: string) => void)[],
    status: (s: string) => status(s),
    ausloesen(art: string, event: string, payload?: unknown) {
      for (const r of rueckrufe) {
        if (r.art === art && r.event === event) r.rueckruf({ payload });
      }
    },
  };
  let abonniert = false;
  const kanal = {
    on(art: string, filter: { event: string }, rueckruf: Rueckruf) {
      if (abonniert) throw new Error("Rückruf nach subscribe()");
      rueckrufe.push({ art, event: filter.event, rueckruf });
      return kanal;
    },
    subscribe(rueckruf?: (s: string) => void) {
      if (abonniert) throw new Error("subscribe() zweimal");
      abonniert = true;
      status = rueckruf ?? (() => {});
      return kanal;
    },
    presenceState: () => welt.zustand,
    async track(eintrag: unknown) {
      welt.angemeldet.push(eintrag);
      if (welt.zurueckhalten) {
        return new Promise<string>((r) => welt.offen.push(r));
      }
      if (welt.antwort === "wirft") throw new Error("Verbindung weg");
      return welt.antwort;
    },
    async send(nachricht: unknown) {
      welt.gesendet.push(nachricht);
      return welt.antwort;
    },
  };
  const client = {
    channel(name: string, optionen: { config: unknown }) {
      welt.name = name;
      welt.config = optionen.config;
      welt.geoeffnet++;
      return kanal;
    },
    async removeChannel() {
      welt.entfernt = true;
      abonniert = false;
      rueckrufe.length = 0;
      return "ok";
    },
  } as unknown as SupabaseClient;
  return { client, welt };
}

test("verbinden liefert die Anwesenden nach dem ersten Abgleich", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  expect(welt.name).toBe("raum:ABCD");
  expect(welt.config).toEqual({ presence: { key: "s1" } });

  const verbunden = kanal.verbinden();
  welt.status("SUBSCRIBED");
  welt.zustand = {
    t: [{ schluessel: "t", rolle: "tisch", presence_ref: "r1" }],
    s2: [
      { schluessel: "s2", rolle: "spieler", name: "Anna", presence_ref: "r2" },
      { schluessel: "s2", rolle: "spieler", name: "Anna", presence_ref: "r3" },
    ],
  };
  welt.ausloesen("presence", "sync");

  expect(await verbunden).toEqual([
    { schluessel: "t", rolle: "tisch" },
    { schluessel: "s2", rolle: "spieler", name: "Anna" },
  ]);
});

test("verbinden scheitert, wenn Supabase den Kanal ablehnt", async () => {
  const { client, welt } = nachgebauterClient();
  const verbunden = raumKanalUeber(client)("ABCD", "s1").verbinden();
  welt.status("CHANNEL_ERROR");
  await expect(verbunden).rejects.toThrow("Keine Verbindung zum Raum.");
});

test("beiAnwesenden meldet jede Änderung, bis der Rückruf abgemeldet ist", () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  const gemeldet: unknown[] = [];
  const abmelden = kanal.beiAnwesenden((a) => gemeldet.push(a));
  kanal.verbinden();

  welt.zustand = { t: [{ schluessel: "t", rolle: "tisch" }] };
  welt.ausloesen("presence", "sync");
  abmelden();
  welt.zustand = {};
  welt.ausloesen("presence", "sync");

  expect(gemeldet).toEqual([[{ schluessel: "t", rolle: "tisch" }]]);
});

test("anmelden macht das Gerät per Presence sichtbar", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  await kanal.anmelden({ schluessel: "s1", rolle: "spieler", name: "Anna" });
  expect(welt.angemeldet).toEqual([
    { schluessel: "s1", rolle: "spieler", name: "Anna" },
  ]);
});

test("senden schickt per Broadcast, beiNachricht empfängt, bis abgemeldet", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  const empfangen: unknown[] = [];
  const abmelden = kanal.beiNachricht((n) => empfangen.push(n));
  kanal.verbinden();

  await kanal.senden({ art: "geschlossen" });
  expect(welt.gesendet).toEqual([
    { type: "broadcast", event: "nachricht", payload: { art: "geschlossen" } },
  ]);

  welt.ausloesen("broadcast", "nachricht", { art: "geschlossen" });
  abmelden();
  welt.ausloesen("broadcast", "nachricht", { art: "geschlossen" });
  expect(empfangen).toEqual([{ art: "geschlossen" }]);
});

test("trennen gibt den Kanal bei Supabase frei", () => {
  const { client, welt } = nachgebauterClient();
  raumKanalUeber(client)("ABCD", "s1").trennen();
  expect(welt.entfernt).toBe(true);
});

test("verbinden zweimal abonniert nur einmal, wie es React im Strict Mode tut", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  const erstes = kanal.verbinden();
  const zweites = kanal.verbinden();
  welt.ausloesen("presence", "sync");
  expect(await zweites).toEqual(await erstes);
});

test("ein Raum, der noch offen ist, wird beim zweiten Öffnen weiterverwendet", async () => {
  const { client, welt } = nachgebauterClient();
  const oeffnen = raumKanalUeber(client);
  const erster = oeffnen("ABCD", "s1");
  const verbunden = erster.verbinden();
  welt.ausloesen("presence", "sync");
  await verbunden;

  welt.zustand = { t: [{ schluessel: "t", rolle: "tisch" }] };
  const zweiter = oeffnen("ABCD", "s1");
  expect(zweiter).toBe(erster);
  expect(await zweiter.verbinden()).toEqual([
    { schluessel: "t", rolle: "tisch" },
  ]);
});

test("nach dem Trennen öffnet derselbe Raum einen neuen Kanal", () => {
  const { client, welt } = nachgebauterClient();
  const oeffnen = raumKanalUeber(client);
  oeffnen("ABCD", "s1").trennen();
  oeffnen("ABCD", "s1");
  expect(welt.geoeffnet).toBe(2);
});

test("anmelden und senden scheitern, wenn Supabase nicht ok meldet", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  welt.antwort = "timed out";
  await expect(
    kanal.anmelden({ schluessel: "s1", rolle: "tisch" }),
  ).rejects.toThrow("Keine Verbindung zum Raum.");
  await expect(kanal.senden({ art: "geschlossen" })).rejects.toThrow(
    "Keine Verbindung zum Raum.",
  );
});

test("nach einem Wiederbeitritt meldet sich das Gerät neu an", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  const verbunden = kanal.verbinden();
  welt.status("SUBSCRIBED");
  welt.ausloesen("presence", "sync");
  await verbunden;
  const anna = { schluessel: "s1", rolle: "spieler", name: "Anna" } as const;
  await kanal.anmelden(anna);

  // Bildschirm war gesperrt: Supabase verbindet neu und tritt dem Kanal wieder bei.
  welt.status("SUBSCRIBED");
  expect(welt.angemeldet).toEqual([anna, anna]);
});

test("eine gescheiterte Anmeldung wird beim Wiederbeitritt nicht nachgeholt", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  kanal.verbinden();
  const anna = { schluessel: "s1", rolle: "spieler", name: "Anna" } as const;
  welt.antwort = "error";
  await expect(kanal.anmelden(anna)).rejects.toThrow();

  welt.antwort = "ok";
  welt.status("SUBSCRIBED");
  expect(welt.angemeldet).toEqual([anna]);
});

test("scheitert die neue Anmeldung nach dem Wiederbeitritt, bleibt das ohne unbehandelten Fehler", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  kanal.verbinden();
  await kanal.anmelden({ schluessel: "s1", rolle: "tisch" });

  welt.antwort = "wirft";
  welt.status("SUBSCRIBED");
  // Einen Takt warten, damit eine unbehandelte Ablehnung auffiele.
  await new Promise((r) => setTimeout(r, 0));
  expect(welt.angemeldet).toHaveLength(2);
});

test("überholt eine ältere Anmeldung die neuere, meldet der Wiederbeitritt die neuere", async () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  kanal.verbinden();
  const eins = { schluessel: "s1", rolle: "spieler", name: "Anna" } as const;
  const zwei = { schluessel: "s1", rolle: "spieler", name: "Ben" } as const;
  welt.zurueckhalten = true;
  const erste = kanal.anmelden(eins);
  const zweite = kanal.anmelden(zwei);
  welt.offen[1]("ok");
  await zweite;
  welt.offen[0]("ok");
  await erste;

  welt.zurueckhalten = false;
  welt.status("SUBSCRIBED");
  expect(welt.angemeldet.at(-1)).toEqual(zwei);
});

test("ein Stand in Presence (ältere Fassung der App) fällt weg", async () => {
  const { client, welt } = nachgebauterClient();
  const verbunden = raumKanalUeber(client)("ABCD", "s1").verbinden();
  welt.zustand = {
    a: [
      {
        schluessel: "a",
        rolle: "spieler",
        name: "Anna",
        stand: { spiel: "x", abgehakt: 1, bingo: false },
      },
    ],
  };
  welt.ausloesen("presence", "sync");
  expect(await verbunden).toEqual([
    { schluessel: "a", rolle: "spieler", name: "Anna" },
  ]);
});

test("raumNachrichtLesen nimmt gültige Nachrichten und verwirft andere", () => {
  const tisch = { art: "tisch", stand: { spiel: "x", runde: null, bingo: [] } };
  const spieler = {
    art: "spieler",
    name: "Anna",
    stand: { spiel: "x", abgehakt: 1, bingo: false },
  };
  for (const gut of [
    { art: "geschlossen" },
    { art: "anfrage" },
    { art: "tisch", stand: null },
    tisch,
    spieler,
  ]) {
    expect(raumNachrichtLesen(gut)).toEqual(gut);
  }
  for (const schlecht of [
    null,
    "anfrage",
    { art: "unbekannt" },
    { art: "tisch", stand: { spiel: "x" } },
    { art: "tisch" },
    { ...spieler, name: 3 },
    { ...spieler, stand: { spiel: "x" } },
  ]) {
    expect(raumNachrichtLesen(schlecht)).toBeNull();
  }
});

test("beiNachricht übergeht Nachrichten in falscher Form", () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  const empfangen: unknown[] = [];
  kanal.beiNachricht((n) => empfangen.push(n));
  kanal.verbinden();

  welt.ausloesen("broadcast", "nachricht", {
    art: "tisch",
    stand: { spiel: "x" },
  });
  welt.ausloesen("broadcast", "nachricht", { art: "anfrage" });
  expect(empfangen).toEqual([{ art: "anfrage" }]);
});

test("beiVerbunden meldet jedes SUBSCRIBED, bis abgemeldet", () => {
  const { client, welt } = nachgebauterClient();
  const kanal = raumKanalUeber(client)("ABCD", "s1");
  let verbunden = 0;
  const abmelden = kanal.beiVerbunden(() => verbunden++);
  // CHANNEL_ERROR lehnt verbinden() ab, das zählt hier nicht.
  kanal.verbinden().catch(() => {});

  welt.status("SUBSCRIBED");
  welt.status("CHANNEL_ERROR");
  welt.status("SUBSCRIBED");
  abmelden();
  welt.status("SUBSCRIBED");
  expect(verbunden).toBe(2);
});
