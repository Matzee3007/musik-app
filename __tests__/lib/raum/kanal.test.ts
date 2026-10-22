import { expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { raumKanalUeber } from "@/lib/raum/kanal";

type Rueckruf = (daten: { payload?: unknown }) => void;

// Nachbau des Supabase-Clients: merkt sich, was der Kanal aufruft, und lässt den Test Ereignisse
// auslösen. Wie das Original lehnt er Rückrufe nach subscribe() und ein zweites subscribe() ab.
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
      return "ok";
    },
    async send(nachricht: unknown) {
      welt.gesendet.push(nachricht);
      return "ok";
    },
  };
  const client = {
    channel(name: string, optionen: { config: unknown }) {
      welt.name = name;
      welt.config = optionen.config;
      return kanal;
    },
    async removeChannel() {
      welt.entfernt = true;
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
