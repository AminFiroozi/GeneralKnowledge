function normalizeBody(body: string): string {
  return body.trim().toLowerCase().replace(/\s+/g, " ");
}

/** sha256 hex digest of the normalized fact body, used for de-duplication. */
export async function bodyHash(body: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeBody(body));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
