import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// URL und publishable key des Supabase-Projekts aus .env.local. Bei jedem Aufruf gelesen,
// damit Tests sie setzen können.
function url(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
}

function schluessel(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || undefined;
}

export function supabaseKonfiguriert(): boolean {
  return url() !== undefined && schluessel() !== undefined;
}

let client: SupabaseClient | undefined;

// Ein Client für die ganze App, damit alle Räume über dieselbe Realtime-Verbindung laufen.
export function supabaseClient(): SupabaseClient {
  client ??= createClient(url()!, schluessel()!);
  return client;
}
