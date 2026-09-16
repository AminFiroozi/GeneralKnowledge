export const MAX_PATH_BYTES = 45;

export function buildPath(parentPath: string | null, id: number): string {
  const base = parentPath ?? "/";
  return `${base}${id}/`;
}

export function depthFromPath(path: string): number {
  return path.split("/").filter(Boolean).length - 1;
}

export function parentPathOf(path: string): string {
  const trimmed = path.slice(0, -1); // drop trailing '/'
  const idx = trimmed.lastIndexOf("/");
  return trimmed.slice(0, idx + 1); // "/" for a top-level path
}

/**
 * Half-open [lo, hi) range that matches `path` and every descendant path,
 * without LIKE. Works because '/' (0x2F) sorts immediately below '0' (0x30):
 * the successor of a path ending in '/' is that same string with the
 * trailing '/' replaced by '0'.
 */
export function prefixRange(path: string): { lo: string; hi: string } {
  return { lo: path, hi: `${path.slice(0, -1)}0` };
}

export function assertPathLength(path: string): void {
  if (new TextEncoder().encode(path).length > MAX_PATH_BYTES) {
    throw new Error(`category path exceeds ${MAX_PATH_BYTES} bytes: ${path}`);
  }
}
