// Nachgebaute JSON-Antwort von Spotify für Tests.
export function antwort(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}
