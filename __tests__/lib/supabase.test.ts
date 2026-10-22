import { afterEach, expect, test, vi } from "vitest";
import { supabaseClient, supabaseKonfiguriert } from "@/lib/supabase";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("ohne URL oder Schlüssel ist Supabase nicht eingerichtet", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  expect(supabaseKonfiguriert()).toBe(false);

  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
  expect(supabaseKonfiguriert()).toBe(false);
});

test("mit URL und Schlüssel ist Supabase eingerichtet", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
  expect(supabaseKonfiguriert()).toBe(true);
});

test("supabaseClient liefert immer denselben Client", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
  expect(supabaseClient()).toBe(supabaseClient());
});
